// Capture a base64 JPEG full-page screenshot of the current page, or undefined
// on any failure. Used as a visual "did we actually render the page" indicator
// for the browser tiers. A screenshot is never worth failing an otherwise-
// successful scrape, so all errors collapse to undefined.
// biome-ignore lint/suspicious/noExplicitAny: camoufox-js doesn't export the Page type
export async function capturePageScreenshot(page: any): Promise<string | undefined> {
  try {
    // Tier 3 grabs HTML the moment a challenge clears, before late content
    // (images, fonts, lazy hydration) has painted — so without a settle wait the
    // shot is a half-loaded page. Wait for the network to go idle, then a short
    // fixed beat for anything that paints after the last request. Both are
    // bounded and swallow their errors: a screenshot must never hang or fail the
    // scrape, so we shoot whatever is on screen when the budget runs out.
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(500).catch(() => {})
    const buf = await page.screenshot({ type: "jpeg", quality: 60, fullPage: true })
    return Buffer.from(buf).toString("base64")
  } catch {
    return undefined
  }
}
