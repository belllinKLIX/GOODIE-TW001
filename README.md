# Goodie 公司官網

這是 Goodie 官網的公司自有版本，供 GitHub 與 Cloudflare Workers 部署使用。

## 修改網站內容

一般文字集中在 `content/goodie-content.json`。

- 修改電話、地址、標題、服務及案例文字後提交到 GitHub。
- 圖片放在 `public/`，如需換圖，建議保持原檔名與尺寸比例。
- 排版及功能程式位於 `app/`。

## 本機檢查

需要 Node.js 22 或以上版本。

```bash
npm install
npm run build
npm run dev
```

## Cloudflare Workers Builds

1. 在公司 GitHub 建立私人 Repository，將本資料夾內的檔案上傳至 Repository 根目錄。
2. Cloudflare → Workers & Pages → Create application → Import a repository。
3. 選擇該 GitHub Repository。
4. Production branch 使用 `main`。
5. Build command 使用 `npm run build`。
6. Deploy command 使用 `npm run deploy`。
7. 儲存並部署，先確認 `workers.dev` 測試網址。
8. 確認後在 Worker 的 Custom Domains 綁定 `goodie-tw.com` 與 `www.goodie-tw.com`。

Cloudflare Workers Builds 每次收到 `main` 的新提交後，會自動重新建置並更新正式網站。

## 注意

- 不要把 API Key、密碼或 `.env` 檔案上傳 GitHub。
- 聯絡表單目前仍為畫面展示；正式寄信功能與 Turnstile 防垃圾訊息將在確認收件信箱後加入!。
- Repository 建議設為 Private，並將設計師或工程師以協作者方式加入。
