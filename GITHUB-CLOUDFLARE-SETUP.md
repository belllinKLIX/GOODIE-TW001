# Goodie 網站第一次上線說明

## A. 上傳至 GitHub

1. 使用公司 GitHub 登入。
2. 建立新的 Private Repository，名稱建議為 `goodie-website`。
3. 不要勾選自動建立 README，避免第一次上傳時發生檔案衝突。
4. 解壓縮本 ZIP。
5. 將解壓縮後資料夾「裡面的所有檔案」上傳到 Repository 根目錄，而不是只上傳外層資料夾。
6. 確認 GitHub 首頁可直接看到 `app`、`content`、`public`、`package.json`、`wrangler.jsonc`。
7. Commit message 可填：`Initial Goodie website`。

## B. 連接公司 Cloudflare

1. 進入 Cloudflare 的 Workers & Pages。
2. 選擇 Create application，再選 Import a repository。
3. 授權公司 GitHub，選擇 `goodie-website`。
4. Worker 名稱填 `goodie-tw-website`。
5. Production branch 選 `main`。
6. Build command 填 `npm run build`。
7. Deploy command 填 `npm run deploy`。
8. 儲存並等待部署完成。

## C. 先測試、再綁網域

部署成功後，Cloudflare 會提供 `workers.dev` 測試網址。先檢查首頁、關於我們、專案服務、成功案例、合作流程與聯絡頁。

確認正常後，在該 Worker 內選 Settings 或 Domains & Routes → Add Custom Domain，依序加入：

- `goodie-tw.com`
- `www.goodie-tw.com`

由於網域 DNS 已在同一個 Cloudflare 帳號管理，Cloudflare 通常會自動建立所需 DNS 紀錄。操作前先不要刪除現有 DNS，若畫面提示紀錄衝突，先截圖確認。

## D. 日後更新

日後網站修改確認完成後，只要把新版提交到 GitHub 的 `main`，Cloudflare 就會自動發布；不需要重新綁網域。
