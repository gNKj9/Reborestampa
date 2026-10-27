import type { Metadata } from "next";
import { ContactsView } from "@/features/dashboard/components/ContactsView";

export const metadata: Metadata = {
  title: "Pedidos de contacto",
  robots: { index: false, follow: false },
};

export default function ContactosPage() {
  return <ContactsView />;
}
