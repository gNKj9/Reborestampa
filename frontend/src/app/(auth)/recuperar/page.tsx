import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { RecoverForm } from "@/features/auth/components/RecoverForm";

export const metadata: Metadata = {
  title: "Recuperar acesso",
  robots: { index: false, follow: false },
};

export default function RecuperarPage() {
  return (
    <main className="min-h-dvh bg-paper">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-16">
        <Link href="/" aria-label="Reborestampa — site" className="mb-10">
          <Logo />
        </Link>

        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-ink-muted">
          Área de cliente
        </p>
        <h1 className="mt-3 font-display text-[2rem] leading-tight sm:text-[2.3rem]">
          Recuperar acesso.
        </h1>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-soft">
          Indica o email da conta. Se existir, enviamos um link para definires uma
          palavra-passe nova.
        </p>

        <RecoverForm />

        <Link
          href="/login"
          className="mt-8 text-center text-[0.78rem] text-ink-muted transition-colors hover:text-accent"
        >
          Voltar ao login
        </Link>
      </div>
    </main>
  );
}
