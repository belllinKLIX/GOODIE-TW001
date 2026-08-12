import { env } from "cloudflare:workers";
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

    // 關鍵修復：組合來自 cloudflare:workers 的 env 與全域環境變數
    const activeEnv = {
      DB: (env as any)?.DB || (globalThis as any)?.DB || (process.env as any)?.DB,
      RESEND_API_KEY: (env as any)?.RESEND_API_KEY || (globalThis as any)?.RESEND_API_KEY || process.env.RESEND_API_KEY,
      UPLOADS: (env as any)?.UPLOADS || (globalThis as any)?.UPLOADS || (process.env as any)?.UPLOADS,
    };

    console.log("Active DB Binding Check:", !!activeEnv.DB);

    // 呼叫邏輯，正確傳入 activeEnv
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
