import { Container, Eyebrow } from "@/components/Surface";
import { values } from "../content";

export function About() {
  return (
    <section id="empresa" className="scroll-mt-24 border-b border-line/70 py-20">
      <Container className="grid gap-12 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <Eyebrow>Empresa</Eyebrow>
          <h2 className="mt-5 max-w-[16ch] font-display text-[2.1rem] leading-[1.08] sm:text-[2.6rem]">
            Trinta anos a estampar para quem não aceita menos.
          </h2>

          <div className="mt-6 max-w-[58ch] space-y-4 text-[0.93rem] leading-relaxed text-ink-soft">
            <p>
              Fundada em 1992 por Miguel Ferreira, a Reborestampa nasceu em Santo
              Tirso e mudou-se para Vila das Aves para melhorar a prestação de
              serviços. Hoje produz para clientes nacionais e internacionais.
            </p>
            <p>
              A missão é simples de enunciar e exigente de cumprir: responder às
              necessidades dos clientes com qualidade e competência, agregando
              valor ao produto.
            </p>
          </div>

          <blockquote className="mt-8 border-l-2 border-accent pl-5 font-display text-[1.25rem] leading-snug text-ink">
            «Oferecer o melhor serviço de estampagem à peça através da inovação
            e excelência.»
            <footer className="mt-3 font-sans text-[0.68rem] uppercase tracking-[0.2em] text-ink-muted">
              Visão
            </footer>
          </blockquote>
        </div>

        <div className="rounded-2xl border border-line bg-white/50 p-7">
          <h3 className="text-[0.66rem] font-medium uppercase tracking-[0.22em] text-ink-muted">
            Valores
          </h3>
          <ul className="mt-5 space-y-4">
            {values.map((value, index) => (
              <li
                key={value}
                className="flex items-baseline justify-between gap-4 border-b border-line/70 pb-4 last:border-0 last:pb-0"
              >
                <span className="font-display text-[1.15rem]">{value}</span>
                <span className="text-[0.66rem] tabular-nums text-ink-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
