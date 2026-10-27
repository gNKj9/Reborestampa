import type { Metadata } from "next";
import { contact, telHref } from "@/features/marketing/content";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Que dados a Reborestampa recolhe através deste site, para que fins, durante quanto tempo e como exercer os teus direitos.",
};

const UPDATED = "27 de outubro de 2026";

export default function PrivacidadePage() {
  return (
    <article className="py-16 sm:py-20">
      <div className="mx-auto w-full max-w-[68ch] px-5 sm:px-8">
        <span className="inline-flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.28em] text-ink-muted">
          <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
          Informação legal
        </span>

        <h1 className="mt-5 font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">
          Política de privacidade
        </h1>

        <p className="mt-4 text-[0.82rem] text-ink-muted">
          Última atualização: {UPDATED}
        </p>

        <div className="mt-10 space-y-10 text-[0.95rem] leading-relaxed text-ink-soft">
          <section>
            <h2 className="font-display text-[1.35rem] text-ink">
              1. Quem trata os dados
            </h2>
            <p className="mt-3">
              O responsável pelo tratamento é <strong>{contact.legalName}</strong>,
              com o NIF {contact.nif} e sede em {contact.street}, {contact.postal},{" "}
              {contact.municipality}.
            </p>
            <p className="mt-3">
              Para qualquer questão sobre privacidade, incluindo o exercício dos
              teus direitos, escreve para{" "}
              <a
                href={`mailto:${contact.email}`}
                className="text-accent underline decoration-accent/30 underline-offset-4 hover:text-accent-deep"
              >
                {contact.email}
              </a>{" "}
              ou liga para{" "}
              <a
                href={telHref(contact.phones[0])}
                className="text-accent underline decoration-accent/30 underline-offset-4 hover:text-accent-deep"
              >
                {contact.phones[0]}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.35rem] text-ink">
              2. Que dados recolhemos
            </h2>
            <p className="mt-3">
              Apenas os dados que decides fornecer no formulário de contacto:
            </p>
            <ul className="mt-3 list-disc space-y-1 ps-5">
              <li>nome;</li>
              <li>email;</li>
              <li>empresa (opcional);</li>
              <li>telefone (opcional);</li>
              <li>o conteúdo da mensagem.</li>
            </ul>
            <p className="mt-3">
              Não pedimos dados de categoria especial, não recolhemos dados de
              navegação para publicidade e não usamos ferramentas de análise de
              audiências.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.35rem] text-ink">
              3. Para que usamos e com que fundamento
            </h2>
            <p className="mt-3">
              Usamos estes dados para responder ao teu pedido, preparar uma
              proposta e manter a conversa comercial que pediste. O fundamento é
              o teu <strong>consentimento</strong> ao submeter o formulário
              (artigo 6.º, n.º 1, alínea a) do RGPD) e, quando a conversa avança
              para uma contratação, as <strong>diligências pré-contratuais</strong>{" "}
              (alínea b) do mesmo artigo).
            </p>
            <p className="mt-3">
              Não usamos os dados para envio de newsletters nem os cedemos a
              terceiros para marketing.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.35rem] text-ink">
              4. Durante quanto tempo
            </h2>
            <p className="mt-3">
              Os pedidos de contacto são conservados durante{" "}
              <strong>24 meses</strong> após o último contacto, para que a
              conversa possa ser retomada. Passado esse prazo são eliminados. Se
              o pedido der origem a uma relação contratual, os dados necessários
              são conservados durante os prazos legais aplicáveis, designadamente
              fiscais.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.35rem] text-ink">
              5. Quem tem acesso
            </h2>
            <p className="mt-3">
              O acesso está limitado a pessoas da empresa com necessidade de o
              ter, através de contas individuais com palavra-passe e perfis de
              permissões distintos.
            </p>
            <p className="mt-3">
              Recorremos a prestadores que alojam o site e a base de dados
              (alojamento na União Europeia), que tratam os dados apenas por
              nossa conta e instrução. Não vendemos nem partilhamos dados
              pessoais com outras entidades.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.35rem] text-ink">
              6. Os teus direitos
            </h2>
            <p className="mt-3">
              Podes pedir, a qualquer momento: acesso aos dados que temos sobre
              ti, correção de dados incorretos, apagamento, limitação do
              tratamento, portabilidade e oposição. Basta escrever para o email
              indicado no ponto 1. Respondemos no prazo de um mês.
            </p>
            <p className="mt-3">
              Se entenderes que o tratamento não está conforme, podes apresentar
              reclamação à Comissão Nacional de Proteção de Dados (CNPD), em{" "}
              <a
                href="https://www.cnpd.pt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline decoration-accent/30 underline-offset-4 hover:text-accent-deep"
              >
                www.cnpd.pt
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.35rem] text-ink">7. Cookies</h2>
            <p className="mt-3">
              O site público não usa cookies de publicidade nem de análise. A
              área reservada usa um único cookie técnico de sessão,{" "}
              <code className="rounded bg-paper-deep/70 px-1.5 py-0.5 text-[0.85em]">
                rb_refresh
              </code>
              , marcado como <code>HttpOnly</code> e <code>SameSite=Strict</code>
              , estritamente necessário para manter a sessão iniciada. Por ser
              essencial, não exige consentimento prévio.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.35rem] text-ink">
              8. Segurança
            </h2>
            <p className="mt-3">
              O acesso ao site é cifrado por HTTPS. As palavras-passe são
              guardadas com algoritmo de hashing próprio para o efeito (Argon2id)
              e nunca em texto simples. O acesso à área reservada é registado e
              limitado por permissões.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.35rem] text-ink">
              9. Alterações
            </h2>
            <p className="mt-3">
              Se esta política mudar, atualizamos a data no topo desta página. As
              alterações com impacto material serão comunicadas a quem tiver um
              pedido em aberto.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[1.35rem] text-ink">
              10. Contacto
            </h2>
            <address className="mt-3 not-italic">
              {contact.legalName}
              <br />
              {contact.street}
              <br />
              {contact.postal}, {contact.municipality}
              <br />
              {contact.phones.join(" · ")}
              <br />
              <a
                href={`mailto:${contact.email}`}
                className="text-accent underline decoration-accent/30 underline-offset-4 hover:text-accent-deep"
              >
                {contact.email}
              </a>
            </address>
          </section>
        </div>
      </div>
    </article>
  );
}
