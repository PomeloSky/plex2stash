[English](README.md) | [繁體中文](README_zh-TW.md)

# Plex2Stash

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-ff5f5f?logo=ko-fi)](https://ko-fi.com/yuchen314)
[![PayPal](https://img.shields.io/badge/PayPal-Donate-00457C?logo=paypal)](https://paypal.me/tedskycom)

為 Plex 打造的自訂 Metadata Provider，完美串接 [StashApp](https://github.com/stashapp/stash)。支援多 Stash、fieldSync 欄位過濾、TV Show 層級、快取、圖片 proxy、以及完整日誌系統。

## 畫面預覽

![Plex2Stash 主畫面](docs/screenshot-main.png)
![日誌查詢器](docs/screenshot-logs.png)

## 功能特色

- **真實 Stash GraphQL 對接**：findScenes / findScene，映射完整 metadata（場景、演員、工作室、標籤）
- **Score Override 強制配對**：解決日文標題不符導致 titleScore 為 0 被 Plex 靜默拒絕的問題，首選結果強制 100 分
- **TV Show 層級結構**：Show → Season → Episode 完整支援
- **fieldSync 條件式欄位過濾**：每個 Stash 可獨立控制哪些欄位同步至 Plex（Pull Mode）
- **影像代理（Image Proxy）**：圖片透過 proxy 服務，Plex 免 Stash API Key 取圖
- **多 Provider 自動 Fallback**：依 priority 排序，主 stash 查無結果自動 fallback
- **LRU 快取**：match 5 分鐘、metadata 30 分鐘，避免 Stash SQLite DB lock
- **實體日誌系統 + Web UI 日誌查詢器**：寫入 `/data/log/YYYY-MM-DD.log`，支援日期、級別、Stash ID 三維過濾
- **多國語系**：English、繁體中文、简体中文、日本語
- **Synology NAS Docker 部署**：三層 @eaDir 防護（.dockerignore / Dockerfile cleanup / layout 設計）

## 快速開始

```yaml
# docker-compose.yml
version: "3.8"
services:
  plex2stash:
    image: plex2stash:latest
    build: .
    ports:
      - "8787:8787"   # API
      - "3000:3000"   # Web UI
    volumes:
      - ./data:/data
    restart: unless-stopped
```

```bash
docker compose up -d
```

## 使用方式

1. 啟動 Plex2Stash 後，開啟 Web UI（`http://NAS_IP:3000`）新增 Stash 設定
2. 在 Plex 中新增自訂 Metadata Provider：
   - 設定 → 媒體庫 → 進階 → Metadata Provider
   - 新增 Provider URL：`http://NAS_IP:8787/providers/<stashId>`
3. 掃描媒體庫或重新整理 metadata 即可從 Stash 取得資訊

## API 端點

### Provider（Plex 使用）

| Method | Path | Description |
|--------|------|-------------|
| GET | `/providers/:stashId` | Provider root |
| POST | `/providers/:stashId/library/metadata/matches` | Match |
| GET | `/providers/:stashId/library/metadata/:id` | Metadata |
| GET | `/providers/:stashId/library/metadata/:id/children` | Children (Show→Season, Season→Episode) |
| GET | `/providers/:stashId/library/metadata/:id/images` | Images |
| GET | `/providers/:stashId/imageProxy?url=<encoded>` | Image proxy |

### 管理 API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/config/stashes` | 列出 Stash |
| POST | `/api/config/stashes` | 新增 Stash |
| PUT | `/api/config/stashes/:id` | 更新 Stash（含 fieldSync） |
| DELETE | `/api/config/stashes/:id` | 刪除 Stash |
| POST | `/api/config/stashes/:id/ping` | 測試連線 |
| PUT | `/api/config/stashes/reorder` | 調整優先順序 |
| GET | `/api/config/cache` | 快取統計 |
| DELETE | `/api/config/cache` | 清除快取 |
| GET | `/api/logs` | 查詢日誌 |
| GET | `/api/logs/dates` | 可用日誌日期列表 |

## 設定檔範例

```json
{
  "stashes": [
    {
      "id": "av",
      "name": "Stash AV",
      "endpoint": "http://192.168.1.100:9999",
      "apiKey": "your-key",
      "enabled": true,
      "priority": 0,
      "fieldSync": {
        "title": true,
        "summary": true,
        "date": true,
        "studio": true,
        "tags": true,
        "performers": true,
        "poster": true,
        "background": true
      }
    }
  ]
}
```

## 版本歷史

### 1.0.0
- 首次公開發佈

## 貢獻

歡迎提交 Issue 與 Pull Request！專案託管於 [GitHub (pomelosky/plex2stash)](https://github.com/pomelosky/plex2stash)。

## 授權

MIT License
