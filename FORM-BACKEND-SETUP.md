# Goodie 正式聯絡表單設定

網站會在送出表單後：

1. 把完整詢問資料寫入 Cloudflare D1 的 `contact_inquiries`。
2. 透過 Resend 寄送 HTML 通知信至 `bell.lin@klixtw.com`。
3. 若有設定 R2 `UPLOADS`，會保存上傳檔案並在 D1 與信件中提供連結；未設定 R2 時，檔案仍會附在通知信中，但 D1 只保存檔名、類型與大小。
4. 若附件轉換或附件寄送失敗，系統會自動再寄一次無附件通知信，並把原因記錄到 D1 的 `email_error`。

## Cloudflare 必要設定

- D1 binding：`DB`
- D1 資料庫：`goodie-db`（已固定寫入 `wrangler.jsonc`，重新部署不會再解除綁定）
- Secret：`RESEND_API_KEY`（必須在 Cloudflare 設為 **Secret**，不可放進 `vars` 或上傳 GitHub）
- Resend 已驗證寄件網域：`goodie-tw.com`
- 寄件地址：`RESEND_FROM_EMAIL` 已在 `wrangler.jsonc` 設為 `Goodie Website <website@goodie-tw.com>`
- 選用 R2 binding：`UPLOADS`

`wrangler.jsonc` 已設定 `keep_vars: true`，Cloudflare 儀表板中的一般變數會保留；Cloudflare 的 Secret 本來就不會因一般部署而被刪除。

### Secret 只需要設定一次

在 Cloudflare Worker 的 **Settings → Variables and Secrets** 確認：

- 名稱：`RESEND_API_KEY`
- 類型：Secret
- 內容：Resend 提供的 API Key

請勿把真正的 API Key 寫入任何 ZIP、GitHub 檔案或 `wrangler.jsonc`。

> 技術備註：vinext 的正式來源入口必須維持 `vinext/server/fetch-handler`。`dist/server/index.js` 是建置後才產生的檔案，`prep.js` 只先建立暫時占位檔，完整建置會把它安全覆蓋。

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
