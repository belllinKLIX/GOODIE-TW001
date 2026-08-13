import { NextResponse } from "next/server";
import { ContactValidationError, parseContactForm, saveAndNotifyContact } from "../../../lib/contact";

export const runtime = "edge";

export async function POST(request: Request, context?: { env?: Record<string, unknown> }) {
  try {
    const formData = await request.formData();
    const submission = parseContactForm(formData);

    // 1. 多重管道安全解析 Cloudflare Environment Bindings
    const reqEnv = (request as unknown as { env?: Record<string, unknown> }).env || {};
    const ctxEnv = context?.env || {};
    const procEnv = process.env || {};

    const DB = reqEnv.DB || ctxEnv.DB || procEnv.DB;
    let RESEND_API_KEY = (reqEnv.RESEND_API_KEY || ctxEnv.RESEND_API_KEY || procEnv.RESEND_API_KEY) as string | undefined;
    const RESEND_FROM_EMAIL = (reqEnv.RESEND_FROM_EMAIL || ctxEnv.RESEND_FROM_EMAIL || procEnv.RESEND_FROM_EMAIL) as string | undefined;
    const UPLOADS = reqEnv.UPLOADS || ctxEnv.UPLOADS || procEnv.UPLOADS;

    // 2. 清理 Key (去除多餘空白與換行)
    if (typeof RESEND_API_KEY === "string") {
      RESEND_API_KEY = RESEND_API_KEY.trim();
    }

    const bindings = {
      DB: DB as any,
      RESEND_API_KEY,
      // ⚠️ 如果尚未在 Resend 驗證 goodie-tw.com 網域，發件人請固定使用 onboarding@resend.dev
      RESEND_FROM_EMAIL: "Goodie Website <onboarding@resend.dev>",
      UPLOADS: UPLOADS as any,
    };

    // 3. 執行儲存與寄信
    const result = await saveAndNotifyContact(bindings, submission);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ContactValidationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error("Contact API Error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "系統處理失敗，請稍後再試。" },
      { status: 500 }
    );
  }
}
