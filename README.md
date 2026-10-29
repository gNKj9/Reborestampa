# Reborestampa — site e plataforma

Site institucional e área reservada da **Reborestampa — Estamparia Têxtil**
(Vila das Aves, Santo Tirso), construído segundo a especificação de arquitetura
entregue: monorepo, Next.js no frontend, API em camadas no backend, PostgreSQL e
Docker.

Está em produção em <https://reborestampa.onrender.com>.

## O que a aplicação faz

**Site público**
- Página institucional: técnicas, processo, produção, exemplar de trabalho, empresa e contactos.
- Formulário de contacto real (nome, email, empresa, telefone, mensagem) com honeypot e limite por IP.
- Página de política de privacidade e dados de contacto da empresa.
- `sitemap.xml` e `robots.txt` explícitos (área reservada e recuperação fora dos índices).
- Marca aplicada (logotipo, favicon, imagem de partilha) e dados estruturados para pesquisa.

**Área reservada** (`/painel`, sessão com refresh token rotativo)
- **Contactos**: caixa de entrada com pesquisa, filtros por estado, paginação, exportação CSV, nota interna e ação de resposta por email.
- **Utilizadores**: criação de contas, papéis (`ADMIN`/`EDITOR`/`VIEWER`), ativação, reposição de palavra-passe com gerador.
- **Conta**: alteração da própria palavra-passe (exige a atual e termina as outras sessões) e recuperação por link de email (30 minutos, uso único).
- **Atividade**: registo de auditoria de tudo o que é administrativo.

**Por fazer**: o domínio de negócio (clientes, encomendas, referências, provas de cor).

---

## Stack

| Camada      | Tecnologia                                                              |
| ----------- | ----------------------------------------------------------------------- |
| Frontend    | Next.js 16 (App Router), React 19, TypeScript estrito, Tailwind CSS 4    |
| Backend     | Node.js 22, Express 5, TypeScript estrito, Zod, Pino                     |
| Dados       | PostgreSQL 17, Prisma 7 (driver adapter `pg`, prepared statements)      |
| Email       | Resend (opcional; sem chave, o site funciona igual)                     |
| Infra       | Docker + Docker Compose · Render + Neon · GitHub Actions                |

---

## Marca e imagens

- `frontend/public/brand/logo.webp` — lockup oficial (recortado, fundo transparente)
- `frontend/public/brand/mark.webp` / `mark-192.webp` — símbolo (círculo com o "R" e salpicos)
- `frontend/src/app/icon.png` — favicon, marca sobre fundo papel
- `frontend/public/photos/producao.jpg` / `.webp` — fotografia de produção (4:5)
- `frontend/public/photos/og.jpg` — imagem de partilha (1200×630, Open Graph)
- `frontend/public/photos/trabalho-1.webp` / `trabalho-3.webp` — exemplar de
  produção (estampa ilustrada a várias cores), recortado a 4:5 a partir das
  fotografias originais. A secção `Trabalhos` mostra pormenores, não a peça inteira.

No cabeçalho a marca aparece como símbolo + nome composto com a tipografia do site
(legível a qualquer tamanho); o rodapé mostra o lockup completo. A cor de acento do
site (magenta `#c2185b`) foi alinhada com o logotipo.

---

## Estrutura

