import { parseContactForm, saveAndNotifyContact } from "../../../lib/contact";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    let submission: any = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.toLowerCase().includes("multipart/form-data")) {
      const formData = await request.formData();
      // 關鍵修復：使用 parseContactForm 解析，自動產生 referenceFileName 與 FileKey
      submission = parseContactForm(formData);
    } else {
      const json = await request.json().catch(() => ({}));
      submission = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...json
      };
    }

    // 安全取得 Cloudflare 注入的 Bindings
    const g = globalThis as any;
    const p = (process as any).env || {};

    const activeEnv = {
      DB: g.DB || g.__env__?.DB || p.DB,
      RESEND_API_KEY: g.RESEND_API_KEY || g.__env__?.RESEND_API_KEY || p.RESEND_API_KEY,
      UPLOADS: g.UPLOADS || g.__env__?.UPLOADS || p.UPLOADS,
    };

    // 呼叫寄信與存庫邏輯
    const result = await saveAndNotifyContact(activeEnv as any, submission);

    return Response.json({
      ok: true,
      submissionId: result.id,
      message: "需求已送出，我們會儘快與您聯繫。",
    });

  } catch (error: any) {
    console.error("API Route Error Catch:", error);

    return Response.json({
      ok: false,
      message: error.message || "處理請求時發生錯誤，請稍後再試。",
    }, { status: 400 });
  }
}
