import type { Access } from "payload";
import { checkRole } from "../checkRole";

export const adminsAndUser: Access = ({ req: { user } }) => {
  if (!user) return false;
  return checkRole(["admin"], user) || { id: { equals: user.id } };
};
