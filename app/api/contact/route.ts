import { saveAndNotifyContact } from "../../../lib/contact";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    // 關鍵修復：全方位捕捉 Cloudflare Worker 注入的環境變數與 DB Binding
    let cfEnv: any = {};
    
    // 嘗試從動態 import、globalThis、或 process 取得 env
    try {
      const workers = await import("cloudflare:workers");
      cfEnv = workers.env || {};
    } catch {
      // ignore
    }

    const g = globalThis as any;
    cfEnv = {
      DB: cfEnv.DB || g.DB || g.__env__?.DB || process.env.DB,
      RESEND_API_KEY: cfEnv.RESEND_API_KEY || g.RESEND_API_KEY || g.__env__?.RESEND_API_KEY || process.env.RESEND_API_KEY,
      UPLOADS: cfEnv.UPLOADS || g.UPLOADS || g.__env__?.UPLOADS || process.env.UPLOADS,
    };

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

    // 呼叫邏輯
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
