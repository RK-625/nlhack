import { adminAc, userAc } from "better-auth/plugins/admin/access";

// Custom role names must be registered in `roles`, otherwise setRole/createUser reject them.
// employee mirrors the built-in "user" role (no admin permissions); admin is the built-in admin role.
export const roles = { employee: userAc, admin: adminAc };
