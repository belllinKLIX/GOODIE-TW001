import { env as cloudflareEnv } from "cloudflare:workers";
import {
  type ContactBindings,
  ContactValidationError,
  parseContactForm,
  saveAndNotifyContact,
} from "../../../lib/contact";

export const runtime = "edge";

type EnvironmentCarrier = {
  env?: Partial<ContactBindings>;
};

type RouteContext = {
  env?: Partial<ContactBindings>;
};

type RuntimeGlobal = typeof globalThis & {
  env?: Partial<ContactBindings>;
  __CLOUDFLARE_ENV__?: Partial<ContactBindings>;
};

function firstBinding<K extends keyof ContactBindings>(
  candidates: Array<Partial<ContactBindings> | undefined>,
  key: K,
): ContactBindings[K] | undefined {
  for (const candidate of candidates) {
    const value = candidate?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

/**
 * cloudflare:workers is vinext's official binding source. The remaining
 * candidates make the route resilient to test runners and alternate adapters.
 */
export function resolveContactBindings(request: Request, context?: RouteContext): ContactBindings {
  const requestEnv = (request as Request & EnvironmentCarrier).env;
  const runtimeGlobal = globalThis as RuntimeGlobal;
  const processEnv = typeof process !== "undefined" ? process.env : undefined;
  const candidates = [
    cloudflareEnv,
    requestEnv,
    context?.env,
    runtimeGlobal.env,
    runtimeGlobal.__CLOUDFLARE_ENV__,
  ];

  return {
    DB: firstBinding(candidates, "DB"),
    UPLOADS: firstBinding(candidates, "UPLOADS"),
    RESEND_API_KEY: firstBinding(candidates, "RESEND_API_KEY") || processEnv?.RESEND_API_KEY,
    RESEND_FROM_EMAIL: firstBinding(candidates, "RESEND_FROM_EMAIL") || processEnv?.RESEND_FROM_EMAIL,
  };
}

export async function POST(request: Request, context?: RouteContext) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return Response.json({ ok: false, message: "表單格式不正確。" }, { status: 415 });
    }

    const submission = parseContactForm(await request.formData());
    const result = await saveAndNotifyContact(resolveContactBindings(request, context), submission);

    return Response.json({
      ok: true,
      submissionId: result.id,
      notificationSent: result.notificationSent,
      message: result.notificationSent
        ? "需求已送出，我們會盡快與您聯繫。"
        : "需求已成功保存；通知信暫時未寄出，我們仍可在系統中看到您的資料。",
    });
  } catch (error) {
    if (error instanceof ContactValidationError) {
      return Response.json({ ok: false, message: error.message }, { status: 400 });
    }
    console.error("Contact form submission failed", error);
    return Response.json({
      ok: false,
      message: "目前無法送出，請稍後再試，或使用右下角 LINE 與我們聯絡。",
    }, { status: 500 });
  }
}
