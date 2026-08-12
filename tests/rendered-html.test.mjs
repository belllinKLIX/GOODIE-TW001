import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

function countNamedFields(html) {
  return (html.match(/<(?:input|select|textarea)\b[^>]*\bname=/gi) ?? []).length;
}

test("server-renders the Goodie homepage and expanded hero headline", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Goodie｜品牌商品專案服務<\/title>/);
  assert.match(html, /class="headline-line"/);
  assert.match(html, /<em>goodie<\/em>[\s\S]*things/);
  assert.match(html, /class="contact-band contact-band-full"/);
  assert.equal(countNamedFields(html), 9);
});

test("uses the same nine-field inquiry form on every content page", async () => {
  const paths = [
    "/about",
    "/services",
    "/cases",
    "/process",
    "/cases/acme-welcome-kit",
  ];

  for (const pathname of paths) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, /class="contact-band contact-band-full"/, pathname);
    assert.equal(countNamedFields(html), 9, pathname);
  }
});

test("keeps the standalone contact page on the shared nine-field form", async () => {
  const response = await render("/contact");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /class="contact-page"/);
  assert.match(html, /準備好與我們/);
  assert.equal(countNamedFields(html), 9);
});
