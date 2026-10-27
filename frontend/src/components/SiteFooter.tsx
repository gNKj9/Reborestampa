import Link from "next/link";
import { Container } from "@/components/Surface";
import { Logo } from "@/components/Logo";

const LINKEDIN =
  "https://www.linkedin.com/company/reborestampa-estamparia-t%C3%AAxtil/";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 bg-paper-deep/60">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-[22ch] text-[0.82rem] leading-relaxed text-ink-soft">
            Estamparia à peça desde 1992. Produção para clientes nacionais e
            internacionais.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-[0.66rem] font-medium uppercase tracking-[0.22em] text-ink-muted">
            Morada
          </h2>
          <address className="text-[0.85rem] not-italic leading-relaxed text-ink-soft">
            Rua Silva Araújo 1185
            <br />
            4795-120 Vila das Aves
            <br />
            Santo Tirso, Portugal
          </address>
        </div>

        <div className="space-y-3">
          <h2 className="text-[0.66rem] font-medium uppercase tracking-[0.22em] text-ink-muted">
            Navegação
          </h2>
          <ul className="space-y-2 text-[0.85rem] text-ink-soft">
            <li>
              <Link href="/#tecnicas" className="transition-colors hover:text-accent">
                Técnicas
              </Link>
            </li>
            <li>
              <Link href="/#processo" className="transition-colors hover:text-accent">
                Processo
              </Link>
            </li>
            <li>
              <Link href="/login" className="transition-colors hover:text-accent">
                Área de cliente
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-[0.66rem] font-medium uppercase tracking-[0.22em] text-ink-muted">
            Online
          </h2>
          <a
            href={LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[0.85rem] text-ink-soft transition-colors hover:text-accent"
          >
            LinkedIn
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </Container>

      <Container className="flex flex-col gap-2 border-t border-line/70 py-6 text-[0.72rem] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Reborestampa — Estamparia Têxtil</p>
        <p>Vila das Aves · Santo Tirso · Portugal</p>
      </Container>
    </footer>
  );
}
