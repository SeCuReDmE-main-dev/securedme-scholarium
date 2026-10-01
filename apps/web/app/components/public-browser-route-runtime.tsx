"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Tell the public adapter to reevaluate its allowlist after navigation.
 * The event carries no path, account identifier or learning content.
 */
export function PublicBrowserRouteRuntime() {
  const pathname = usePathname();
  useEffect(() => {
    window.dispatchEvent(new Event("securedme:public-route-change"));
  }, [pathname]);
  return null;
}
