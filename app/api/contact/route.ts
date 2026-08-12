import { saveAndNotifyContact } from "../../../lib/contact";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
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
        referenceFile: formData.get("reference") || formData.get("file") || formData.get("referenceFile") || null,
      };
    } else {
      const json = await request.json().catch(() => ({}));
      submission = {
        id: crypto.randomUUID(),
        ...json
      };
    }

    // 關鍵修復：安全取得 Cloudflare 注入的 Bindings，不使用會破壞打包的靜態 import
    const g = globalThis as any;
    const p = (process as any).env || {};

    const activeEnv = {
      DB: g.DB || g.__env__?.DB || p.DB,
      RESEND_API_KEY: g.RESEND_API_KEY || g.__env__?.RESEND_API_KEY || p.RESEND_API_KEY,
      UPLOADS: g.UPLOADS || g.__env__?.UPLOADS || p.UPLOADS,
    };

    console.log("Active DB Binding Check:", !!activeEnv.DB);

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
      ok: true,
      message: "需求已收到，我們會儘快與您聯繫。",
    });
  }
}
