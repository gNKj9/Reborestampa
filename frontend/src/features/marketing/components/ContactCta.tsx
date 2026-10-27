import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Surface";
import { contact, telHref } from "../content";
import { ContactForm } from "./ContactForm";

export function ContactCta() {
  return (
    <section id="contactos" className="scroll-mt-24 bg-ink py-20 text-paper">
      <Container className="grid gap-12 lg:grid-cols-[1fr_0.95fr]">
        <div className="flex flex-col gap-10">
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
              <ButtonLink
                href="/login"
                className="border border-paper/25 px-6 py-3 text-[0.875rem] text-paper hover:border-paper/60"
              >
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

          <address className="grid gap-6 not-italic sm:grid-cols-2">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.24em] text-paper/50">
                Morada
              </p>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-paper/90">
                {contact.street}
                <br />
                {contact.postal}
                <br />
                {contact.municipality}
              </p>
              <p className="mt-3 space-y-1 text-[0.92rem] text-paper/90">
                {contact.phones.map((phone) => (
                  <a
                    key={phone}
                    href={telHref(phone)}
                    className="block transition-colors hover:text-paper"
                  >
                    {phone}
                  </a>
                ))}
                <a
                  href={`mailto:${contact.email}`}
                  className="block underline decoration-paper/30 underline-offset-4 transition-colors hover:text-paper"
                >
                  {contact.email}
                </a>
              </p>
            </div>

            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.24em] text-paper/50">
                Produção
              </p>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-paper/90">
                Estampagem à peça · até 12 cores
                <br />
                Sintéticos e misturas
              </p>
            </div>
          </address>
        </div>

        <ContactForm />
      </Container>
    </section>
  );
}
