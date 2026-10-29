import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { ResetForm } from "@/features/auth/components/ResetForm";

export const metadata: Metadata = {
  title: "Nova palavra-passe",
  robots: { index: false, follow: false },
};

export default function RedefinirPage() {
  return (
    <main className="min-h-dvh bg-paper">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-16">
        <Link href="/" aria-label="Reborestampa — site" className="mb-10">
          <Logo />
        </Link>

        <Suspense
          fallback={
            <p className="mt-8 text-[0.85rem] text-ink-muted">A carregar…</p>
          }
        >
          <ResetForm />
        </Suspense>


      </div>
    </main>
  );
}
