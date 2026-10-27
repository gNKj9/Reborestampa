import { logger } from "../config/logger.js";
import type { SessionContext } from "../models/auth.schema.js";
import { toPublicUser, type PublicUser } from "../models/user.schema.js";
import { refreshTokenRepository } from "../repositories/refresh-token.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { AppError } from "../utils/AppError.js";
import { newId, sha256Hex } from "../utils/crypto.js";
import { getDummyHash, hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";

type AuthUserRecord = NonNullable<
  Awaited<ReturnType<typeof userRepository.findByEmailWithHash>>
>;

type SessionTokens = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

async function issueSession(
  user: AuthUserRecord,
  context: SessionContext,
): Promise<SessionTokens> {
  const tokenId = newId();
  const access = signAccessToken(user);
  const refresh = signRefreshToken({ userId: user.id, tokenId });

  await refreshTokenRepository.create({
    id: tokenId,
    userId: user.id,
    tokenHash: sha256Hex(refresh.token),
    expiresAt: refresh.expiresAt,
    userAgent: context.userAgent,
    ipAddress: context.ipAddress,
  });

  return {
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt.toISOString(),
    refreshToken: refresh.token,
    refreshTokenExpiresAt: refresh.expiresAt.toISOString(),
  };
}

export const authService = {
  async login(
    input: { email: string; password: string },
    context: SessionContext,
  ): Promise<{ user: PublicUser } & SessionTokens> {
    const user = await userRepository.findByEmailWithHash(input.email);

    if (!user) {
      // Mesmo custo de CPU de um login com utilizador existente.
      await verifyPassword(await getDummyHash(), input.password);
      throw AppError.unauthorized("Credenciais inválidas");
    }

    const passwordMatches = await verifyPassword(user.passwordHash, input.password);
    if (!passwordMatches) {
      logger.warn({ userId: user.id }, "Tentativa de login com password inválida");
      throw AppError.unauthorized("Credenciais inválidas");
    }

    if (!user.isActive) {
      throw AppError.forbidden("Conta desativada. Contacta o administrador.");
    }

    const updated = await userRepository.updateLastLogin(user.id);
    const tokens = await issueSession(user, context);

    return { user: toPublicUser(updated), ...tokens };
  },

  /**
   * Rotação de refresh token com deteção de reutilização:
   * um token já revogado a ser usado significa que foi roubado ou reutilizado —
   * revoga-se toda a família e obriga-se a novo login.
   */
  async refresh(
    rawToken: string,
    context: SessionContext,
  ): Promise<{ user: PublicUser } & SessionTokens> {
    const payload = verifyRefreshToken(rawToken);
    const tokenHash = sha256Hex(rawToken);
    const stored = await refreshTokenRepository.findByHash(tokenHash);

    if (!stored || stored.userId !== payload.sub) {
      throw AppError.unauthorized("Sessão inválida. Inicia sessão novamente.");
    }

    if (stored.revokedAt) {
      await refreshTokenRepository.revokeAllForUser(stored.userId);
      logger.warn(
        { userId: stored.userId, tokenId: stored.id, ip: context.ipAddress },
        "Reutilização de refresh token detetada — família revogada",
      );
      throw AppError.unauthorized("Sessão revogada. Inicia sessão novamente.");
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw AppError.unauthorized("Sessão expirada. Inicia sessão novamente.");
    }

    if (!stored.user.isActive) {
      throw AppError.forbidden("Conta desativada. Contacta o administrador.");
    }

    const newTokenId = newId();
    const newRefresh = signRefreshToken({
      userId: stored.userId,
      tokenId: newTokenId,
    });

    const rotated = await refreshTokenRepository.rotate({
      currentId: stored.id,
      newId: newTokenId,
      newHash: sha256Hex(newRefresh.token),
      newExpiresAt: newRefresh.expiresAt,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    });

    if (!rotated) {
      await refreshTokenRepository.revokeAllForUser(stored.userId);
      throw AppError.unauthorized("Sessão inválida. Inicia sessão novamente.");
    }

    const access = signAccessToken(stored.user);

    return {
      user: toPublicUser(stored.user),
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      refreshToken: newRefresh.token,
      refreshTokenExpiresAt: newRefresh.expiresAt.toISOString(),
    };
  },

  /** Logout idempotente: revoga o token apresentado, se existir. */
  async logout(rawToken?: string): Promise<void> {
    if (!rawToken) return;
    await refreshTokenRepository.revokeByHash(sha256Hex(rawToken));
  },

  async me(userId: string): Promise<PublicUser> {
    const user = await userRepository.findPublicById(userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized("Sessão inválida");
    }
    return toPublicUser(user);
  },

  /**
   * Alteração da própria palavra-passe.
   * Revoga as outras sessões (todas menos a que fez o pedido): se a palavra-passe
   * estava comprometida, quem a tinha perde o acesso.
   */
  async changePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string },
    currentRefreshToken?: string,
  ): Promise<PublicUser> {
    const user = await userRepository.findByIdWithHash(userId);

    if (!user || !user.isActive) {
      throw AppError.unauthorized("Sessão inválida");
    }

    const matches = await verifyPassword(user.passwordHash, input.currentPassword);
    if (!matches) {
      logger.warn({ userId }, "Alteração de palavra-passe com password atual errada");
      throw AppError.badRequest("A palavra-passe atual não está correta");
    }

    if (input.currentPassword === input.newPassword) {
      throw AppError.badRequest(
        "A nova palavra-passe tem de ser diferente da atual",
      );
    }

    const passwordHash = await hashPassword(input.newPassword);
    const updated = await userRepository.updatePassword(user.id, passwordHash);

    await refreshTokenRepository.revokeAllForUser(
      user.id,
      currentRefreshToken ? sha256Hex(currentRefreshToken) : undefined,
    );

    logger.info({ userId }, "Palavra-passe alterada; outras sessões revogadas");

    return toPublicUser(updated);
  },

  async register(input: {
    name: string;
    email: string;
    password: string;
    role: AuthUserRecord["role"];
  }): Promise<PublicUser> {
    const existing = await userRepository.findPublicByEmail(input.email);
    if (existing) {
      throw AppError.conflict("Já existe uma conta com este email");
    }

    const passwordHash = await hashPassword(input.password);

    const created = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });

    return toPublicUser(created);
  },
};
