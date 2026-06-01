import { describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";

function mockRequest(pathname: string, cookie?: string) {
  const url = `http://localhost:3000${pathname}`;
  return {
    nextUrl: new URL(url),
    url,
    cookies: {
      get: vi.fn().mockReturnValue(cookie ? { value: cookie } : undefined)
    }
  } as any;
}

describe("proxy middleware", () => {
  it("allows public routes without session", () => {
    const req = mockRequest("/landing");
    const result = proxy(req);

    expect(result.status).toBe(200);
  });

  it("redirects private routes to /login when no session", () => {
    const req = mockRequest("/dashboard");
    const result = proxy(req);

    expect(result.status).toBe(307);
    expect(result.headers.get("location")).toContain("/login");
  });

  it("allows private routes with valid session cookie", () => {
    const req = mockRequest("/dashboard", "some-session-token");
    const result = proxy(req);

    expect(result.status).toBe(200);
  });

  it("protects all private routes", () => {
    const privateRoutes = ["/dashboard", "/debts", "/expenses", "/goals", "/fgts", "/plan", "/diagnostics", "/settings"];

    for (const route of privateRoutes) {
      const req = mockRequest(route);
      const result = proxy(req);
      expect(result.status).toBe(307);
    }
  });

  it("allows sub-paths of private routes with session", () => {
    const req = mockRequest("/expenses/123", "session-token");
    const result = proxy(req);

    expect(result.status).toBe(200);
  });

  it("redirects sub-paths of private routes without session", () => {
    const req = mockRequest("/expenses/123");
    const result = proxy(req);

    expect(result.status).toBe(307);
  });
});
