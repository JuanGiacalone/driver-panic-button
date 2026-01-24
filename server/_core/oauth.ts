import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";



export function registerAuthRoutes(app: Express) {
  // User registration
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { deviceId, username, pin, name, phone, email } = req.body;

    if (!deviceId || !username || !pin || !phone || !email) {
      res.status(400).json({ error: "deviceId, username, pin, phone y email son requeridos" });
      return;
    }

    // Validate PIN format (6 digits)
    if (!/^\d{6}$/.test(pin)) {
      res.status(400).json({ error: "El PIN debe ser de 6 dígitos" });
      return;
    }

    // Validate username format (alphanumeric, 3-20 characters)
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      res.status(400).json({ error: "El nombre de usuario debe tener entre 3 y 20 caracteres alfanuméricos" });
      return;
    }

    try {
      const { getUserByUsername } = await import("../db");
      const existingUser = await getUserByUsername(username);

      if (existingUser) {
        res.status(409).json({ error: "Este nombre de usuario ya está registrado" });
        return;
      }

      const { getUserByDeviceId } = await import("../db");
      const existingDevice = await getUserByDeviceId(deviceId);

      if (existingDevice) {
        res.status(409).json({ error: "Este dispositivo ya tiene un usuario registrado" });
        return;
      }

      const { createUser } = await import("./pin-auth");
      await createUser(deviceId, username, pin, name, undefined, phone, email);

      res.json({
        success: true,
        message: "Registro exitoso. Tu cuenta será activada por el administrador.",
      });
    } catch (error) {
      console.error("[Auth] Registration failed:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Error al registrar usuario"
      });
    }
  });

  // PIN-based login with username
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, deviceId, pin } = req.body;

    if (!username || !deviceId || !pin) {
      res.status(400).json({ error: "username, deviceId y pin son requeridos" });
      return;
    }

    try {
      const { authenticateUser, generateSessionToken } = await import("./pin-auth");
      const user = await authenticateUser(username, deviceId, pin);
      const sessionToken = await generateSessionToken(deviceId, user.username);

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
          email: user.email,
          role: user.role,
          lastSignedIn: user.lastSignedIn,
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
          id: user.id,
          deviceId: user.deviceId,
          name: user.name,
          email: user.email,
          role: user.role,
          lastSignedIn: user.lastSignedIn,
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
          email: (user as any)?.email ?? null,
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
