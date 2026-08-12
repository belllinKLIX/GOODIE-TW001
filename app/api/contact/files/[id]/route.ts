export const runtime = "edge";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!id) {
      return new Response("Invalid File Request", { status: 400 });
    }

    // 取得原生全域變數，避免使用 import "cloudflare:workers" 導致打包失敗
    const g = globalThis as any;
    const db = g.DB || g.__env__?.DB || (process.env as any).DB;
    const uploads = g.UPLOADS || g.__env__?.UPLOADS || (process.env as any).UPLOADS;

    if (!db) {
      return new Response("Database Binding Not Found", { status: 500 });
    }

    // 1. 從 D1 查詢檔案資訊
    const inquiry = await db
      .prepare("SELECT reference_file_key, reference_file_name, reference_file_type, reference_file_token FROM contact_inquiries WHERE id = ?")
      .bind(id)
      .first();

    if (!inquiry || !inquiry.reference_file_key) {
      return new Response("File Not Found", { status: 404 });
    }

    // 簡單的 Token 驗證
    if (inquiry.reference_file_token && inquiry.reference_file_token !== token) {
      return new Response("Unauthorized Access", { status: 403 });
    }

    if (!uploads) {
      return new Response("R2 Storage Binding Not Found", { status: 500 });
    }

    // 2. 從 R2 取得檔案
    const fileObject = await uploads.get(inquiry.reference_file_key);
    if (!fileObject) {
      return new Response("File Object Missing in R2", { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", inquiry.reference_file_type || "application/octet-stream");
    headers.set(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(inquiry.reference_file_name || "file")}"`
    );

    return new Response(fileObject.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Download File Route Error:", error);
    return new Response("Internal Error", { status: 500 });
  }
}
