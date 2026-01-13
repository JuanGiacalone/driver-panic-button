import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";



export function registerAuthRoutes(app: Express) {
  // PIN-based login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { deviceId, pin } = req.body;

    if (!deviceId || !pin) {
      res.status(400).json({ error: "deviceId and pin are required" });
      return;
    }

    try {
      const { authenticateUser, generateSessionToken } = await import("./pin-auth");
      const user = await authenticateUser(deviceId, pin);
      const sessionToken = await generateSessionToken(deviceId);

      const cookieOptions = getSessionCookieOptions(req);
      const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        sessionToken,
        user: {
          id: user.id,
          deviceId: user.deviceId,
          name: user.name,
          role: user.role,
          lastSignedIn: user.lastSignedIn.toISOString(),
        },
      });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(401).json({
        error: error instanceof Error ? error.message : "Login failed"
      });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  // Get current authenticated user - works with both cookie (web) and Bearer token (mobile)
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({
        user: {
          id: (user as any)?.id ?? null,
          deviceId: (user as any)?.deviceId ?? null,
          name: (user as any)?.name ?? null,
          role: (user as any)?.role ?? null,
          lastSignedIn: ((user as any)?.lastSignedIn ?? new Date()).toISOString(),
        },
      });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  // Establish session cookie from Bearer token
  // Used by iframe preview: frontend receives token via postMessage, then calls this endpoint
  // to get a proper Set-Cookie response from the backend (3000-xxx domain)
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      // Authenticate using Bearer token from Authorization header
      const user = await sdk.authenticateRequest(req);

      // Get the token from the Authorization header to set as cookie
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();

      // Set cookie for this domain (3000-xxx)
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        user: {
          id: (user as any)?.id ?? null,
          deviceId: (user as any)?.deviceId ?? null,
          name: (user as any)?.name ?? null,
          role: (user as any)?.role ?? null,
          lastSignedIn: ((user as any)?.lastSignedIn ?? new Date()).toISOString(),
        },
      });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
}
