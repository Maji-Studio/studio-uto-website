export function normalizeSlug(slug: string) {
  return slug.trim().replace(/^\/+|\/+$/g, "");
}

export function exampleHref(slug: string) {
  return `/examples/${normalizeSlug(slug)}/`;
}

export function isRouteActive(currentPath: string, href: string) {
  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath === href || currentPath.startsWith(href);
}
