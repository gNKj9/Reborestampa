-- Contactos + gestão de conta
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'READ', 'REPLIED', 'ARCHIVED');

ALTER TABLE "users" ADD COLUMN "password_changed_at" TIMESTAMP(3);

CREATE TABLE "contact_requests" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "company" VARCHAR(160),
    "phone" VARCHAR(40),
    "message" VARCHAR(2000) NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "handled_at" TIMESTAMP(3),
    "handled_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_requests_status_created_at_idx" ON "contact_requests"("status", "created_at");
CREATE INDEX "contact_requests_created_at_idx" ON "contact_requests"("created_at");

ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_handled_by_id_fkey"
  FOREIGN KEY ("handled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
