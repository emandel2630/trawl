import { describe, expect, test } from "bun:test"
import { toPlaywrightProxy } from "../src/pool"

// Playwright/Camoufox `newContext({ proxy })` requires credentials as separate
// `username`/`password` fields and does NOT parse userinfo out of `server`.
// TRAWL accepts proxies as `scheme://user:pass@host:port`, so toPlaywrightProxy
// must split the userinfo out or authenticated proxies fail with 407.
describe("toPlaywrightProxy", () => {
  test("splits embedded credentials into username/password", () => {
    expect(toPlaywrightProxy("http://user:pass@proxy.example.com:8080")).toEqual({
      server: "http://proxy.example.com:8080",
      username: "user",
      password: "pass",
    })
  })

  test("URL-decodes percent-encoded credentials", () => {
    expect(toPlaywrightProxy("http://us%40er:p%3Ass@proxy.example.com:8080")).toEqual({
      server: "http://proxy.example.com:8080",
      username: "us@er",
      password: "p:ss",
    })
  })

  test("no credentials → server only", () => {
    expect(toPlaywrightProxy("http://proxy.example.com:8080")).toEqual({
      server: "http://proxy.example.com:8080",
    })
  })

  test("preserves a non-http scheme (socks5)", () => {
    expect(toPlaywrightProxy("socks5://user:pass@proxy.example.com:1080")).toEqual({
      server: "socks5://proxy.example.com:1080",
      username: "user",
      password: "pass",
    })
  })

  test("username-only proxy keeps username, omits password", () => {
    const result = toPlaywrightProxy("http://user@proxy.example.com:8080")
    expect(result.server).toBe("http://proxy.example.com:8080")
    expect(result.username).toBe("user")
    expect(result.password).toBeUndefined()
  })

  test("schemeless host:port is passed through unchanged as server", () => {
    expect(toPlaywrightProxy("proxy.example.com:8080")).toEqual({
      server: "proxy.example.com:8080",
    })
  })
})
