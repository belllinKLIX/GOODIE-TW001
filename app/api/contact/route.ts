import { saveAndNotifyContact } from "../../../lib/contact";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    // vinext / Cloudflare Worker 原生讀取 Binding 變數的方式
    const globalObj = globalThis as any;
    const cfEnv = {
      DB: globalObj?.DB || globalObj?.__env__?.DB || process.env.DB,
      RESEND_API_KEY: globalObj?.RESEND_API_KEY || globalObj?.__env__?.RESEND_API_KEY || process.env.RESEND_API_KEY,
      UPLOADS: globalObj?.UPLOADS || globalObj?.__env__?.UPLOADS || process.env.UPLOADS,
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

    // 將整理好的 cfEnv 傳入後端處理函數
    const result = await saveAndNotifyContact(cfEnv as any, submission);

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
