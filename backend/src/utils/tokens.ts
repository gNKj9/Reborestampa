import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./AppError.js";
import type { Role } from "../models/role.js";

/**
 * Dois tipos de token, duas chaves distintas:
 * - access  (curto, devolvido no corpo, guardado em memória no cliente)
 * - refresh (longo, apenas em cookie HttpOnly; no servidor guarda-se só o hash)
 */

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: Role;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
  jti: string;
};

const baseSignOptions = {
  algorithm: "HS256",
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
} satisfies SignOptions;

export function signAccessToken(user: {
  id: string;
  email: string;
  role: Role;
}): { token: string; expiresAt: Date } {
  const token = jwt.sign(
    { email: user.email, role: user.role, type: "access" },
    env.JWT_ACCESS_SECRET,
    {
      ...baseSignOptions,
      subject: user.id,
      expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    },
  );

  return {
    token,
    expiresAt: new Date(Date.now() + env.ACCESS_TOKEN_TTL_SECONDS * 1000),
  };
}

export function signRefreshToken(params: {
  userId: string;
  tokenId: string;
}): { token: string; expiresAt: Date } {
  const token = jwt.sign(
    { type: "refresh" },
    env.JWT_REFRESH_SECRET,
    {
      ...baseSignOptions,
      subject: params.userId,
      jwtid: params.tokenId,
      expiresIn: env.REFRESH_TOKEN_TTL_SECONDS,
    },
  );

  return {
    token,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000),
  };
}

function verify<T extends JwtPayload>(token: string, secret: string): T {
  try {
    return jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as T;
  } catch {
    throw AppError.unauthorized("Token inválido ou expirado");
  }
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = verify<JwtPayload & Partial<AccessTokenPayload>>(
    token,
    env.JWT_ACCESS_SECRET,
  );

  if (
    payload.type !== "access" ||
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw AppError.unauthorized("Token de acesso inválido");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role as Role,
    type: "access",
  };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = verify<JwtPayload & Partial<RefreshTokenPayload>>(
    token,
    env.JWT_REFRESH_SECRET,
  );

  if (
    payload.type !== "refresh" ||
    typeof payload.sub !== "string" ||
    typeof payload.jti !== "string"
  ) {
    throw AppError.unauthorized("Token de sessão inválido");
  }

  return { sub: payload.sub, type: "refresh", jti: payload.jti };
}
