import Link from "next/link";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Surface";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/#tecnicas", label: "Técnicas" },
  { href: "/#processo", label: "Processo" },
  { href: "/#empresa", label: "Empresa" },
  { href: "/#contactos", label: "Contactos" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <Container className="grid h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Link href="/" aria-label="Reborestampa — início" className="justify-self-start">
          <Logo />
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[0.82rem] text-ink-soft transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="justify-self-end">
          <ButtonLink href="/login" variant="outline" size="sm">
            Área de cliente
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
