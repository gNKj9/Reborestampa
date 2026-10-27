import { PainelShell } from "@/features/dashboard/components/PainelShell";

export default function PainelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PainelShell>{children}</PainelShell>;
}
