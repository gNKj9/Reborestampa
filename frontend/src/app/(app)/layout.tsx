import { AuthGuard } from "@/features/auth/components/AuthGuard";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthGuard>{children}</AuthGuard>;
}
