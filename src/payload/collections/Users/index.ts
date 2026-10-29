import type { CollectionConfig } from "payload";
import { adminFieldAccess, admins } from "../../access/admins";
import { adminsAndUser } from "./access/adminsAndUser";
import { checkRole } from "./checkRole";
import { ensureFirstUserIsAdmin } from "./hooks/ensureFirstUserIsAdmin";

export const Users: CollectionConfig = {
  slug: "users",
  auth: { tokenExpiration: 172800, maxLoginAttempts: 10 },
  versions: false,
  access: {
    create: admins,
    delete: admins,
    read: adminsAndUser,
    update: adminsAndUser,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "roles"],
    hidden: ({ user }) => !checkRole(["admin"], user),
  },
  fields: [
    { name: "name", label: "Name", type: "text" },
    {
      name: "roles",
      label: "Rollen",
      type: "select",
      hasMany: true,
      defaultValue: ["editor"],
      saveToJWT: true,
      access: { create: adminFieldAccess, update: adminFieldAccess },
      hooks: { beforeChange: [ensureFirstUserIsAdmin] },
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
    },
  ],
};
