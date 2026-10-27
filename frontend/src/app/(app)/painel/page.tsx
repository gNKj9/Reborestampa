import type { Metadata } from "next";
import { PainelView } from "@/features/dashboard/components/PainelView";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default function PainelPage() {
  return <PainelView />;
}
