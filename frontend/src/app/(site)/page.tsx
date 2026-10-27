import { About } from "@/features/marketing/components/About";
import { ContactCta } from "@/features/marketing/components/ContactCta";
import { Hero } from "@/features/marketing/components/Hero";
import { Process } from "@/features/marketing/components/Process";
import { Techniques } from "@/features/marketing/components/Techniques";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Techniques />
      <Process />
      <About />
      <ContactCta />
    </>
  );
}
