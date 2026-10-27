import { About } from "@/features/marketing/components/About";
import { ContactCta } from "@/features/marketing/components/ContactCta";
import { Hero } from "@/features/marketing/components/Hero";
import { Process } from "@/features/marketing/components/Process";
import { Production } from "@/features/marketing/components/Production";
import { Techniques } from "@/features/marketing/components/Techniques";

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // Dados estruturados para motores de busca (empresa local).
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Reborestampa — Estamparia Têxtil",
            description:
              "Estamparia à peça desde 1992, em Vila das Aves. Até 12 cores, em sintéticos e misturas.",
            url: "https://reborestampa.onrender.com",
            image: "https://reborestampa.onrender.com/photos/og.jpg",
            logo: "https://reborestampa.onrender.com/brand/logo.webp",
            foundingDate: "1992",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Rua Silva Araújo 1185",
              postalCode: "4795-120",
              addressLocality: "Vila das Aves",
              addressRegion: "Porto",
              addressCountry: "PT",
            },
            sameAs: [
              "https://www.linkedin.com/company/reborestampa-estamparia-t%C3%AAxtil/",
            ],
          }),
        }}
      />
      <Hero />
      <Techniques />
      <Process />
      <Production />
      <About />
      <ContactCta />
    </>
  );
}
