import { revalidatePath } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  RequestContext,
} from "payload";

export function revalidate(context: RequestContext): void {
  if (context.disableRevalidate) return;
  try {
    revalidatePath("/", "layout");
  } catch {
    // Local API scripts have no Next request/cache context.
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({
  doc,
  context,
}) => {
  revalidate(context);
  return doc;
};

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({
  doc,
  context,
}) => {
  revalidate(context);
  return doc;
};

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, context }) => {
  revalidate(context);
  return doc;
};
