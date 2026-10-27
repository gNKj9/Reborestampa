import type { Metadata } from "next";
import { AccountView } from "@/features/dashboard/components/AccountView";

export const metadata: Metadata = {
  title: "Conta",
  robots: { index: false, follow: false },
};

export default function ContaPage() {
  return <AccountView />;
}
