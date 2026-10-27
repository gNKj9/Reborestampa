import Link from "next/link";
import { ButtonLink } from "@/components/Button";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="mt-10 font-display text-[3rem] leading-none">404</p>
        <p className="mt-3 text-[0.92rem] text-ink-soft">
          Esta página não existe — ou a estampa saiu fora do registo.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/" variant="primary">
            Voltar ao início
          </ButtonLink>
          <Link
            href="/login"
            className="inline-flex items-center rounded-full px-4 py-3 text-[0.85rem] text-ink-soft transition-colors hover:text-accent"
          >
            Área de cliente
          </Link>
        </div>
      </div>
    </div>
  );
}
