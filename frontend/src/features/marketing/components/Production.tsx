import { Container, Eyebrow } from "@/components/Surface";

const FACTS = [
  "Até 12 cores por estampado",
  "Matérias-primas sintéticas e misturas",
  "Prova de cor antes de cada série",
] as const;

export function Production() {
  return (
    <section id="producao" className="scroll-mt-24 border-b border-line/70 py-20">
      <Container className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <figure className="relative">
          <div className="overflow-hidden rounded-2xl border border-line bg-paper-deep">
            <img
              src="/photos/producao.jpg"
              alt="Máquinas de estampagem e tecido branco sobre as mesas de produção"
              width={820}
              height={1025}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <figcaption className="mt-3 flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.16em] text-ink-soft">
            <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
            Unidade de Vila das Aves
          </figcaption>
        </figure>

        <div>
          <Eyebrow>Produção</Eyebrow>
          <h2 className="mt-5 max-w-[16ch] font-display text-[2.1rem] leading-[1.08] sm:text-[2.6rem]">
            Onde a estampa acontece.
          </h2>

          <p className="mt-5 max-w-[52ch] text-[0.93rem] leading-relaxed text-ink-soft">
            A estampagem é feita à peça, em Vila das Aves. Cada trabalho é
            ajustado ao tecido — sintéticos e misturas — e verificado antes de
            sair para o cliente.
          </p>

          <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
            {FACTS.map((fact) => (
              <li
                key={fact}
                className="bg-paper px-4 py-4 text-[0.78rem] leading-snug text-ink-soft"
              >
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
