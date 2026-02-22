[English](TROUBLESHOOTING.md) | [繁體中文](TROUBLESHOOTING_zh-TW.md)

# Plex2Stash 疑難排解

> [!WARNING]
> **重要：** 如果更新後 Plex 依然報錯 404 (Double Prefix)，請務必重新啟動 Plex Media Server 應用程式以徹底清除舊的 Provider 快取設定。

---

## 1. Plex 404 Double Prefix（雙重前綴）

**現象：** Plex 成功新增 Provider，但 match/metadata/images 請求全部回 404。

**根因：** Feature 的 `key` 不可包含 `/providers/:stashId` 前綴。Plex 會將 Provider URI 與 Feature key 串接，若 key 含完整路徑會造成雙重前綴（例如 `http://NAS:8787/providers/av/providers/av/library/metadata/matches`）。

**解法：** Feature key 必須僅使用相對路徑，例如 `/library/metadata/matches`、`/library/metadata`、`/library/metadata/images`。

**驗證：**
```bash
curl -s http://NAS_IP:8787/providers/YOUR_STASH_ID | python3 -m json.tool | grep key
```
確認沒有任何 key 包含 `/providers/` 前綴。

---

## 2. Plex "object expected" 解析錯誤

**現象：** Plex 收到 200 與 JSON，但解析失敗；log 顯示 `object expected at 1:xxx`。

**根因：** `Type[]` 必須使用 `id`（非 `type`），且必須為物件而非數字。

**解法：** 每個 Type 元素必須為含 `id` 的物件：
```json
"Type": [
  { "id": 1, "Scheme": [{ "scheme": "tv.plex.agents.custom.plex2stash.av" }] },
  { "id": 2, "Scheme": [{ "scheme": "tv.plex.agents.custom.plex2stash.av" }] }
]
```

**驗證：**
```bash
curl -s http://NAS_IP:8787/providers/YOUR_STASH_ID | python3 -m json.tool
```

---

## 3. Plex 靜默拒絕配對結果（Score < 80）

**現象：** Stash 有回傳配對結果（log 顯示 `Match "xxx" → N results`），但 Plex 不更新 metadata。

**根因：** Plex 會靜默丟棄 score < 80 的 match 結果。當 Stash 以番號或 hash 找出影片時，回傳的標題（常為日文）與 Plex 搜尋檔名完全不相似，`titleScore` 為 0，Plex 直接忽略。

**解法：** Score Override 會強制將首選結果設為 100 分，確保 Plex 接受。後續結果遞減（最低 80 分）。

**以 curl 驗證：**
```bash
curl -X POST "http://NAS_IP:8787/providers/YOUR_STASH_ID/library/metadata/matches" \
  -H "Content-Type: application/json" \
  -d '{"title":"ABC-123"}'
```
確認第一個 SearchResult 的 `score` 為 100。

---

## 4. Web UI "Failed to fetch"

**現象：** Web UI 無法載入 stashes、logs 或 config；瀏覽器顯示 "Failed to fetch"。

**根因：** 前端 API 使用絕對 URL 導致 CORS 或 base URL 錯誤。

**解法：** 必須使用相對 API 路徑（例如 `/api/config/stashes`），並透過 Next.js rewrites 代理至 Fastify 後端。瀏覽器請求勿使用 `NEXT_PUBLIC_API_URL`。

---

## 5. 測試連線 400（空 JSON body）

**現象：** 測試連線按鈕回傳 400；伺服器 log 顯示 `FST_ERR_CTP_EMPTY_JSON_BODY`。

**根因：** POST 帶 `Content-Type: application/json` 但無 body。

**解法：** POST 必須包含 body：`JSON.stringify({})`（或等效空物件）。

---

## 6. NAS 上複製按鈕無效

**現象：** 在 Synology NAS 或非 HTTPS 環境下，複製到剪貼簿按鈕無反應。

**根因：** `navigator.clipboard.writeText()` 需要安全環境（HTTPS 或 localhost）。

**解法：** 非 HTTPS 環境需在 Clipboard API 不可用時，使用 `execCommand('copy')` 作為 fallback。

---

## 7. Stash "database is locked"

**現象：** Stash 在高負載下回傳 "database is locked" 或類似 SQLite 錯誤。

**根因：** Stash 使用 SQLite；並發查詢造成 DB lock。

**解法：** LRU 快取可減少並發查詢（match 5 分鐘、metadata 30 分鐘）。清除快取：
```bash
curl -X DELETE http://NAS_IP:8787/api/config/cache
```

---

## 8. Synology @eaDir Next.js 建置錯誤

**現象：** 在 Synology NAS 上 Docker build 失敗：`Property 'eaDir' is missing in type ...`

**根因：** Synology 會在每個資料夾自動產生 `@eaDir` 目錄。Next.js App Router 將 `app/@xxx` 視為 parallel route slot。

**解法：** 三層防護：
1. `.dockerignore` 排除 `**/@eaDir`
2. Dockerfile build stage 執行 `find . -name '@eaDir' -exec rm -rf {} +`
3. layout 設計不宣告會引用 `@eaDir` 的 slot props

---

## 9. Docker lockfile 錯誤

**現象：** Docker build 時 `pnpm install --frozen-lockfile` 失敗。

**根因：** `pnpm-lock.yaml` 遺失或與 `package.json` 不同步。

**解法：** 必須將 `pnpm-lock.yaml` 提交至版本庫。於本地執行 `pnpm install`，commit lockfile 後重新 build。

---

## 10. Stash 連線被拒絕

**現象：** Plex2Stash 無法連線至 Stash；"connection refused" 或逾時。

**檢查清單：**
- **端點：** 正確的 URL（例如 `http://STASH_IP:9999`），無尾端斜線
- **API Key：** 在 Stash 設定 → Configuration 中的有效 API key
- **防火牆：** Plex2Stash 與 Stash 之間的 9999 埠（或您的 Stash 埠）已開放

**驗證：**
- 使用 Web UI 的「測試連線」按鈕
- 或使用 curl：
```bash
curl -X POST http://STASH_IP:9999/graphql \
  -H "Content-Type: application/json" \
  -H "ApiKey: YOUR_KEY" \
  -d '{"query":"{ systemStatus { status } }"}'
```
