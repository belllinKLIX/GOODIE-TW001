import type { ContactBindings } from "./lib/contact";

declare module "cloudflare:workers" {
  export const env: ContactBindings;
}
