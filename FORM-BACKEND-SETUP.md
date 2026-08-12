# Goodie 正式聯絡表單設定

網站會在送出表單後：

1. 把完整詢問資料寫入 Cloudflare D1 的 `contact_inquiries`。
2. 透過 Resend 寄送 HTML 通知信至 `bell.lin@klixtw.com`。
3. 若有設定 R2 `UPLOADS`，會保存上傳檔案並在 D1 與信件中提供連結；未設定 R2 時，檔案仍會附在通知信中，但 D1 只保存檔名、類型與大小。

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
- 送出一筆測試需求。
- 確認 D1 出現資料，且 `email_status` 為 `sent`。
- 確認 `bell.lin@klixtw.com` 收到通知信。
- 正式公開前建議再加入 Cloudflare Turnstile，避免垃圾表單攻擊。
