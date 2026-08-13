declare module "cloudflare:workers" {
  export const env: import("./lib/contact").ContactBindings;
}
