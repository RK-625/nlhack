import { createHash, randomBytes } from "node:crypto";
import { decryptToken, encryptToken, loadTokenKey } from "./crypto";
import {
  PENDING_TTL_MS,
  deleteConnection,
  deletePending,
  getConnection,
  getPending,
  savePending,
  upsertConnection,
} from "./store";

// Per-user OAuth 2.1 (authorization code + PKCE S256) against cfo.ai's authorization server,
// done with plain fetch: discovery -> authorize URL -> code exchange -> refresh.

export const CFO_MCP_URL = "https://api.cfo.ai/mcp";
const RESOURCE_METADATA_URL = "https://api.cfo.ai/.well-known/oauth-protected-resource/mcp";
export const CFO_SCOPES = "openid profile email offline_access";
const DISCOVERY_TTL_MS = 60 * 60 * 1000;
const REFRESH_SKEW_MS = 60 * 1000;
const DEFAULT_TTL_S = 3600;

export type AuthServerMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  code_challenge_methods_supported?: string[];
};

export type CfoDiscovery = { resource: string; authServer: AuthServerMetadata };

type TokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

export class CfoOAuthError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "CfoOAuthError";
  }
}

// Public origin used for the redirect URI (APP_URL, else BETTER_AUTH_URL).
export function appBaseUrl(): string {
  return (process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function cfoRedirectUri(): string {
  return `${appBaseUrl()}/api/cfo/callback`;
}

// Reason the connection cannot be used, or null when CFO_OAUTH_CLIENT_ID and CFO_TOKEN_KEY are valid.
export function cfoConfigError(): string | null {
  if (!process.env.CFO_OAUTH_CLIENT_ID?.trim()) return "CFO_OAUTH_CLIENT_ID is not set (run `npm run cfo:register`)";
  try {
    loadTokenKey();
  } catch (error: unknown) {
    return (error as Error).message;
  }
  return null;
}

function clientId(): string {
  const id = process.env.CFO_OAUTH_CLIENT_ID?.trim();
  if (!id) throw new CfoOAuthError("not_configured", "CFO_OAUTH_CLIENT_ID is not set");
  return id;
}

async function getJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new CfoOAuthError("discovery_failed", `GET ${url} returned ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

// RFC 8414 well-known URL, inserting the issuer path after the well-known segment.
function wellKnown(issuer: string, suffix: string): string {
  const u = new URL(issuer);
  const path = u.pathname.replace(/\/+$/, "");
  return `${u.origin}/.well-known/${suffix}${path}`;
}

let discoveryCache: { at: number; value: Promise<CfoDiscovery> } | null = null;

// Protected resource metadata (RFC 9728) -> authorization server metadata (RFC 8414 / OIDC).
export function discoverCfo(): Promise<CfoDiscovery> {
  if (discoveryCache && Date.now() - discoveryCache.at < DISCOVERY_TTL_MS) return discoveryCache.value;
  const value = (async () => {
    const prm = await getJson(RESOURCE_METADATA_URL);
    const resource = typeof prm.resource === "string" ? prm.resource : CFO_MCP_URL;
    const servers = prm.authorization_servers;
    if (!Array.isArray(servers) || typeof servers[0] !== "string") {
      throw new CfoOAuthError("discovery_failed", "No authorization server in cfo.ai resource metadata");
    }
    const issuer = servers[0];
    let meta: Record<string, unknown>;
    try {
      meta = await getJson(wellKnown(issuer, "oauth-authorization-server"));
    } catch {
      meta = await getJson(wellKnown(issuer, "openid-configuration"));
    }
    if (typeof meta.authorization_endpoint !== "string" || typeof meta.token_endpoint !== "string") {
      throw new CfoOAuthError("discovery_failed", "Authorization server metadata is missing endpoints");
    }
    const methods = meta.code_challenge_methods_supported;
    if (Array.isArray(methods) && !methods.includes("S256")) {
      throw new CfoOAuthError("discovery_failed", "Authorization server does not support PKCE S256");
    }
    return { resource, authServer: { ...(meta as AuthServerMetadata), issuer: (meta.issuer as string) ?? issuer } };
  })();
  discoveryCache = { at: Date.now(), value };
  value.catch(() => {
    if (discoveryCache?.value === value) discoveryCache = null;
  });
  return value;
}

const b64url = (buf: Buffer) => buf.toString("base64url");

export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = b64url(randomBytes(32));
  return { verifier, challenge: b64url(createHash("sha256").update(verifier).digest()) };
}

// Pure URL builder (exported for tests).
export function buildAuthorizeUrl(
  authorizationEndpoint: string,
  p: { clientId: string; redirectUri: string; state: string; challenge: string; resource: string; scope: string },
): string {
  const url = new URL(authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", p.clientId);
  url.searchParams.set("redirect_uri", p.redirectUri);
  url.searchParams.set("scope", p.scope);
  url.searchParams.set("state", p.state);
  url.searchParams.set("code_challenge", p.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("resource", p.resource);
  return url.toString();
}

// Create a user-bound pending state + PKCE verifier and return the authorize URL to redirect to.
export async function startCfoAuthorization(userId: string): Promise<string> {
  const cid = clientId();
  const key = loadTokenKey();
  const { resource, authServer } = await discoverCfo();
  const state = b64url(randomBytes(32));
  const { verifier, challenge } = pkcePair();
  savePending({
    state,
    user_id: userId,
    code_verifier_enc: encryptToken(verifier, `pending:${state}`, key),
    created_at: Date.now(),
  });
  return buildAuthorizeUrl(authServer.authorization_endpoint, {
    clientId: cid,
    redirectUri: cfoRedirectUri(),
    state,
    challenge,
    resource,
    scope: CFO_SCOPES,
  });
}

// Validate and consume a pending state for this user; returns the PKCE verifier.
export function consumePendingState(userId: string, state: string, now = Date.now()): string {
  const row = getPending(state);
  if (!row) throw new CfoOAuthError("invalid_state", "Unknown or already used OAuth state");
  if (row.user_id !== userId) throw new CfoOAuthError("state_user_mismatch", "OAuth state belongs to another user");
  deletePending(state);
  if (now - row.created_at > PENDING_TTL_MS) throw new CfoOAuthError("state_expired", "OAuth state expired");
  return decryptToken(row.code_verifier_enc, `pending:${state}`);
}

// Read claims from a JWT access token without verifying it (informational only: exp, org_id).
function jwtClaims(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) return {};
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function postToken(tokenEndpoint: string, body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof json.access_token !== "string") {
    // Only the standard error code is surfaced; descriptions and bodies may echo inputs.
    const code = typeof json.error === "string" ? json.error : `http_${res.status}`;
    throw new CfoOAuthError(code, `Token endpoint returned ${res.status} (${code})`);
  }
  return json as unknown as TokenResponse;
}

function persistTokens(userId: string, tokens: TokenResponse, previousRefreshEnc: string | null): void {
  const key = loadTokenKey();
  const claims = jwtClaims(tokens.access_token);
  const expiresAt =
    typeof tokens.expires_in === "number"
      ? Date.now() + tokens.expires_in * 1000
      : typeof claims.exp === "number"
        ? claims.exp * 1000
        : Date.now() + DEFAULT_TTL_S * 1000;
  upsertConnection({
    user_id: userId,
    access_token_enc: encryptToken(tokens.access_token, `access:${userId}`, key),
    // Keep the old refresh token when the server does not rotate it.
    refresh_token_enc: tokens.refresh_token
      ? encryptToken(tokens.refresh_token, `refresh:${userId}`, key)
      : previousRefreshEnc,
    expires_at: expiresAt,
    scope: tokens.scope ?? null,
    org_id: typeof claims.org_id === "string" ? claims.org_id : null,
  });
}

// Handle the redirect back from the authorization server for the signed-in user.
export async function completeCfoAuthorization(userId: string, params: URLSearchParams): Promise<void> {
  const state = params.get("state");
  if (!state) throw new CfoOAuthError("missing_state", "Callback has no state");
  const verifier = consumePendingState(userId, state);
  const { resource, authServer } = await discoverCfo();
  const iss = params.get("iss");
  if (iss && iss !== authServer.issuer) throw new CfoOAuthError("issuer_mismatch", "Callback issuer does not match");
  const error = params.get("error");
  if (error) throw new CfoOAuthError(error, `Authorization failed (${error})`);
  const code = params.get("code");
  if (!code) throw new CfoOAuthError("missing_code", "Callback has no code");
  const tokens = await postToken(authServer.token_endpoint, {
    grant_type: "authorization_code",
    code,
    redirect_uri: cfoRedirectUri(),
    client_id: clientId(),
    code_verifier: verifier,
    resource,
  });
  persistTokens(userId, tokens, null);
}

export function getCfoStatus(userId: string): { connected: boolean; expiresAt?: string } {
  const row = getConnection(userId);
  if (!row) return { connected: false };
  return { connected: true, expiresAt: new Date(row.expires_at).toISOString() };
}

export function disconnectCfo(userId: string): boolean {
  return deleteConnection(userId);
}

const refreshing = new Map<string, Promise<string | null>>();

async function refreshAccessToken(userId: string): Promise<string | null> {
  const row = getConnection(userId);
  if (!row) return null;
  if (!row.refresh_token_enc) {
    // Expired with nothing to refresh it with: the connection is dead, so status should say so.
    console.warn(`cfo.ai access token for user ${userId} expired and no refresh token is stored`);
    deleteConnection(userId);
    return null;
  }
  try {
    const refreshToken = decryptToken(row.refresh_token_enc, `refresh:${userId}`);
    const { resource, authServer } = await discoverCfo();
    const tokens = await postToken(authServer.token_endpoint, {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId(),
      resource,
    });
    persistTokens(userId, tokens, row.refresh_token_enc);
    return tokens.access_token;
  } catch (error: unknown) {
    const code = error instanceof CfoOAuthError ? error.code : "refresh_error";
    console.warn(`cfo.ai token refresh failed for user ${userId}: ${code}`);
    // A rejected refresh token will never work again; drop the connection so status shows disconnected.
    if (code === "invalid_grant") deleteConnection(userId);
    return null;
  }
}

// A valid access token for this user (refreshed when it expires within 60s and the rotated tokens
// persisted, encrypted), or null if not configured, not connected, or the refresh fails. A refresh
// the server rejects (invalid_grant), or an expired token with no refresh token, removes the
// connection; transient failures and undecryptable rows (e.g. a changed CFO_TOKEN_KEY) keep it.
// Concurrent callers share one refresh so a rotated refresh token is used once.
export async function getCfoAccessToken(userId: string): Promise<string | null> {
  if (cfoConfigError()) return null;
  const row = getConnection(userId);
  if (!row) return null;
  if (row.expires_at - Date.now() > REFRESH_SKEW_MS) {
    try {
      return decryptToken(row.access_token_enc, `access:${userId}`);
    } catch {
      console.warn(`cfo.ai access token for user ${userId} could not be decrypted`);
      return null;
    }
  }
  let pending = refreshing.get(userId);
  if (!pending) {
    pending = refreshAccessToken(userId).finally(() => refreshing.delete(userId));
    refreshing.set(userId, pending);
  }
  return pending;
}
