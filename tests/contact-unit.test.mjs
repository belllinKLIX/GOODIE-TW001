import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContactEmailHtml,
  parseContactForm,
  saveAndNotifyContact,
} from "../lib/contact.ts";

function createDbMock() {
  const calls = [];
  return {
    calls,
    prepare(query) {
      const call = { query: query.replace(/\s+/g, " ").trim(), values: [] };
      calls.push(call);
      return {
        bind(...values) {
          call.values = values;
          return this;
        },
        async run() {
          return { success: true };
        },
        async first() {
          return null;
        },
      };
    },
  };
}

function createSubmission() {
  const form = new FormData();
  form.set("name", "王小明");
  form.set("company", "好物有限公司");
  form.set("email", "buyer@example.com");
  form.set("phone", "+886-2-77137118");
  form.set("projectType", "員工迎新禮盒");
  form.set("timeline", "1–3 個月");
  form.set("quantity", "500–1,000");
  form.set("description", "需要企業客製禮盒與打樣報價。");
  return parseContactForm(form);
}

test("parses and validates all Goodie inquiry fields", () => {
  const submission = createSubmission();
  assert.equal(submission.company, "好物有限公司");
  assert.equal(submission.projectType, "員工迎新禮盒");
  assert.equal(submission.timeline, "1–3 個月");
  assert.equal(submission.quantity, "500–1,000");
  assert.match(submission.id, /^[0-9a-f-]{36}$/i);
});

test("escapes customer content in the HTML notification", () => {
  const submission = createSubmission();
  submission.description = '<script>alert("x")</script>';
  const html = buildContactEmailHtml(submission);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test("stores the D1 record and sends Resend notification", async () => {
  const submission = createSubmission();
  const db = createDbMock();
  let request;
  const fetcher = async (url, init) => {
    request = { url: String(url), init };
    return Response.json({ id: "resend-test-id" });
  };

  const result = await saveAndNotifyContact(
    { DB: db, RESEND_API_KEY: "test-key" },
    submission,
    fetcher,
  );

  assert.equal(result.resendEmailId, "resend-test-id");
  assert.match(db.calls[0].query, /^INSERT INTO contact_inquiries/i);
  assert.deepEqual(db.calls[0].values.slice(1, 9), [
    "王小明",
    "好物有限公司",
    "buyer@example.com",
    "+886-2-77137118",
    "員工迎新禮盒",
    "1–3 個月",
    "500–1,000",
    "需要企業客製禮盒與打樣報價。",
  ]);
  assert.equal(request.url, "https://api.resend.com/emails");
  const email = JSON.parse(request.init.body);
  assert.deepEqual(email.to, ["bell.lin@klixtw.com"]);
  assert.equal(email.reply_to, "buyer@example.com");
  assert.match(email.html, /好物有限公司/);
  assert.match(db.calls[1].query, /^UPDATE contact_inquiries SET email_status = 'sent'/i);
});
