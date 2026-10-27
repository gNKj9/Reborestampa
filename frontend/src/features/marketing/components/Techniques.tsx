import { Container, Eyebrow } from "@/components/Surface";
import { techniques } from "../content";

export function Techniques() {
  return (
    <section id="tecnicas" className="scroll-mt-24 border-b border-line/70 py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow>Técnicas</Eyebrow>
            <h2 className="mt-5 max-w-[14ch] font-display text-[2.1rem] leading-[1.08] sm:text-[2.6rem]">
              Oito formas de pôr a estampa no tecido.
            </h2>
            <p className="mt-5 max-w-[40ch] text-[0.92rem] leading-relaxed text-ink-soft">
              A técnica certa depende do tecido, do motivo e do acabamento
              pretendido. Trabalhamos sintéticos e misturas, com capacidade até
              12 cores.
            </p>
          </div>

          <ul className="divide-y divide-line/80 border-y border-line/80">
            {techniques.map((technique, index) => (
              <li key={technique}>
                <div className="group flex items-baseline gap-5 py-4 transition-colors hover:bg-white/40">
                  <span className="w-8 text-[0.66rem] tabular-nums text-ink-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-display text-[1.35rem] leading-none transition-colors group-hover:text-accent">
                    {technique}
                  </span>
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-ink/25 transition-colors group-hover:border-accent group-hover:bg-accent"
                    aria-hidden="true"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
