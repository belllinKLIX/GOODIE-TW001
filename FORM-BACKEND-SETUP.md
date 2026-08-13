# Goodie 正式聯絡表單設定

網站會在送出表單後：

1. 把完整詢問資料寫入 Cloudflare D1 的 `contact_inquiries`。
2. 透過 Resend 寄送 HTML 通知信至 `bell.lin@klixtw.com`。
3. 若有設定 R2 `UPLOADS`，會保存上傳檔案並在 D1 與信件中提供連結；未設定 R2 時，檔案仍會附在通知信中，但 D1 只保存檔名、類型與大小。
4. 若附件轉換或附件寄送失敗，系統會自動再寄一次無附件通知信，並把原因記錄到 D1 的 `email_error`。

## Cloudflare 必要設定

- D1 binding：`DB`
- Secret：`RESEND_API_KEY`
- Resend 已驗證寄件網域：`goodie-tw.com`
- 選用環境變數：`RESEND_FROM_EMAIL`，例如 `Goodie Website <website@goodie-tw.com>`
- 選用 R2 binding：`UPLOADS`

## 初始化 D1

在 Cloudflare D1 的 Console 執行 `migrations/0001_contact_inquiries.sql`，或使用 Wrangler 對正式 D1 執行這個 migration。

## 上線前檢查

- 確認 Resend 的 `goodie-tw.com` 狀態為 Verified。
- 不要使用 `onboarding@resend.dev` 寄給公司信箱；該測試網域只能寄給 Resend 帳號擁有者。
- 送出一筆測試需求。
- 確認 D1 出現資料，且 `email_status` 為 `sent`。
- 若 `email_status` 為 `failed`，直接查看同一筆資料的 `email_error`，其中會保留 Resend 的錯誤原因。
- 確認 `bell.lin@klixtw.com` 收到通知信。
- 正式公開前建議再加入 Cloudflare Turnstile，避免垃圾表單攻擊。
