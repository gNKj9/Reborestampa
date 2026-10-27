import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Surface";
import { contact } from "../content";

export function ContactCta() {
  return (
    <section id="contactos" className="scroll-mt-24 bg-ink py-20 text-paper">
      <Container className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="inline-flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.28em] text-paper/60">
            <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
            Contactos
          </span>

          <h2 className="mt-6 max-w-[18ch] font-display text-[2.2rem] leading-[1.06] sm:text-[2.7rem]">
            Vamos falar do próximo estampado.
          </h2>

          <p className="mt-5 max-w-[46ch] text-[0.92rem] leading-relaxed text-paper/70">
            Produção à peça, provas de cor e acompanhamento técnico. Recebemos
            briefings de clientes nacionais e internacionais.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/login" variant="accent">
              Área de cliente
            </ButtonLink>
            <a
              href={contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-paper/25 px-6 py-3 text-[0.875rem] text-paper transition-colors hover:border-paper/60"
            >
              LinkedIn
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <address className="grid content-start gap-6 self-end not-italic">
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.24em] text-paper/50">
              Morada
            </p>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-paper/90">
              {contact.street}
              <br />
              {contact.postal}
              <br />
              {contact.municipality}
            </p>
          </div>

          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.24em] text-paper/50">
              Produção
            </p>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-paper/90">
              Estampagem à peça · até 12 cores
              <br />
              Sintéticos e misturas
            </p>
          </div>

          <div className="halftone h-8 w-full text-paper/25" aria-hidden="true" />
        </address>
      </Container>
    </section>
  );
}
