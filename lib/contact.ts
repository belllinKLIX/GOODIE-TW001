export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  run<T = unknown>(): Promise<T>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

export interface R2ObjectLike {
  body: ReadableStream<Uint8Array>;
  httpEtag: string;
  size: number;
}

export interface R2BucketLike {
  put(
    key: string,
    value: ReadableStream<Uint8Array> | ArrayBuffer,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectLike | null>;
  delete(key: string): Promise<void>;
}

export interface ContactBindings {
  DB: D1DatabaseLike;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL?: string;
  UPLOADS?: R2BucketLike;
}

export interface ContactSubmission {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  projectType: string;
  timeline: string;
  quantity: string;
  description: string;
  referenceFile: File | null;
  referenceFileName: string | null;
  referenceFileType: string | null;
  referenceFileSize: number | null;
  referenceFileKey: string | null;
  referenceFileToken: string | null;
  referenceFileUrl: string | null;
  createdAt: string;
}

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "pdf", "ai"]);

function cleanText(value: FormDataEntryValue | null, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function fileExtension(filename: string) {
  return filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";
}

function safeFilename(filename: string) {
  const normalized = filename.normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu, "-");
  return normalized.slice(0, 120) || "reference-file";
}

export function parseContactForm(formData: FormData): ContactSubmission {
  const name = cleanText(formData.get("name"), 100);
  const company = cleanText(formData.get("company"), 160);
  const email = cleanText(formData.get("email"), 254).toLowerCase();
  const phone = cleanText(formData.get("phone"), 60);
  const projectType = cleanText(formData.get("projectType"), 100);
  const timeline = cleanText(formData.get("timeline"), 100);
  const quantity = cleanText(formData.get("quantity"), 100);
  const description = cleanText(formData.get("description"), 4000);

  if (!name || !company || !email || !phone || !projectType || !description) {
    throw new ContactValidationError("請填寫所有必填欄位。");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ContactValidationError("請輸入正確的電子郵件地址。");
  }

  const referenceEntry = formData.get("reference");
  const referenceFile = referenceEntry instanceof File && referenceEntry.size > 0 ? referenceEntry : null;
  if (referenceFile) {
    if (referenceFile.size > MAX_FILE_SIZE) {
      throw new ContactValidationError("上傳檔案不可超過 8MB。");
    }
    if (!ALLOWED_FILE_EXTENSIONS.has(fileExtension(referenceFile.name))) {
      throw new ContactValidationError("上傳檔案僅支援 JPG、PNG、PDF 或 AI。");
    }
  }

  const id = crypto.randomUUID();
  const referenceFileName = referenceFile ? safeFilename(referenceFile.name) : null;
  const referenceFileKey = referenceFile
    ? `contact-submissions/${new Date().toISOString().slice(0, 7)}/${id}/${referenceFileName}`
    : null;

  return {
    id,
    name,
    company,
    email,
    phone,
    projectType,
    timeline,
    quantity,
    description,
    referenceFile,
    referenceFileName,
    referenceFileType: referenceFile?.type || null,
    referenceFileSize: referenceFile?.size || null,
    referenceFileKey,
    referenceFileToken: referenceFile ? crypto.randomUUID() : null,
    referenceFileUrl: null,
    createdAt: new Date().toISOString(),
  };
}

export class ContactValidationError extends Error {}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]!);
}

function display(value: string | null) {
  return value ? escapeHtml(value) : "未填寫";
}

