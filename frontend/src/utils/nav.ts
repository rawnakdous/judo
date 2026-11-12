/** A nav item is active on its own page and on its sub-pages ("/events" matches "/events/12/live"). */
export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
