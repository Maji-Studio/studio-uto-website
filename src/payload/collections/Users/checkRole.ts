import type { User } from "payload";

export const checkRole = (
  roles: readonly ("admin" | "editor")[],
  user?: User | null,
): boolean => Boolean(user?.roles?.some((role) => roles.includes(role)));
