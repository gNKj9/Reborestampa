-- Estado do aviso por email em cada pedido de contacto
CREATE TYPE "NotifyStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DISABLED');

ALTER TABLE "contact_requests" ADD COLUMN "notify_status" "NotifyStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "contact_requests" ADD COLUMN "notify_error" VARCHAR(300);
ALTER TABLE "contact_requests" ADD COLUMN "notified_at" TIMESTAMP(3);
