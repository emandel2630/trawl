// Capture a base64 JPEG viewport screenshot of the current page, or undefined on
// any failure. Used as a visual "did we actually render the page" indicator for
// the browser tiers. JPEG@60 + viewport-only (not fullPage) keeps the base64
// payload small; a screenshot is never worth failing an otherwise-successful
// scrape, so all errors collapse to undefined.
// biome-ignore lint/suspicious/noExplicitAny: camoufox-js doesn't export the Page type
export async function capturePageScreenshot(page: any): Promise<string | undefined> {
  try {
    const buf = await page.screenshot({ type: "jpeg", quality: 60 })
    return Buffer.from(buf).toString("base64")
  } catch {
    return undefined
  }
}
