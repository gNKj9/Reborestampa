/**
 * Conteúdo institucional.
 * Fonte: perfil oficial da empresa (LinkedIn) — dados factuais: fundação em
 * 1992 por Miguel Ferreira, sede em Vila das Aves, capacidade até 12 cores,
 * clientes nacionais e internacionais, técnicas listadas.
 * Textos de processo são proposta editorial a validar com a empresa.
 */

export const techniques = [
  "Lacas",
  "Foil",
  "Borracha",
  "Plastisol",
  "Caixa",
  "Glitter",
  "Base de água",
  "Transfloco",
] as const;

export const stats = [
  { value: "1992", label: "Fundação, por Miguel Ferreira" },
  { value: "12", label: "Cores em produção" },
  { value: "8", label: "Técnicas de estamparia" },
  { value: "2", label: "Mercados: nacional e internacional" },
] as const;

export const processSteps = [
  {
    title: "Briefing",
    description:
      "Tecido, motivo, número de cores e acabamento pretendido. É aqui que se decide o que faz sentido produzir.",
  },
  {
    title: "Prova",
    description:
      "Validação de cor e de comportamento da tinta no suporte, antes de qualquer série.",
  },
  {
    title: "Produção",
    description:
      "Estampagem à peça, com controlo por lote e capacidade até 12 cores.",
  },
  {
    title: "Verificação",
    description:
      "Conferência final de cor, registo e acabamento antes da expedição.",
  },
] as const;

export const values = [
  "Qualidade",
  "Responsabilidade",
  "Transparência",
  "Ética",
  "Inovação",
] as const;

export const contact = {
  street: "Rua Silva Araújo 1185",
  postal: "4795-120 Vila das Aves",
  municipality: "Santo Tirso, Portugal",
  linkedin:
    "https://www.linkedin.com/company/reborestampa-estamparia-t%C3%AAxtil/",
} as const;
