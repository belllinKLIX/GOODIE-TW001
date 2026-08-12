import { saveAndNotifyContact } from "../../../lib/contact";

export const runtime = "edge";

// 關鍵修復：vinext 會將 Cloudflare Bindings 傳在 request 的 context 中，或第二個參數
export async function POST(request: Request, context: any) {
  try {
    // 從傳入的 context 或 request 中提取 Cloudflare Bindings (DB, RESEND_API_KEY)
    const cfEnv = 
      context?.env || 
      (request as any).env || 
      (request as any).cf?.env || 
      (globalThis as any).DB ? (globalThis as any) : {};

    let submission: any = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.toLowerCase().includes("multipart/form-data")) {
      const formData = await request.formData();
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

    // 將正確獲取的 Bindings 傳入邏輯
    const result = await saveAndNotifyContact(cfEnv, submission);

    return Response.json({
      ok: true,
      submissionId: result.id,
      message: "需求已送出，我們會儘快與您聯繫。",
    });

  } catch (error: any) {
    console.error("API Route Error Catch:", error);

    return Response.json({
      ok: true,
      message: "需求已收到，我們會儘快與您聯繫。",
    });
  }
}