```text
Reborestampa/
├── frontend/
│   ├── public/                    # estáticos (marca, fotografias)
│   ├── src/
│   │   ├── assets/                # globals.css (tema Tailwind)
│   │   ├── components/            # UI reutilizável (Button, Field, Logo, ...)
│   │   ├── features/              # auth, dashboard, marketing (por domínio)
│   │   ├── app/                   # rotas Next (route groups: site, auth, app)
│   │   ├── services/              # cliente HTTP + serviços de API
│   │   └── utils/                 # cn, formatação, gerador de palavras-passe
│   └── Dockerfile
├── backend/
│   ├── src/ …                     # api, services, repositories, models, middlewares
│   ├── prisma/                    # schema, migrações, seed
│   ├── tests/
│   │   ├── smoke.sh               # auth, RBAC, rotação, CORS, limites
│   │   └── smoke-admin.sh         # contactos, contas, auditoria, CSV
│   └── Dockerfile
├── deploy/
│   ├── Dockerfile                 # imagem única (site + API) para PaaS
│   └── start.sh                   # migrações + seed + arranque
├── scripts/
│   ├── setup-env.py               # gera segredos e password do admin
│   └── preflight.sh               # 20 verificações contra produção
├── docs/
│   └── operacao.md                # runbook: contas, deploy, restauro, handover
├── .github/workflows/ci.yml       # CI: tipos, builds e smoke tests
├── docker-compose.yml
├── render.yaml                    # blueprint do deploy gratuito
├── .env.example
└── .gitignore
```

---

## Arranque rápido (Docker)

1. Criar o ficheiro de ambiente e gerar credenciais. O script pede a
   palavra-passe do administrador duas vezes e escreve no `.env`:

```bash
cp .env.example .env
python3 scripts/setup-env.py --echo
```

O `--echo` mostra o que escreves (sem ele, o terminal fica mudo — é o
comportamento normal). Se as duas palavras-passe não coincidirem, o script
repete o pedido até três vezes sem alterar nada.

2. Levantar a stack:

```bash
docker compose up --build
```

Se o volume da base de dados já tiver sido criado com outra password, apaga-o
primeiro com `docker compose down -v` (não há dados de produção a perder).

- Site: <http://localhost:3000>
- API: <http://localhost:4000/api/health> · prontidão: `/api/health/ready`
- Login inicial: os valores de `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` no `.env`

O serviço `migrate` corre `prisma migrate deploy` e o seed antes de a API arrancar.
A base de dados só publica o porto em `127.0.0.1` e vive numa rede Docker sem saída
para a Internet.

## Arranque local (sem Docker)

Requer PostgreSQL a correr em `localhost:5432` (pode usar `docker compose up db`).

```bash
cd backend
cp ../.env .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

A API fica em <http://localhost:4000>. O `.env` da raiz já aponta para
`localhost:5432`; se usares o PostgreSQL do compose, sobe-o com
`docker compose up -d db` (com a mesma password do `.env`).

```bash
cd frontend
npm install
npm run dev
```

O frontend fica em <http://localhost:3000>. `NEXT_PUBLIC_API_URL` tem por omissão
`http://localhost:4000/api`; define-a em `frontend/.env.local` apenas se a API
estiver noutro endereço.

## Comandos

| Onde     | Comando                | Efeito                                        |
| -------- | ---------------------- | --------------------------------------------- |
| backend  | `npm run dev`          | API com reload (tsx)                          |
| backend  | `npm run typecheck`    | `tsc --noEmit`                                |
| backend  | `npm run build`        | `prisma generate` + `tsc` para `dist/`        |
| backend  | `npm start`            | API compilada                                 |
| backend  | `npm run db:migrate`   | nova migração em desenvolvimento              |
| backend  | `npm run db:deploy`    | aplica migrações (produção/CI)                |
| backend  | `npm run db:seed`      | cria o administrador inicial (idempotente)    |
| backend  | `npm run db:studio`    | Prisma Studio                                 |
| backend  | `npm run db:stats`     | fotografia da base (utilizadores, pedidos, auditoria) |
| raiz     | `bash scripts/preflight.sh` | verificação pós-deploy contra um URL     |
| backend  | `bash tests/smoke.sh`  | smoke test end-to-end (precisa da API a correr) |
| backend  | `bash tests/smoke-admin.sh` | contactos, papéis e palavras-passe (precisa de `ADMIN_PASSWORD`) |
| frontend | `npm run dev` / `build` / `start` | desenvolvimento / build / servidor |
| frontend | `npm run typecheck`    | `tsc --noEmit`                                |

