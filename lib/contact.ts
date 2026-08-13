async function sendResendEmail(
  submission: ContactSubmission,
  apiKey: string,
  fromEmail: string,
  fetcher: typeof fetch,
) {
  // 1. 建立基礎 Payload (如果尚未驗證自訂網域，發件人請沿用 "Goodie Website <onboarding@resend.dev>")
  const basePayload: Record<string, unknown> = {
    from: fromEmail || "Goodie Website <onboarding@resend.dev>",
    to: ["bell.lin@klixtw.com"],
    reply_to: submission.email,
    subject: `【Goodie 網站詢問】${submission.company}｜${submission.name}`,
    html: buildContactEmailHtml(submission),
  };

  // 封裝內部發送 API
  async function deliver(payload: Record<string, unknown>, attempt: string) {
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `goodie-contact-${submission.id}-${attempt}`,
        "User-Agent": "Goodie-Website/1.0",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null) as { id?: string; message?: string; name?: string } | null;

    if (!response.ok || !result?.id) {
      throw new Error(result?.message || result?.name || `Resend API 回傳 ${response.status}`);
    }

    return result.id;
  }

  // 若沒有上傳附件，直接寄送純文字通知信
  if (!submission.referenceFile || !submission.referenceFileName) {
    const resendId = await deliver(basePayload, "notification-only");
    return { id: resendId, attachmentIncluded: false, warning: null };
  }

  // 2. 轉碼處理附件（加入 Try-Catch 防止轉碼失敗導致整個發信崩潰）
  let attachment: { filename: string; content: string } | null = null;
  let warning: string | null = null;

  try {
    const buffer = await submission.referenceFile.arrayBuffer();
    if (buffer && buffer.byteLength > 0) {
      attachment = {
        filename: submission.referenceFileName,
        content: arrayBufferToBase64(buffer),
      };
    }
  } catch (error) {
    warning = `附件轉碼失敗，已自動改寄無附件通知信：${errorMessage(error)}`;
  }

  // 3. 若有成功轉碼的附件，優先嘗試發送帶附件的信件
  if (attachment) {
    try {
      const resendId = await deliver({ ...basePayload, attachments: [attachment] }, "with-attachment");
      return {
        id: resendId,
        attachmentIncluded: true,
        warning: null,
      };
    } catch (error) {
      warning = `附件發送失敗，已降級改寄無附件通知信：${errorMessage(error)}`;
    }
  }

  // 4. 降級保護：若附件寄送失敗，發送純文字通知信
  const fallbackResendId = await deliver(basePayload, "attachment-fallback");
  return {
    id: fallbackResendId,
    attachmentIncluded: false,
    warning,
  };
}
