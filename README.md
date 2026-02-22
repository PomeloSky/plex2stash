[English](README.md) | [繁體中文](README_zh-TW.md)

# Plex2Stash

[![GitHub Release](https://img.shields.io/github/v/release/pomelosky/plex2stash)](https://github.com/pomelosky/plex2stash/releases)
[![License](https://img.shields.io/github/license/pomelosky/plex2stash)](https://github.com/pomelosky/plex2stash/blob/main/LICENSE)
[![Docker Pulls](https://img.shields.io/docker/pulls/pomelosky/plex2stash)](https://hub.docker.com/r/pomelosky/plex2stash)
[![Docker Build](https://img.shields.io/docker/cloud/build/pomelosky/plex2stash)](https://hub.docker.com/r/pomelosky/plex2stash)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-ff5e5b?logo=kofi)](https://ko-fi.com/yuchen314)
[![PayPal](https://img.shields.io/badge/PayPal-Donate-00457C?logo=paypal)](https://paypal.me/tedskycom)

## Introduction

Plex2Stash is a custom **Plex Metadata Provider** that seamlessly integrates with [StashApp](https://github.com/stashapp/stash), designed for [Plex Media Server](https://github.com/plexinc). It bridges StashApp's rich metadata (scenes, performers, studios, tags) into Plex, enabling automatic metadata lookup and enrichment for your media library.

Runs on **Docker** and **Synology NAS**, with a Web UI for configuration and log viewing.

## Screenshots

| Dashboard | Stash Configuration | Log Viewer |
|-----------|---------------------|------------|
| ![Dashboard](docs/images/screenshot_dashboard.png) | ![Stash Config](docs/images/screenshot_stash_config.png) | ![Logs](docs/images/screenshot_logs.png) |

## Features

- **Real Stash GraphQL integration** — Scenes, performers, studios, tags mapped to Plex metadata
- **Score Override** — Forces Plex to accept match results (solves Japanese title mismatch; Plex silently rejects scores &lt; 80)
- **TV Show hierarchy** — Show → Season → Episode structure with `/children` endpoints
- **fieldSync** — Per-stash metadata field filtering (title, summary, date, studio, tags, performers, poster, background)
- **Image proxy** — Plex fetches images without needing Stash API key
- **Multi-provider fallback** — Priority-based; primary stash fallback when no match found
- **LRU caching** — Match 5min, metadata 30min (avoids Stash SQLite DB lock)
- **File-based logging** — Daily JSONL logs with Web UI viewer (date, level, stashId filters)
- **i18n** — English, 繁體中文, 简体中文, 日本語
- **Synology NAS Docker-ready** — @eaDir defense (`.dockerignore`, Dockerfile cleanup, layout design)

## Quick Start

```yaml
# docker-compose.yml
services:
  plex2stash:
    image: pomelosky/plex2stash:latest
    ports:
      - "8787:8787"   # API (Plex provider)
      - "3000:3000"   # Web UI
    volumes:
      - /path/to/data:/data
    restart: unless-stopped
```

```bash
docker compose up -d
```

## Usage

1. Open the Web UI at `http://NAS_IP:3000` and add your Stash instance(s).
2. In Plex: **Settings → Agents → Movies** (or **Shows**) → **Plex Movie** → **Manage**.
3. Add a custom metadata provider with URL: `http://NAS_IP:8787/providers/YOUR_STASH_ID`
4. Run a metadata refresh on your library.

## API Reference

### Provider Endpoints (Plex)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/providers/:stashId` | Provider root (Plex discovery) |
| POST | `/providers/:stashId/library/metadata/matches` | Match |
| GET | `/providers/:stashId/library/metadata/:id` | Metadata |
| GET | `/providers/:stashId/library/metadata/:id/children` | Children (Show→Season, Season→Episode) |
| GET | `/providers/:stashId/library/metadata/:id/images` | Images |
| GET | `/providers/:stashId/imageProxy?url=<encoded>` | Image proxy |

### Management Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/config/stashes` | List stashes |
| POST | `/api/config/stashes` | Create stash |
| PUT | `/api/config/stashes/:id` | Update stash (incl. fieldSync) |
| DELETE | `/api/config/stashes/:id` | Delete stash |
| POST | `/api/config/stashes/:id/ping` | Test connection |
| PUT | `/api/config/stashes/reorder` | Reorder priorities |
| GET | `/api/config/cache` | Cache stats |
| DELETE | `/api/config/cache` | Clear cache |
| GET | `/api/logs` | Query logs |
| GET | `/api/logs/dates` | List available log dates |

## Configuration

Config is stored at `/data/config.json`. Example with `fieldSync`:

```json
{
  "stashes": [
    {
      "id": "default",
      "name": "My Stash",
      "endpoint": "http://192.168.1.100:9999",
      "apiKey": "your-stash-api-key",
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

## Version History

### 1.0.0
- Initial public release
- Stash GraphQL integration, Score Override, TV Show hierarchy, fieldSync, image proxy, multi-provider fallback, LRU cache, file-based logging with Web UI, i18n, Synology NAS support

## Contributing

Contributions are welcome. Please open an issue or pull request on [GitHub](https://github.com/pomelosky/plex2stash).

## License

MIT License — see [LICENSE](LICENSE) for details.
