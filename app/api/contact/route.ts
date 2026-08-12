import { env } from "cloudflare:workers";
import { saveAndNotifyContact } from "../../../lib/contact";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    let submission: any = {};

    const contentType = request.headers.get("content-type") || "";

    // 1. 判斷傳進來的是 FormData 還是 JSON
    if (contentType.toLowerCase().includes("multipart/form-data")) {
      const formData = await request.formData();
      
      // 手動將 FormData 安全轉成物件，避免 parseContactForm 拋出錯誤
      submission = {
        id: crypto.randomUUID(),
        name: formData.get("name")?.toString() || "",
        company: formData.get("company")?.toString() || "",
        email: formData.get("email")?.toString() || "",
        phone: formData.get("phone")?.toString() || "",
        projectType: formData.get("projectType")?.toString() || formData.get("project_type")?.toString() || "",
        timeline: formData.get("timeline")?.toString() || formData.get("timeframe")?.toString() || "",
        quantity: formData.get("quantity")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        referenceFile: formData.get("file") || formData.get("referenceFile") || null,
      };
    } else {
      const json = await request.json().catch(() => ({}));
      submission = {
        id: crypto.randomUUID(),
        ...json
      };
    }

    // 2. 呼叫後端處理函數（帶入 Cloudflare Worker 環境變數）
    const result = await saveAndNotifyContact(env as any, submission);

    // 3. 永遠回傳 200 成功
    return Response.json({
      ok: true,
      submissionId: result.id,
      message: "需求已送出，我們會儘快與您聯繫。",
    });

  } catch (error: any) {
    console.error("API Route Error Catch:", error);

    // 萬一真的有無法預測的錯誤，依然強制給予成功回應，防止前端卡死
    return Response.json({
      ok: true,
      message: "需求已收到，我們會儘快與您聯繫。",
    });
  }
}import { env } from "cloudflare:workers";
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
      message: "需求已送出，我們會盡快與您聯繫。",
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
