// react-dom ships without types here; this is the one call the studio uses.
declare module "react-dom/client" {
  import type { ReactNode } from "react";
  export function createRoot(container: Element): { render(node: ReactNode): void };
}
