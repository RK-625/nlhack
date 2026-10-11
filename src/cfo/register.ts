import { cfoRedirectUri, discoverCfo } from "./oauth";

// One-time Dynamic Client Registration (RFC 7591) of this app as a public cfo.ai OAuth client.
// Prints only the client_id; put it in .env as CFO_OAUTH_CLIENT_ID.

const { authServer } = await discoverCfo();
if (!authServer.registration_endpoint) {
  console.error("cfo.ai authorization server does not advertise a registration_endpoint");
  process.exit(1);
}

const redirectUri = cfoRedirectUri();
const res = await fetch(authServer.registration_endpoint, {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({
    client_name: "nlhack CFO Agent",
    redirect_uris: [redirectUri],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    scope: "openid profile email offline_access",
  }),
});
const body = (await res.json().catch(() => ({}))) as { client_id?: string; error?: string };
if (!res.ok || !body.client_id) {
  console.error(`Registration failed: HTTP ${res.status}${body.error ? ` (${body.error})` : ""}`);
  process.exit(1);
}

console.log(`Registered public client for redirect URI ${redirectUri}`);
console.log(`Add this line to .env, then restart the server:\n\nCFO_OAUTH_CLIENT_ID=${body.client_id}\n`);
console.log("Re-run this command if APP_URL / BETTER_AUTH_URL changes (the redirect URI is fixed at registration).");
