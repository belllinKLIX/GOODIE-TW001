import { saveAndNotifyContact } from "../../../lib/contact";

export const runtime = "edge";

function getFileExtension(filename: string) {
  return filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";
}

function makeSafeFilename(filename: string) {
  const ext = getFileExtension(filename);
  const cleanName = filename.replace(/[^\w\u4e00-\u9fa5.-]/g, "_").slice(0, 80);
  return cleanName || `file_${Date.now()}.${ext || 'png'}`;
}

export async function POST(request: Request, context?: any) {
  try {
    let submission: any = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.toLowerCase().includes("multipart/form-data")) {
      const formData = await request.formData();
      
      const fileEntry = formData.get("reference") || formData.get("file") || formData.get("referenceFile");
      let file: File | null = null;
      
      if (fileEntry && typeof fileEntry === "object" && "size" in fileEntry && (fileEntry as any).size > 0) {
        file = fileEntry as File;
      }

      const id = crypto.randomUUID();
      const fileName = file ? makeSafeFilename(file.name) : null;

      submission = {
        id,
        name: formData.get("name")?.toString().trim() || "未填寫",
        company: formData.get("company")?.toString().trim() || "未填寫",
        email: formData.get("email")?.toString().trim().toLowerCase() || "",
        phone: formData.get("phone")?.toString().trim() || "",
        projectType: formData.get("projectType")?.toString() || formData.get("project_type")?.toString() || "一般諮詢",
        timeline: formData.get("timeline")?.toString() || "",
        quantity: formData.get("quantity")?.toString() || "",
        description: formData.get("description")?.toString() || "無描述",
        
        referenceFile: file,
        referenceFileName: fileName,
        referenceFileType: file?.type || "image/png",
        referenceFileSize: file?.size || 0,
        referenceFileKey: file ? `contact-submissions/${new Date().toISOString().slice(0, 7)}/${id}/${fileName}` : null,
        referenceFileToken: file ? crypto.randomUUID() : null,
        referenceFileUrl: null,
        createdAt: new Date().toISOString(),
      };
    } else {
      const json = await request.json().catch(() => ({}));
      submission = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...json
      };
    }

    // 關鍵修復：窮舉所有可能的 Cloudflare Bindings 注入位置
    const g = globalThis as any;
    const p = (process as any).env || {};
    const reqAny = request as any;

    // 嘗試從 Cloudflare 官方的全域/Context 物件提值
    let cfEnv: any = {};
    try {
      if (typeof g.getCLOUDFLARE_CONTEXT === "function") {
        cfEnv = g.getCLOUDFLARE_CONTEXT().env;
      }
    } catch (e) {}

    const activeEnv = {
      DB: reqAny.env?.DB || reqAny.context?.env?.DB || context?.env?.DB || cfEnv.DB || g.DB || g.__env__?.DB || p.DB,
      RESEND_API_KEY: reqAny.env?.RESEND_API_KEY || reqAny.context?.env?.RESEND_API_KEY || context?.env?.RESEND_API_KEY || cfEnv.RESEND_API_KEY || g.RESEND_API_KEY || g.__env__?.RESEND_API_KEY || p.RESEND_API_KEY,
      UPLOADS: reqAny.env?.UPLOADS || reqAny.context?.env?.UPLOADS || context?.env?.UPLOADS || cfEnv.UPLOADS || g.UPLOADS || g.__env__?.UPLOADS || p.UPLOADS,
    };

    // 執行存庫與寄信（即使沒有存庫，saveAndNotifyContact 內部也會處理）
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
      message: error?.message || "送出時發生問題，請稍後再試。",
    });
  }
}
