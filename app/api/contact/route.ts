import { env } from "cloudflare:workers";
import {
  ContactValidationError,
  parseContactForm,
  saveAndNotifyContact,
} from "../../../lib/contact";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return Response.json({ ok: false, message: "表單格式不正確。" }, { status: 415 });
    }

    const submission = parseContactForm(await request.formData());
    const result = await saveAndNotifyContact(env, submission);

    return Response.json({
      ok: true,
      submissionId: result.id,
      notificationSent: result.notificationSent,
      message: result.notificationSent
        ? "需求已送出，我們會盡快與您聯繫。"
        : "需求已成功保存；通知信暫時未寄出，我們仍可在系統中看到您的資料。",
    });
  } catch (error) {
    if (error instanceof ContactValidationError) {
      return Response.json({ ok: false, message: error.message }, { status: 400 });
    }
    console.error("Contact form submission failed", error);
    return Response.json({
      ok: false,
      message: "目前無法送出，請稍後再試，或使用右下角 LINE 與我們聯絡。",
    }, { status: 500 });
  }
}
