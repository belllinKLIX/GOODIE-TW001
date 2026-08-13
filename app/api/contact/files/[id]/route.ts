import { env } from "cloudflare:workers";

export const runtime = "edge";

function safeDownloadName(filename: string) {
  return filename.replace(/[\r\n"]/g, "_").slice(0, 160);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  if (!env.UPLOADS) return new Response("Not found", { status: 404 });
  const requestToken = new URL(request.url).searchParams.get("token") || "";

  const { id } = await context.params;
  const record = await env.DB.prepare(`
    SELECT reference_file_key, reference_file_token, reference_file_name, reference_file_type
    FROM contact_inquiries
    WHERE id = ?
  `).bind(id).first<{
    reference_file_key: string | null;
    reference_file_token: string | null;
    reference_file_name: string | null;
    reference_file_type: string | null;
  }>();

  if (!record?.reference_file_key || !record.reference_file_token || requestToken !== record.reference_file_token) {
    return new Response("Unauthorized", { status: 401 });
  }
  const object = await env.UPLOADS.get(record.reference_file_key);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": record.reference_file_type || "application/octet-stream",
      "Content-Length": String(object.size),
      "Content-Disposition": `attachment; filename="${safeDownloadName(record.reference_file_name || "reference-file")}"`,
      ETag: object.httpEtag,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