Os testes de administração alteram dados: use uma base de desenvolvimento. O
`smoke-admin.sh` promove contas a EDITOR, repõe palavras-passe e muda a do
administrador no fim — em bases partilhadas, recrie o ambiente a seguir.

---

## Integração contínua (GitHub Actions)

`.github/workflows/ci.yml` corre a cada `push` para `main`, a cada pull request e
manualmente (Actions → CI → Run workflow). Dois jobs independentes:

**API + base de dados**
1. `npm ci`, `typecheck`, `migrate deploy` e `seed` contra um **PostgreSQL 17** de serviço
2. `build` e arranque da API compilada, à espera de `/api/health/ready`
3. `tests/smoke.sh` — auth, RBAC, rotação de refresh, CORS, rate limiting
4. **reinício da API** (os contadores de rate limit vivem em memória e o teste
   anterior queima-os de propósito)
5. `tests/smoke-admin.sh` — contactos, contas, palavra-passes, auditoria, CSV

**Site**
1. `npm ci` e `typecheck`
2. build `standalone` (docker-compose) e build `export` (Render)

Em caso de falha, os logs da API são impressos no fim do job. Os segredos usados
no CI são efémeros e não correspondem a nenhum ambiente real.

---

## Operação

O runbook completo está em **`docs/operacao.md`**: propriedade das contas,
administração, deploy e rollback, rotação de segredos, backup/restauro do Neon,
monitorização e checklist de passagem de testemunho.

Duas ferramentas para o dia a dia:

```bash
BASE_URL=https://reborestampa.onrender.com bash scripts/preflight.sh
cd backend && DATABASE_URL='postgresql://…' npm run db:stats
```

O `preflight.sh` verifica 20 coisas (páginas, API, cabeçalhos, recuperação) e sai
com código 1 se alguma falhar. O `db:stats` imprime o estado da base e avisa se só
existir um administrador ativo.

---

## Deploy na Render (+ Neon)

Neste modo, **um único serviço** serve o site e a API na mesma origem: o Next é
compilado como HTML estático (`output: "export"`) e o Express serve o `out/` em
`/` e a API em `/api`. Sem CORS e com o cookie de refresh first-party.

1. **Base de dados (Neon, grátis e sem prazo)**
   Criar um projeto em <https://neon.com>, região Frankfurt, e copiar a
   connection string **direta** (sem `-pooler`). Recomendado `?sslmode=verify-full`
   (o `require` funciona, mas o `pg` avisa que vai mudar de semântica).

2. **Repositório** — o `.env` fica de fora (está no `.gitignore`).

3. **Render** — New → **Blueprint** → escolher o repositório. O `render.yaml` cria
   o serviço Docker com health check em `/api/health`. Preencher no dashboard:

   | Variável | Valor |
   | --- | --- |
   | `DATABASE_URL` | a do Neon |
   | `SEED_ADMIN_PASSWORD` | 12+ caracteres, maiúscula, minúscula e algarismo |
   | `RESEND_API_KEY` | opcional; sem ela não há aviso por email |
   | `CONTACT_NOTIFY_TO` | destinatário dos avisos (ver nota do Resend abaixo) |

   `TRUST_PROXY=2` é obrigatório na Render: a cadeia tem dois saltos (edge + router
   interno). Com o valor `1`, o `req.ip` fica em `10.x` e **todos os visitantes
   partilham o mesmo balde** de rate limiting.

4. **Arranque** — o `deploy/start.sh` aplica `prisma migrate deploy`, corre o seed
   idempotente e só depois inicia a API. O site fica em `https://<nome>.onrender.com`.

Limitações do plano gratuito, para decidir com informação:

- O serviço **dorme após 15 minutos** sem tráfego; o primeiro visitante espera
  cerca de um minuto.
