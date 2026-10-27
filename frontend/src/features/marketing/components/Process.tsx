import { Container, Eyebrow } from "@/components/Surface";
import { processSteps } from "../content";

export function Process() {
  return (
    <section id="processo" className="scroll-mt-24 border-b border-line/70 py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>Processo</Eyebrow>
            <h2 className="mt-5 max-w-[16ch] font-display text-[2.1rem] leading-[1.08] sm:text-[2.6rem]">
              Do primeiro traço à peça embalada.
            </h2>
          </div>
          <p className="max-w-[34ch] text-[0.85rem] leading-relaxed text-ink-muted">
            Um percurso curto e verificável, com decisões tomadas em conjunto
            com o cliente.
          </p>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <li key={step.title} className="bg-paper p-6">
              <span className="font-display text-[1.05rem] text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-[0.95rem] font-medium">{step.title}</h3>
              <p className="mt-3 text-[0.83rem] leading-relaxed text-ink-soft">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
