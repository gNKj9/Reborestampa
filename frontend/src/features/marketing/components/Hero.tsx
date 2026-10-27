import { ButtonLink } from "@/components/Button";
import { Container, Eyebrow } from "@/components/Surface";
import { stats } from "../content";

const SWATCHES = [
  "#b23a1d",
  "#c8862a",
  "#6f7a3a",
  "#2f6b63",
  "#2c4a72",
  "#6b3f63",
  "#c9a888",
  "#8c3b2a",
  "#3f5d43",
  "#54606b",
  "#e6dcc6",
  "#211d18",
];

function ColourScale() {
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      {/* Folhas empilhadas: o gesto de carimbar, em camadas. */}
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[28px] border border-ink/15" />
      <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-[28px] border border-ink/25" />

      <div className="relative rounded-[28px] border border-ink/25 bg-paper-deep p-6 shadow-[0_18px_50px_-24px_rgba(23,20,15,0.45)]">
        <div className="flex items-center justify-between text-[0.58rem] uppercase tracking-[0.22em] text-ink-muted">
          <span>Escala de produção</span>
          <span>12 cores</span>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2.5">
          {SWATCHES.map((colour, index) => (
            <div
              key={colour}
              className="aspect-square rounded-[6px] ring-1 ring-inset ring-ink/10"
              style={{ backgroundColor: colour }}
              aria-hidden="true"
              data-swatch={index + 1}
            />
          ))}
        </div>

        <div className="mt-7 flex items-end justify-between border-t border-ink/10 pt-5">
          <p className="font-display text-[1.6rem] leading-[1.1]">
            à peça,
            <br />
            com detalhe.
          </p>
          <div className="flex flex-col items-end gap-2">
            <span className="halftone-dense h-9 w-9 text-accent" aria-hidden="true" />
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-ink-muted">
              Vila das Aves
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line/70">
      <div
        className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />

      <Container className="relative grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <Eyebrow>Estamparia à peça · desde 1992</Eyebrow>

          <h1 className="mt-6 max-w-[18ch] font-display text-[2.6rem] leading-[1.02] tracking-[-0.02em] sm:text-[3.4rem] lg:text-[3.9rem]">
            O detalhe que faz a peça.
          </h1>

          <p className="mt-6 max-w-[52ch] text-[0.98rem] leading-relaxed text-ink-soft">
            Produção e comercialização de estampagem à peça em Vila&nbsp;das&nbsp;Aves.
            Lacas, foil, borracha, plastisol, glitter e base de água — até 12
            cores, em matérias-primas sintéticas e misturas, para clientes
            nacionais e internacionais.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="#contactos" variant="primary">
              Falar com a empresa
            </ButtonLink>
            <ButtonLink href="#tecnicas" variant="outline">
              Conhecer as técnicas
            </ButtonLink>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line/80 pt-8 sm:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label}>
                <dt className="font-display text-[1.7rem] leading-none">
                  {item.value}
                </dt>
                <dd className="mt-2 text-[0.68rem] leading-snug text-ink-muted">
                  {item.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <ColourScale />
      </Container>
    </section>
  );
}