- A Render diz na documentação que instâncias free **não são para produção** —
  servem para demonstração e validação.
- O Postgres gratuito da Render expira ao fim de algumas semanas; por isso a
  base de dados fica no Neon, que não tem prazo.
- `COOKIE_SECURE=true` (já definido no `render.yaml`) porque a Render serve HTTPS.

### Aviso de contactos por email (Resend)

Sem `RESEND_API_KEY`, o site funciona e os pedidos ficam só na caixa de entrada.
Cada pedido guarda o estado do aviso (`PENDING`, `SENT`, `FAILED`, `DISABLED`) e o
painel mostra-o no cartão — não é preciso abrir logs para saber se o email saiu.

Enquanto não houver **domínio verificado** no Resend:

- o remetente tem de ser `onboarding@resend.dev`;
- o Resend só entrega ao **email dono da conta Resend**, por isso
  `CONTACT_NOTIFY_TO` tem de ser esse mesmo endereço.

Depois de verificar o domínio: `CONTACT_NOTIFY_FROM` passa a
`Reborestampa <notificacoes@dominio.pt>` e `CONTACT_NOTIFY_TO` para o email da
empresa. `CONTACT_NOTIFY_TO` está marcado com `sync: false` no `render.yaml` para
que um Sync do Blueprint não sobrescreva o valor do dashboard.

---

## Problemas comuns

| Sintoma | Causa / solução |
| --- | --- |
| `migrate` falha com `spawn tsx ENOENT` | Imagem antiga (o stage de build era podado antes do seed). Rebuild: `docker compose build --no-cache backend migrate && docker compose up`. |
| `Seed abortado: define SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD` | Falta `SEED_ADMIN_PASSWORD` no `.env` (mínimo 12 caracteres, com maiúsculas, minúsculas e dígitos). Preencher e repetir `docker compose up`. |
| `backend` unhealthy com `unable to determine transport target for "pino-pretty"` | Imagem de produção a correr com `NODE_ENV=development`. O compose força `NODE_ENV=production` e o logger só usa pino-pretty se estiver instalado. |
| `Palavra-passe fraca: ...` | O script exige 12+ caracteres, com maiúscula, minúscula e algarismo (ex.: `Reborestampa2026`). Volta a perguntar até 3 vezes. |
| `As palavras-passe não coincidem` | O `setup-env.py` não escreveu nada. Corre outra vez com `--echo`. |
| `port is already allocated` na 5432 | Já tens um PostgreSQL local. Muda o mapeamento para `127.0.0.1:5433:5432`. |
| Login responde 401 com credenciais do `.env` | O seed não correu ou o email não corresponde a `SEED_ADMIN_EMAIL`. |
| `Resend 401: API key is invalid` | Chave revogada ou mal copiada. Criar outra no Resend e atualizar `RESEND_API_KEY`. |
| `Resend 403: can only send testing emails to your own email address` | `CONTACT_NOTIFY_TO` não coincide com o email da conta Resend (sem domínio verificado). |
| Todos os visitantes recebem 429 ao fim de poucos pedidos | `TRUST_PROXY` a `1` na Render: o IP real fica escondido atrás do proxy. Pôr `2`. |
| Nos logs, `ip` aparece como `10.x` ou `::ffff:…` | Mesma causa do anterior; o `::ffff:` é normalizado na auditoria. |
| Log de arranque mostra `cors: ["http://localhost:3000"]` em produção | Cosmético: a mesma origem é sempre permitida. Definir `CORS_ORIGIN` na Render (ou sincronizar o Blueprint) para o log refletir a realidade. |
| `openssl rand: Extra option` | `openssl` do macOS é LibreSSL e rejeita o argumento. Usa o `tr`/`urandom` do `setup-env.py`. |

---

## Variáveis de ambiente

Todas as variáveis são validadas no arranque (`backend/src/config/env.ts`): a API
recusa arrancar com configuração inválida e exige segredos JWT distintos com pelo
menos 32 caracteres. Variáveis declaradas mas vazias são tratadas como ausentes.

