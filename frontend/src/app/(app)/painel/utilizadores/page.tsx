import type { Metadata } from "next";
import { UsersView } from "@/features/dashboard/components/UsersView";

export const metadata: Metadata = {
  title: "Utilizadores",
  robots: { index: false, follow: false },
};

export default function UtilizadoresPage() {
  return <UsersView />;
}
