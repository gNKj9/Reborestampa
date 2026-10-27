"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { Container } from "@/components/Surface";
import { useAuth } from "@/features/auth/auth-context";
import { ROLE_LABELS } from "@/features/auth/roles";
import { initials } from "@/utils/format";
import { cn } from "@/utils/cn";

const TABS = [
  { href: "/painel", label: "Visão geral" },
  { href: "/painel/contactos", label: "Contactos" },
  { href: "/painel/utilizadores", label: "Utilizadores", adminOnly: true },
  { href: "/painel/atividade", label: "Atividade", adminOnly: true },
  { href: "/painel/conta", label: "Conta" },
] as const;

export function PainelShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur-md">
        <Container className="flex h-[68px] items-center justify-between gap-4">
          <Link href="/" aria-label="Reborestampa — site">
            <Logo compact />
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[0.8rem] leading-tight">{user?.name}</p>
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-ink-muted">
                {user ? ROLE_LABELS[user.role] : ""}
              </p>
            </div>

            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[0.7rem] font-medium text-paper">
              {user ? initials(user.name) : "—"}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void logout();
              }}
            >
              Sair
            </Button>
          </div>
        </Container>

        <div className="border-t border-line/60">
          <Container className="flex gap-1 overflow-x-auto">
            {TABS.filter(
              (tab) => !("adminOnly" in tab && tab.adminOnly) || user?.role === "ADMIN",
            ).map((tab) => {
              const active =
                tab.href === "/painel"
                  ? pathname === "/painel"
                  : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-3 text-[0.72rem] uppercase tracking-[0.16em] transition-colors",
                    active
                      ? "border-accent text-ink"
                      : "border-transparent text-ink-muted hover:text-ink",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </Container>
        </div>
      </header>

      <main className="py-10 sm:py-12">{children}</main>
    </div>
  );
}
