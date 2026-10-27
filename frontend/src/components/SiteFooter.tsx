import Link from "next/link";
import { Container } from "@/components/Surface";
import { contact, telHref } from "@/features/marketing/content";

const LINKEDIN =
  "https://www.linkedin.com/company/reborestampa-estamparia-t%C3%AAxtil/";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 bg-paper-deep/60">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <img
            src="/brand/logo.webp"
            alt="Reborestampa — Estamparia Têxtil"
            width={760}
            height={554}
            loading="lazy"
            decoding="async"
            className="h-auto w-[150px]"
          />
          <p className="max-w-[24ch] text-[0.82rem] leading-relaxed text-ink-soft">
            Estamparia à peça desde 1992. Produção para clientes nacionais e
            internacionais.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-[0.66rem] font-medium uppercase tracking-[0.22em] text-ink-muted">
            Morada
          </h2>
          <address className="space-y-2 text-[0.85rem] not-italic leading-relaxed text-ink-soft">
            <p>
              {contact.street}
              <br />
              {contact.postal}
              <br />
              {contact.municipality}
            </p>
            <p className="space-y-1">
              {contact.phones.map((phone) => (
                <a
                  key={phone}
                  href={telHref(phone)}
                  className="block transition-colors hover:text-accent"
                >
                  {phone}
                </a>
              ))}
              <a
                href={`mailto:${contact.email}`}
                className="block transition-colors hover:text-accent"
              >
                {contact.email}
              </a>
            </p>
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
        <p>
          © {new Date().getFullYear()} Reborestampa — Estamparia Têxtil · NIF{" "}
          {contact.nif}
        </p>
        <p className="flex flex-wrap items-center gap-3">
          <span>Vila das Aves · Santo Tirso · Portugal</span>
          <Link
            href="/privacidade"
            className="transition-colors hover:text-accent"
          >
            Privacidade
          </Link>
        </p>
      </Container>
    </footer>
  );
}
