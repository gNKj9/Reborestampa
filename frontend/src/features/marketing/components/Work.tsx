import { Container, Eyebrow } from "@/components/Surface";

const SHOTS = [
  {
    src: "/photos/trabalho-1.webp",
    alt: "Pormenor de estampa com flores azuis e vermelhas, lótus rosa e palmeira, sobre malha clara.",
    caption: "Flores e palmeira",
  },
  {
    src: "/photos/trabalho-3.webp",
    alt: "Pormenor de estampa com farol, disco voador sobre pirâmides, barco à vela e flores tropicais.",
    caption: "Farol, pirâmides e flora",
  },
] as const;

const FACTS = ["Motivo ilustrado", "Estampa a várias cores", "Malha clara"] as const;

export function Work() {
  return (
    <section
      id="trabalhos"
      className="scroll-mt-24 border-b border-line/70 py-20"
    >
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>Trabalhos</Eyebrow>
            <h2 className="mt-5 max-w-[20ch] font-display text-[2.1rem] leading-[1.08] sm:text-[2.6rem]">
              Um exemplar, ao detalhe.
            </h2>
          </div>

          <p className="max-w-[46ch] text-[0.92rem] leading-relaxed text-ink-soft">
            Estampa ilustrada a várias cores sobre malha clara: contorno
            definido, áreas de cor sólida e leitura limpa à distância. As
            imagens são de pormenor — o motivo cobre a frente da peça.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {SHOTS.map((shot) => (
            <figure key={shot.src}>
              <div className="overflow-hidden rounded-2xl border border-line bg-paper-deep">
                <img
                  src={shot.src}
                  alt={shot.alt}
                  width={1000}
                  height={1250}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
              <figcaption className="mt-3 text-[0.72rem] uppercase tracking-[0.14em] text-ink-soft">
                {shot.caption}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line/70 pt-5">
          <ul className="flex flex-wrap gap-x-8 gap-y-2 text-[0.8rem] text-ink-soft">
            {FACTS.map((fact) => (
              <li key={fact} className="flex items-center gap-2">
                <span
                  className="h-1 w-1 rounded-full bg-accent"
                  aria-hidden="true"
                />
                {fact}
              </li>
            ))}
          </ul>

          <a
            href="#contactos"
            className="text-[0.8rem] font-medium text-ink transition-colors hover:text-accent"
          >
            Falar sobre um trabalho assim →
          </a>
        </div>
      </Container>
    </section>
  );
}
