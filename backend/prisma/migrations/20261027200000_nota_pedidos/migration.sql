-- Nota interna por pedido de contacto
ALTER TABLE "contact_requests" ADD COLUMN "internal_note" VARCHAR(2000);
ALTER TABLE "contact_requests" ADD COLUMN "note_updated_at" TIMESTAMP(3);
ALTER TABLE "contact_requests" ADD COLUMN "note_updated_by_id" UUID;

ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_note_updated_by_id_fkey"
  FOREIGN KEY ("note_updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