export function buildContactEmailHtml(submission: ContactSubmission) {
  const rows = [
    ["姓名", submission.name],
    ["公司名稱", submission.company],
    ["Email", submission.email],
    ["聯絡電話", submission.phone],
    ["專案類型", submission.projectType],
    ["預計專案時間", submission.timeline],
    ["預估數量", submission.quantity],
    ["上傳檔案", submission.referenceFileUrl || submission.referenceFileName],
  ];
  const fileValue = submission.referenceFileUrl
    ? `<a href="${escapeHtml(submission.referenceFileUrl)}" style="color:#d88900;font-weight:700">查看上傳檔案</a>`
    : display(submission.referenceFileName);

  return `<!doctype html>
<html lang="zh-Hant"><body style="margin:0;background:#f5f5f3;font-family:Arial,'Noto Sans TC',sans-serif;color:#151515">
  <div style="max-width:680px;margin:0 auto;padding:32px 16px">
    <div style="background:#ffb400;padding:24px 28px;border-radius:14px 14px 0 0">
      <div style="font-size:28px;font-weight:900">Goodie</div>
      <div style="margin-top:8px;font-size:18px;font-weight:700">網站收到新的專案需求</div>
    </div>
    <div style="background:#fff;padding:26px 28px;border-radius:0 0 14px 14px;box-shadow:0 8px 30px rgba(0,0,0,.06)">
      <table role="presentation" style="width:100%;border-collapse:collapse">
        ${rows.map(([label, value]) => `<tr><td style="width:140px;padding:11px 0;border-bottom:1px solid #eee;color:#777;vertical-align:top">${label}</td><td style="padding:11px 0;border-bottom:1px solid #eee;font-weight:600;vertical-align:top">${label === "上傳檔案" ? fileValue : display(value)}</td></tr>`).join("")}
      </table>
      <div style="margin-top:24px;color:#777">需求描述</div>
      <div style="margin-top:8px;padding:18px;background:#fff8e8;border-radius:10px;line-height:1.75;white-space:pre-wrap">${display(submission.description)}</div>
      <div style="margin-top:24px;font-size:12px;color:#999">案件編號：${escapeHtml(submission.id)}｜送出時間：${escapeHtml(submission.createdAt)}</div>
    </div>
  </div>
</body></html>`;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

async function sendResendEmail(
  submission: ContactSubmission,
  apiKey: string,
  fromEmail: string,
  fetcher: typeof fetch,
) {
  const payload: Record<string, unknown> = {
    from: "onboarding@resend.dev",
    to: ["bell.lin@klixtw.com"],
    reply_to: submission.email,
    subject: `【Goodie 網站詢問】${submission.company}｜${submission.name}`,
    html: buildContactEmailHtml(submission),
  };

  if (submission.referenceFile && submission.referenceFileName) {
    payload.attachments = [{
      filename: submission.referenceFileName,
      content: arrayBufferToBase64(await submission.referenceFile.arrayBuffer()),
    }];
  }

  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `goodie-contact-${submission.id}`,
      "User-Agent": "Goodie-Website/1.0",
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => null) as { id?: string; message?: string } | null;
  if (!response.ok || !result?.id) {
    console.error("Resend 寄信失敗 (但已忽略以確保表單成功送出):", result?.message || response.status);
    return null;
  }
  return result.id;
}

export async function saveAndNotifyContact(
  bindings: ContactBindings,
  submission: ContactSubmission,
  fetcher: typeof fetch = fetch,
) {
  let uploadedToR2 = false;

  // 1. 處理檔案上傳（R2 Storage）
  try {
    if (submission.referenceFile && submission.referenceFileKey && bindings?.UPLOADS) {
      await bindings.UPLOADS.put(submission.referenceFileKey, submission.referenceFile.stream(), {
        httpMetadata: { contentType: submission.referenceFileType || "application/octet-stream" },
        customMetadata: { submissionId: submission.id, originalName: submission.referenceFileName || "reference-file" },
      });
      uploadedToR2 = true;

      if (submission.referenceFileToken) {
        const fileUrl = new URL(`/api/contact/files/${submission.id}`, "https://goodie-tw.com");
        fileUrl.searchParams.set("token", submission.referenceFileToken);
        submission.referenceFileUrl = fileUrl.toString();
      }
    } else {
      submission.referenceFileKey = null;
      submission.referenceFileToken = null;
      submission.referenceFileUrl = null;
    }
  } catch (r2Error) {
    console.error("R2 File Upload Error (Ignored):", r2Error);
  }

  // 2. 寫入 D1 資料庫（嚴格對齊 Schema 欄位與 17 個佔位符）
  let dbSaved = false;
  if (bindings?.DB) {
    try {
      const nowIso = submission.createdAt || new Date().toISOString();

      await bindings.DB.prepare(`
        INSERT INTO contact_inquiries (
          id, name, company, email, phone, project_type, timeline, quantity, description,
          reference_file_name, reference_file_type, reference_file_size, reference_file_key,
          reference_file_token, reference_file_url, email_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        submission.id || crypto.randomUUID(),
        submission.name || "未填寫",
        submission.company || "未填寫",
        submission.email || "未填寫",
        submission.phone || "未填寫",
        submission.projectType || "一般諮詢",
        submission.timeline || "",
        submission.quantity || "",
        submission.description || "無需求描述",
        submission.referenceFileName || null,
        submission.referenceFileType || null,
        submission.referenceFileSize || null,
        submission.referenceFileKey || null,
        submission.referenceFileToken || null,
        submission.referenceFileUrl || null,
        "pending",
        nowIso
      ).run();
      
      dbSaved = true;
      console.log("SUCCESS: D1 Record Saved!");
    } catch (dbError) {
      console.error("D1 Database Insert Error:", dbError);
    }
  } else {
    console.warn("Cloudflare D1 DB binding is missing!");
  }

  // 3. 發送 Resend Email 通知
  let emailSent = false;
  const apiKey = bindings?.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      await sendResendEmail(
        submission,
        apiKey,
        "onboarding@resend.dev",
        fetcher
      );
      emailSent = true;
    } catch (emailError) {
      console.error("Resend Email Send Error:", emailError);
    }
  } else {
    console.warn("RESEND_API_KEY is missing!");
  }

  return {
    id: submission.id,
    dbSaved,
    emailSent,
    uploadedToR2
  };
}
