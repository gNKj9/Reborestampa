import { isProduction } from "../config/env.js";
import { logger } from "../config/logger.js";
import { passwordResetRepository } from "../repositories/password-reset.repository.js";
import { refreshTokenRepository } from "../repositories/refresh-token.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { AppError } from "../utils/AppError.js";
import { newId, randomToken, sha256Hex } from "../utils/crypto.js";
import { hashPassword } from "../utils/password.js";
import { auditService } from "./audit.service.js";
import { emailService } from "./email.service.js";

/** Validade do link. Curto de propósito: é uma credencial temporária. */
const TTL_MINUTES = 30;

export const passwordResetService = {
  /**
   * Pede a recuperação. A resposta é sempre a mesma, exista ou não a conta —
   * é o que impede usar este formulário para descobrir emails registados.
   *
   * `devToken` só é devolvido fora de produção e sem provedor de email
   * configurado, para se poder testar o fluxo localmente. Em produção nunca sai.
   */
  async request(
    email: string,
    context: { ip?: string },
  ): Promise<{ devToken: string | null }> {
    const user = await userRepository.findPublicByEmail(email);

    if (!user || !user.isActive) {
      logger.info(
        { ip: context.ip },
        "Recuperação pedida para conta inexistente ou inativa",
      );
      return { devToken: null };
    }

    // Um link novo invalida os anteriores: menos credenciais vivas.
    await passwordResetRepository.invalidatePrevious(user.id);

    const token = randomToken();
    await passwordResetRepository.create({
      id: newId(),
      userId: user.id,
      tokenHash: sha256Hex(token),
      expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000),
    });

    await auditService.record({
      actor: { id: user.id, email: user.email },
      action: "auth.password_reset_requested",
      entity: "user",
      entityId: user.id,
      ip: context.ip ?? null,
    });

    if (emailService.enabled()) {
      try {
        await emailService.sendPasswordReset({
          to: user.email,
          name: user.name,
          token,
          expiresMinutes: TTL_MINUTES,
        });
      } catch (error) {
        // O pedido fica registado; o utilizador pode tentar outra vez.
        logger.error({ err: error }, "Falha ao enviar o email de recuperação");
      }
      return { devToken: null };
    }

    if (isProduction) {
      logger.error(
        "RESEND_API_KEY ausente em produção: a recuperação de palavra-passe não envia email",
      );
      return { devToken: null };
    }

    logger.warn(
      { userId: user.id },
      "Email desativado: link de recuperação devolvido em devToken",
    );
    return { devToken: token };
  },

  /** Consome o link e define a nova palavra-passe. */
  async reset(
    input: { token: string; newPassword: string },
    context: { ip?: string },
  ): Promise<void> {
    const record = await passwordResetRepository.findByHash(
      sha256Hex(input.token),
    );

    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
      throw AppError.badRequest("Ligação inválida ou expirada. Pede uma nova.");
    }

    if (!record.user.isActive) {
      throw AppError.forbidden("Conta desativada. Contacta o administrador.");
    }

    // Consome primeiro: se dois pedidos chegarem juntos com o mesmo link, só um
    // passa. Se a atualização falhar depois, o utilizador pede outro link.
    const claimed = await passwordResetRepository.claim(record.id);
    if (claimed.count === 0) {
      throw AppError.badRequest("Ligação já usada. Pede uma nova.");
    }

    const passwordHash = await hashPassword(input.newPassword);
    await userRepository.updatePassword(record.userId, passwordHash);

    // Recuperação é sinal de que a conta pode ter estado comprometida:
    // todas as sessões caem.
    await refreshTokenRepository.revokeAllForUser(record.userId);

    await auditService.record({
      actor: { id: record.user.id, email: record.user.email },
      action: "auth.password_reset_completed",
      entity: "user",
      entityId: record.userId,
      ip: context.ip ?? null,
    });

    logger.info(
      { userId: record.userId },
      "Palavra-passe redefinida por link de email; sessões revogadas",
    );
  },
};
