import type { FieldHook } from "payload";
import type { User } from "../../../../payload-types";

export const ensureFirstUserIsAdmin: FieldHook<User> = async ({
  operation,
  req,
  value,
}) => {
  if (operation !== "create") return value;
  const { totalDocs } = await req.payload.count({
    collection: "users",
    overrideAccess: true,
    req,
  });
  return totalDocs === 0 ? ["admin"] : value;
};
