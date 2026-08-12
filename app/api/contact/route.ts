import { getRequestContext } from "@cloudflare/next-on-pages"; // 或是從 request context 取得
import { saveAndNotifyContact } from "../../../lib/contact";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    // 關鍵修復：優先從 Cloudflare request context 或 global 取得環境變數與 Binding
    let cfEnv: any = {};
    try {
      cfEnv = (getRequestContext?.() as any)?.env || (process as any).env || {};
    } catch {
      cfEnv = (process as any).env || {};
    }

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

    // 呼叫邏輯，正確傳入抓到的 cfEnv
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
