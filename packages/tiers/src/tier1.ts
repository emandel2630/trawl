import { FINGERPRINT } from "@trawl/browser"
import type { TierResult } from "@trawl/types"
import { isBlocked, isCloudflarePage } from "./detect"
import { normalizeHtml } from "./html"

export interface Tier1Result extends TierResult {
  tier: 1
  html?: string
  statusCode?: number
}

export async function runTier1(
  url: string,
  extraHeaders?: Record<string, string>,
  method?: string,
  body?: string,
  proxy?: string,
): Promise<Tier1Result> {
  const start = Date.now()
  try {
    const res = await fetch(url, {
      method: method ?? "GET",
      body: method === "POST" ? body : undefined,
      headers: {
        "User-Agent": FINGERPRINT.userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        ...extraHeaders,
      },
      redirect: "follow",
      // Bun's fetch honors a `proxy` option (full `scheme://user:pass@host:port`
      // URL, credentials included). Without this the cheap HTTP path egresses on
      // the server's own IP even when the caller supplied a proxy — so a Tier 1
      // win would bypass the proxy the rest of the scrape uses. Not part of the
      // standard RequestInit type, hence the cast; a harmless no-op on runtimes
      // (Node) that ignore unknown fetch options.
      ...(proxy ? { proxy } : {}),
    } as RequestInit & { proxy?: string })

    const html = await res.text()
    const headers: Record<string, string> = {}
    res.headers.forEach((v, k) => {
      headers[k] = v
    })

    if (isCloudflarePage(html, headers)) {
      return { tier: 1, status: "needs-js", durationMs: Date.now() - start, reason: "cloudflare-challenge" }
    }

    if (isBlocked(res.status, html)) {
      return { tier: 1, status: "blocked", durationMs: Date.now() - start, reason: `http-${res.status}` }
    }

    return {
      tier: 1,
      status: "success",
      durationMs: Date.now() - start,
      html: normalizeHtml(html),
      statusCode: res.status,
    }
  } catch (err) {
    return {
      tier: 1,
      status: "error",
      durationMs: Date.now() - start,
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}
