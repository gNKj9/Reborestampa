import type { Metadata } from "next";
import { AuditView } from "@/features/dashboard/components/AuditView";

export const metadata: Metadata = {
  title: "Atividade",
  robots: { index: false, follow: false },
};

export default function AtividadePage() {
  return <AuditView />;
}
