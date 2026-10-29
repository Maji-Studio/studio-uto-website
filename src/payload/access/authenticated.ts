import type { Access } from "payload";

export const authenticated: Access = ({ req: { user } }) =>
  user?.collection === "users";
