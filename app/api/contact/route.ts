import { NextResponse } from "next/server";
import { ContactValidationError, parseContactForm, saveAndNotifyContact } from "../../../lib/contact";

export const runtime = "edge";

// 嘗試多種可能傳入 context 的參數位置
export async function POST(request: Request, context?: any) {
  try {
    const formData = await request.formData();
    const submission = parseContactForm(formData);

    // 1. 全方位抓取 Cloudflare Bindings (相容 Vinext / Cloudflare Workers / Vite Dev)
    const reqEnv = (request as any).env || {};
    const ctxEnv = context?.env || context?.cloudflare?.env || {};
    const procEnv = process.env || {};
    const globalEnv = (globalThis as any).env || {};

    // 優先順序：Cloudflare Request > Context > GlobalThis > Process.env > 全局直接物件
    const DB = reqEnv.DB || ctxEnv.DB || globalEnv.DB || procEnv.DB || (globalThis as any).DB;
    let RESEND_API_KEY = (reqEnv.RESEND_API_KEY || ctxEnv.RESEND_API_KEY || globalEnv.RESEND_API_KEY || procEnv.RESEND_API_KEY) as string | undefined;
    const RESEND_FROM_EMAIL = (reqEnv.RESEND_FROM_EMAIL || ctxEnv.RESEND_FROM_EMAIL || globalEnv.RESEND_FROM_EMAIL || procEnv.RESEND_FROM_EMAIL) as string | undefined;
    const UPLOADS = reqEnv.UPLOADS || ctxEnv.UPLOADS || globalEnv.UPLOADS || procEnv.UPLOADS;

    // 除錯日誌（可在 Cloudflare Tail / Observability 看到）
    if (!DB) {
      console.error("❌ DB Binding 未能解析！測試各來源:", {
        hasReqEnv: !!reqEnv.DB,
        hasCtxEnv: !!ctxEnv.DB,
        hasGlobalEnv: !!globalEnv.DB,
        hasProcEnv: !!procEnv.DB,
        hasDirectGlobal: !!(globalThis as any).DB
      });
      throw new Error("Cloudflare D1 的 DB 綁定尚未設定。");
    }

    if (typeof RESEND_API_KEY === "string") {
      RESEND_API_KEY = RESEND_API_KEY.trim();
    }

    const bindings = {
      DB,
      RESEND_API_KEY,
      RESEND_FROM_EMAIL: RESEND_FROM_EMAIL || "Goodie Website <onboarding@resend.dev>",
      UPLOADS,
    };

    // 2. 寫入 D1 與寄送 Resend 通知信
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
