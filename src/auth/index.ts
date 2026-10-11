import { resolve } from "node:path";
import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { admin, username } from "better-auth/plugins";
import { dataDir } from "../data-dir";
import { roles } from "./roles";

export const auth = betterAuth({
  appName: "nlhack",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: new Database(resolve(dataDir(), "auth.db")),
  // Users are created only by the seed script via the admin API.
  emailAndPassword: { enabled: true, disableSignUp: true },
  plugins: [
    username(),
    admin({ roles, defaultRole: "employee", adminRoles: ["admin"] }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type Role = "admin" | "employee";