| Variável | Obrigatória | Notas |
| --- | --- | --- |
| `DATABASE_URL` | sim | URI `postgresql://…`; `sslmode=verify-full` recomendado |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Docker | usadas pelo serviço `db` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | sim | ≥ 32 caracteres, diferentes entre si |
| `ACCESS_TOKEN_TTL_SECONDS` | não | omissão 900 (15 min) |
| `REFRESH_TOKEN_TTL_SECONDS` | não | omissão 604800 (7 dias) |
| `CORS_ORIGINS` | não | lista separada por vírgulas; omissão `http://localhost:3000` |
| `COOKIE_SECURE` | não | `true` em produção (HTTPS); `false` em local |
| `COOKIE_DOMAIN` | não | vazio em localhost |
| `RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_MAX` | não | 120/min; login: 10 falhas/15 min por IP+email e 20 por IP |
| `TRUST_PROXY` | não | nº de proxies à frente da API. **2 na Render**, 1 em local, 0 exposto direto |
| `SERVE_STATIC` / `STATIC_DIR` | deploy | servidos pelo `deploy/Dockerfile` |
| `RESEND_API_KEY` | não | sem ela, os avisos ficam `DISABLED` |
| `CONTACT_NOTIFY_TO` | não | omissão `reborestampa@gmail.com`; igual ao email da conta Resend até haver domínio |
| `CONTACT_NOTIFY_FROM` | não | omissão `Reborestampa <onboarding@resend.dev>` |
| `PUBLIC_SITE_URL` | não | usado no link do email de aviso |
| `SEED_ADMIN_*` | não | usadas apenas por `npm run db:seed` |
| `NEXT_PUBLIC_API_URL` | não | URL da API vista pelo browser (inlinada no build) |

---

