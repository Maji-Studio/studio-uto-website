import type { Access, FieldAccess } from "payload";
import { checkRole } from "../collections/Users/checkRole";

export const admins: Access = ({ req: { user } }) => checkRole(["admin"], user);
export const adminFieldAccess: FieldAccess = ({ req: { user } }) =>
  checkRole(["admin"], user);
