import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Área de cliente",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.02fr_0.98fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex">
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-[380px] w-[380px] rounded-full bg-accent/25 blur-3xl"
          aria-hidden="true"
        />

        <Logo />

        <div className="relative max-w-[24ch]">
          <p className="text-balance font-display text-[2rem] leading-[1.15]">
            «Somos o seu parceiro ideal e&nbsp;imprescindível.»
          </p>
          <p className="mt-5 text-[0.62rem] uppercase tracking-[0.26em] text-paper/50">
            Reborestampa&nbsp;·&nbsp;Vila&nbsp;das&nbsp;Aves&nbsp;·&nbsp;desde&nbsp;1992
          </p>
        </div>

        <div className="halftone h-16 w-40 text-paper/25" aria-hidden="true" />
      </aside>

      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="text-[0.74rem] uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-accent"
          >
            ← Voltar ao site
          </Link>

          <div className="mt-10 lg:hidden">
            <Logo />
          </div>

          <h1 className="mt-8 font-display text-[2.2rem] leading-tight">
            Área de cliente
          </h1>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-ink-soft">
            Acesso reservado à equipa e a clientes com conta.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}