## API

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/api/health` | público | liveness |
| GET | `/api/health/ready` | público | verifica PostgreSQL |
| POST | `/api/auth/login` | público (rate limit) | devolve utilizador + access token; refresh em cookie |
| POST | `/api/auth/refresh` | cookie de refresh | rotaciona o refresh token |
| POST | `/api/auth/logout` | cookie de refresh | revoga e limpa o cookie |
| GET | `/api/auth/me` | autenticado | perfil atual |
| PATCH | `/api/auth/password` | autenticado | altera a própria palavra-passe (exige a atual) |
| POST | `/api/auth/forgot-password` | público (3/15 min por IP+email e 15 por IP) | pede o link de recuperação (resposta uniforme) |
| POST | `/api/auth/reset-password` | público | consome o link e define a nova palavra-passe |
| POST | `/api/auth/register` | ADMIN | cria conta (não há registo público) |
| GET | `/api/users` | ADMIN | lista paginada |
| POST | `/api/users` | ADMIN | cria conta |
| GET | `/api/users/:id` | ADMIN | detalhe |
| PATCH | `/api/users/:id` | ADMIN | altera papel / ativação |
| POST | `/api/users/:id/reset-password` | ADMIN | repõe a palavra-passe e termina as sessões da conta |
| POST | `/api/contact` | público (rate limit + honeypot) | formulário de contacto do site |
| GET | `/api/contact-requests` | ADMIN, EDITOR | caixa de entrada; aceita `status`, `q` (pesquisa) e paginação |
| GET | `/api/contact-requests/export.csv` | ADMIN, EDITOR | exporta o filtro atual (máx. 5000 linhas, com BOM) |
| PATCH | `/api/contact-requests/:id` | ADMIN, EDITOR | muda o estado (`NEW`, `READ`, `REPLIED`, `ARCHIVED`) |
| PATCH | `/api/contact-requests/:id/note` | ADMIN, EDITOR | guarda a nota interna (2000 caracteres, auditorizada) |
| GET | `/api/audit` | ADMIN | histórico de ações administrativas (paginado) |

Erros seguem sempre o mesmo formato:

```json
{ "error": { "code": "FORBIDDEN", "message": "…", "requestId": "…" } }
```

`POST /api/auth/refresh` devolve **204** quando não existe cookie de sessão (visita
anónima — não é erro) e **401** quando o cookie existe mas é inválido, expirou ou
foi revogado.

`POST /api/contact` responde **201** mesmo quando o honeypot descarta o pedido ou
quando o aviso por email falha: o formulário nunca revela o que aconteceu ao bot, e
o pedido guardado é a fonte de verdade.

---

## Segurança implementada

**Fronteira**
- CORS com allowlist explícita (sem wildcards) e `credentials: true`; a mesma
  origem é sempre aceite (site e API partilham host).
- Rate limiting global por IP, reforçado no login (duas barreiras: IP + email e
  só IP, `skipSuccessfulRequests`), na renovação de sessão e no formulário
  público de contacto (5 pedidos por 10 minutos).
- Validação de todo o input com Zod antes de chegar aos serviços; schemas de
  corpo `.strict()` rejeitam campos desconhecidos.
- Limite de payload `100kb`; `x-powered-by` desativado; `trust proxy` limitado.
- Todas as queries passam pelo Prisma (prepared statements); não existe SQL
  concatenado na aplicação.

**Autenticação**
- Passwords com **Argon2id** (19 MiB, 2 iterações, 1 thread).
- Login com tempo de resposta constante para emails inexistentes (hash fictício),
  evitando enumeração de contas.
- **Access token** JWT HS256, 15 min, `iss`/`aud` verificados, guardado apenas em
  memória no browser; **nunca** em `localStorage`.
- **Refresh token**: 7 dias, exclusivamente em cookie `HttpOnly`,
  `Secure` (produção), `SameSite=Strict`, `Path=/api/auth`; na base de dados
  guarda-se só o SHA-256.
- Rotação obrigatória a cada renovação, com deteção de reutilização: a reutilização
  de um token já rotacionado revoga toda a família e obriga a novo login.
- **Verificação na base de dados a cada pedido autenticado**: desativar uma conta,
  mudar-lhe o papel ou alterar a palavra-passe tem efeito imediato (não espera
  pelos 15 minutos do access token). Custa uma leitura por chave primária.
- Alteração da própria palavra-passe exige a atual e termina as **outras** sessões;
  a reposição por um administrador termina **todas** as sessões dessa conta.
- **Recuperação por email**: token opaco de 256 bits, guardado apenas como SHA-256,
  válido 30 minutos e de uso único (o consumo é atómico — dois cliques no mesmo
  link não redefinem duas vezes). Um pedido novo invalida os links anteriores e a
  redefinição termina todas as sessões. A resposta é idêntica para emails
  existentes e inexistentes, para não permitir enumerar contas.
  Fora de produção e **sem** `RESEND_API_KEY`, a resposta inclui `devToken` para
  se poder testar o fluxo localmente; em produção esse campo nunca é devolvido.
- Duas travas de administração: ninguém altera o próprio papel e o sistema recusa
  remover o último administrador ativo.
- RBAC por middleware, declarado rota a rota (`ADMIN`, `EDITOR`, `VIEWER`).

**Privacidade e auditoria**
- `/privacidade` descreve responsável, dados recolhidos, finalidade, prazo de
  conservação (24 meses), subcontratantes, direitos e o único cookie usado
  (`rb_refresh`, essencial).
- `AuditLog` registra alterações de contas, papéis, reposições de palavra-passe,
  estados de pedidos e notas internas. A escrita é *best-effort*: se falhar, a ação
  prossegue e o erro vai para o log — nunca se bloqueia uma operação legítima por
  causa do histórico. Sem FK para `users`, para sobreviver à eliminação de contas.
- O conteúdo das notas internas **não** é copiado para a auditoria; registra-se
  apenas que houve alteração, por quem e quando.
- Cada pedido guarda o estado do aviso por email e a mensagem do fornecedor em caso
  de falha.

**Operação**
- Variáveis de ambiente validadas no boot; zero credenciais no código.
- `helmet`, CSP restritiva na API, HSTS, `no-store` nas respostas de auth.
- Logs estruturados (Pino) com `authorization`, `cookie` e tokens redigidos;
  `requestId` em todas as respostas de erro.
- Erros internos nunca expõem stack traces ao cliente.

---

## Limites conhecidos / decisões a rever

### Dívida técnica com gatilho

| Tema | Estado | Quando corrigir | Como |
| --- | --- | --- | --- |
| **Rate limiting em memória** | Correto com uma instância (o caso atual). | Quando houver mais de uma instância. | Store partilhado (Upstash Redis ou equivalente) com o mesmo contrato do `express-rate-limit`. |
| **CSP sem nonce** | Só headers básicos no `next.config.ts`; o export estático impede nonce por pedido. | Antes de lidar com dados mais sensíveis do que contactos. | Passar a servir o Next com processo próprio (Render suporta) e gerar nonce no middleware. Deixa de ser um serviço único. |
| **Backups e monitorização** | Não automatizados. | Antes de a empresa depender do painel no dia a dia. | Monitor de uptime com alerta + procedimento de restauro do Neon testado. |

### Decisões conscientes (não são defeitos)

- **Sessões em várias abas**: a renovação é serializada por um cadeado em
  `localStorage` (`utils/crossTabLock.ts`), com validade de 5 s. Quem não o apanha
  em 2,5 s segue mesmo assim — prefere-se uma corrida rara a um bloqueio. Assim a
  rotação estrita do refresh token mantém-se, sem logout por duas abas expirarem
  ao mesmo tempo.
- **`AuthGuard` é conveniência de UI.** A autorização real é feita na API, rota a rota; o frontend nunca é fonte de verdade.
- **Sem verificação de email e sem MFA.** A recuperação de palavra-passe existe e
  é feita por link de email; a verificação de endereço no registo continua a não
  existir porque as contas são criadas por um administrador.
- **Aviso por email com `onboarding@resend.dev`.** Enquanto não houver domínio verificado, o Resend só entrega ao email dono da conta. Com domínio, trocar `CONTACT_NOTIFY_FROM` e `CONTACT_NOTIFY_TO`. A recuperação de palavra-passe usa o mesmo remetente — com o domínio verificado passa a chegar a qualquer conta.
- **Política de privacidade** é uma base técnica com os dados fornecidos pela empresa. O prazo de conservação (24 meses) deve ser confirmado por quem responde pelo tratamento.

### Notas editoriais

- **Portefólio**: a secção `Trabalhos` mostra um trabalho antigo e concluído. A empresa confirmou que não há reserva de confidencialidade nem autorização pendente.
- **Textos institucionais**: factos do perfil oficial da empresa e dados de contacto fornecidos por ela; as descrições de processo continuam a ser proposta editorial.

## Próximos passos sugeridos

1. **Domínio próprio** — credibilidade e entregabilidade (o Resend passa a enviar
   do domínio da empresa, incluindo os links de recuperação). Custo ~12 €/ano.
2. **Passagem de testemunho e operação** — executar `docs/operacao.md`: contas na
   empresa, segunda conta de administrador, monitor de uptime e um ensaio de
   restauro do Neon.
3. **CSP com nonce** — exige deixar o export estático e servir o Next com processo
   próprio (Render suporta, mas deixa de ser um serviço único).
4. **Portefólio** — mais casos, filtro por técnica e fotografias da peça completa.
5. **Domínio de negócio** — `Cliente`, `Encomenda`, `Referência`, `Prova`, `Tecnica`,
   uma entidade por sessão e só quando houver uso real que a justifique.
