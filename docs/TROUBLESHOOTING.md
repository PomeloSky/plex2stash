[English](TROUBLESHOOTING.md) | [繁體中文](TROUBLESHOOTING_zh-TW.md)

# Plex2Stash Troubleshooting

> [!WARNING]
> **CRITICAL:** If Plex continues to report 404 errors (Double Prefix) after an API update, you MUST restart the Plex Media Server to clear the old Provider cache.

---

## 1. Plex 404 Double Prefix

**Symptom:** Plex successfully adds the Provider, but match/metadata/images requests all return 404.

**Cause:** Feature keys must NOT include `/providers/:stashId` prefix. Plex concatenates Provider URI + Feature key, so a full path in the key causes a double prefix (e.g. `http://NAS:8787/providers/av/providers/av/library/metadata/matches`).

**Solution:** Feature keys must use relative paths only, e.g. `/library/metadata/matches`, `/library/metadata`, `/library/metadata/images`.

**Verify:**
```bash
curl -s http://NAS_IP:8787/providers/YOUR_STASH_ID | python3 -m json.tool | grep key
```
Ensure no key contains `/providers/` prefix.

---

## 2. Plex "object expected" parse error

**Symptom:** Plex receives 200 with JSON but parse fails; log shows `object expected at 1:xxx`.

**Cause:** `Type[]` must use `id` (not `type`), and must be objects not numbers.

**Solution:** Each Type element must be an object with `id`:
```json
"Type": [
  { "id": 1, "Scheme": [{ "scheme": "tv.plex.agents.custom.plex2stash.av" }] },
  { "id": 2, "Scheme": [{ "scheme": "tv.plex.agents.custom.plex2stash.av" }] }
]
```

**Verify:**
```bash
curl -s http://NAS_IP:8787/providers/YOUR_STASH_ID | python3 -m json.tool
```

---

## 3. Plex silently rejecting matches (Score < 80)

**Symptom:** Stash returns matches (log shows `Match "xxx" → N results`), but Plex does not update metadata.

**Cause:** Plex silently rejects match results with score < 80. When Stash matches by scene ID or hash, the returned title (often Japanese) may not resemble the Plex filename, so `titleScore` is 0 and Plex ignores the result.

**Solution:** Score Override forces the top result to 100, ensuring Plex accepts it. Subsequent results are decremented (minimum 80).

**Verify with curl:**
```bash
curl -X POST "http://NAS_IP:8787/providers/YOUR_STASH_ID/library/metadata/matches" \
  -H "Content-Type: application/json" \
  -d '{"title":"ABC-123"}'
```
Confirm the first SearchResult has `score: 100`.

---

## 4. Web UI "Failed to fetch"

**Symptom:** Web UI cannot load stashes, logs, or config; browser shows "Failed to fetch".

**Cause:** Frontend API calls using absolute URLs fail due to CORS or wrong base URL.

**Solution:** Must use relative API paths (e.g. `/api/config/stashes`) with Next.js rewrites proxying to the Fastify backend. Do not use `NEXT_PUBLIC_API_URL` for browser requests.

---

## 5. Test Connection 400 (empty JSON body)

**Symptom:** Test Connection button returns 400; server log shows `FST_ERR_CTP_EMPTY_JSON_BODY`.

**Cause:** POST request with `Content-Type: application/json` but no body.

**Solution:** POST must include body: `JSON.stringify({})` (or equivalent empty object).

---

## 6. Copy button not working on NAS

**Symptom:** Copy-to-clipboard button does nothing on Synology NAS or non-HTTPS environments.

**Cause:** `navigator.clipboard.writeText()` requires a secure context (HTTPS or localhost).

**Solution:** Non-HTTPS environment needs `execCommand('copy')` fallback when Clipboard API is unavailable.

---

## 7. Stash "database is locked"

**Symptom:** Stash returns "database is locked" or similar SQLite errors under load.

**Cause:** Stash uses SQLite; concurrent queries cause DB lock.

**Solution:** LRU cache reduces concurrent queries (match 5min, metadata 30min). Clear cache with:
```bash
curl -X DELETE http://NAS_IP:8787/api/config/cache
```

---

## 8. Synology @eaDir Next.js build error

**Symptom:** Docker build fails on Synology NAS: `Property 'eaDir' is missing in type ...`

**Cause:** Synology creates `@eaDir` in every folder. Next.js App Router treats `app/@xxx` as a parallel route slot.

**Solution:** Three-layer defense:
1. `.dockerignore` excludes `**/@eaDir`
2. Dockerfile build stage runs `find . -name '@eaDir' -exec rm -rf {} +`
3. Layout design avoids slot props that reference `@eaDir`

---

## 9. Docker lockfile error

**Symptom:** `pnpm install --frozen-lockfile` fails during Docker build.

**Cause:** `pnpm-lock.yaml` is missing or out of sync with `package.json`.

**Solution:** Must have `pnpm-lock.yaml` committed. Run `pnpm install` locally, commit the lockfile, then rebuild.

---

## 10. Stash connection refused

**Symptom:** Plex2Stash cannot reach Stash; "connection refused" or timeout.

**Checklist:**
- **Endpoint:** Correct URL (e.g. `http://STASH_IP:9999`), no trailing slash
- **API Key:** Valid Stash API key in Settings → Configuration
- **Firewall:** Port 9999 (or your Stash port) open between Plex2Stash and Stash

**Verify:**
- Use Test Connection button in Web UI
- Or curl:
```bash
curl -X POST http://STASH_IP:9999/graphql \
  -H "Content-Type: application/json" \
  -H "ApiKey: YOUR_KEY" \
  -d '{"query":"{ systemStatus { status } }"}'
```
