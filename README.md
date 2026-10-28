# Reborestampa — plataforma web

Base (scaffolding) de uma aplicação web para a **Reborestampa — Estamparia Têxtil**
(Vila das Aves, Santo Tirso), construída segundo a especificação de arquitetura
entregue: monorepo, Next.js no frontend, API em camadas no backend, PostgreSQL e
Docker.

O que já funciona, verificado de ponta a ponta: login, sessão com refresh token
rotativo, RBAC, criação de contas por administrador, health checks e ligação real
ao PostgreSQL. O domínio de negócio (clientes, encomendas, fichas técnicas) ainda
não está implementado — é o próximo passo.

---

## Stack

| Camada      | Tecnologia                                                              |
| ----------- | ----------------------------------------------------------------------- |
| Frontend    | Next.js 16 (App Router), React 19, TypeScript estrito, Tailwind CSS 4    |
| Backend     | Node.js 22, Express 5, TypeScript estrito, Zod, Pino                     |
| Dados       | PostgreSQL 17, Prisma 7 (driver adapter `pg`, prepared statements)      |
| Infra       | Docker + Docker Compose (db, migrações, API, frontend)                  |

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
│   ├── public/                    # estáticos
│   ├── src/
│   │   ├── assets/                # globals.css (tema Tailwind)
│   │   ├── components/            # UI reutilizável (Button, Field, Logo, ...)
│   │   ├── features/              # auth, dashboard, marketing (por domínio)
│   │   ├── app/                   # rotas Next (route groups: site, auth, app)
│   │   ├── services/              # cliente HTTP + serviços de API
│   │   └── utils/                 # cn, formatação
│   └── Dockerfile
├── backend/
│   ├── src/ …                     # api, services, repositories, models, middlewares
│   ├── prisma/                    # schema, migrações, seed
│   ├── tests/smoke.sh
│   └── Dockerfile
├── deploy/
│   ├── Dockerfile                 # imagem única (site + API) para PaaS
│   └── start.sh                   # migrações + seed + arranque
├── scripts/
│   └── setup-env.py               # gera segredos e password do admin
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
| backend  | `npm run build`        | `prisma generate` + `tsc` para `dist/`        |
| backend  | `npm start`            | API compilada                                 |
| backend  | `npm run db:migrate`   | nova migração em desenvolvimento              |
| backend  | `npm run db:deploy`    | aplica migrações (produção/CI)                |
| backend  | `npm run db:seed`      | cria o administrador inicial (idempotente)    |
| backend  | `npm run db:studio`    | Prisma Studio                                 |
| backend  | `bash tests/smoke.sh`  | smoke test end-to-end (precisa da API a correr) |
| backend  | `bash tests/smoke-admin.sh` | contactos, papéis e palavras-passe (precisa de `ADMIN_PASSWORD`) |
| frontend | `npm run dev` / `build`| desenvolvimento / build de produção           |

Os testes de administração alteram dados: use uma base de desenvolvimento. O
`smoke-admin.sh` promove contas a EDITOR, repõe palavras-passe e muda a do
administrador no fim — em bases partilhadas, recrie o ambiente a seguir.

---

## Deploy gratuito na Render (+ Neon)

Neste modo, **um único serviço** serve o site e a API na mesma origem: o Next é
compilado como HTML estático (`output: "export"`) e o Express serve o `out/` em
`/` e a API em `/api`. Sem CORS e com o cookie de refresh first-party.

1. **Base de dados (Neon, grátis e sem prazo)**
   Criar um projeto em <https://neon.com>, região Frankfurt, e copiar a
   connection string **direta** (sem `-pooler`), com `?sslmode=require`.

2. **Repositório**
   ```bash
   git init
   git add .
   git commit -m "Reborestampa: base da plataforma"
   git remote add origin git@github.com:<utilizador>/reborestampa.git
   git push -u origin main
   ```
   O `.env` fica de fora (está no `.gitignore`).

3. **Render**
   New → **Blueprint** → escolher o repositório. O `render.yaml` cria o serviço
   Docker com o health check já configurado. Preencher no dashboard:
   - `DATABASE_URL` (a do Neon)
   - `SEED_ADMIN_PASSWORD` (12+ caracteres, maiúscula, minúscula e algarismo)

   Alternativa sem blueprint: New → Web Service → Docker →
   `deploy/Dockerfile`, contexto na raiz, e as variáveis do `render.yaml`.

4. **Arranque**
   O `deploy/start.sh` aplica `prisma migrate deploy`, corre o seed idempotente
   e só depois inicia a API. O site fica em `https://<nome>.onrender.com`.

Limitações do plano gratuito, para decidir com informação:

- O serviço **dorme após 15 minutos** sem tráfego; o primeiro visitante espera
  cerca de um minuto.
- A Render diz na documentação que instâncias free **não são para produção** —
  servem para demonstração e validação.
- O Postgres gratuito da Render expira em 30 dias; por isso a base de dados fica
  no Neon, que não tem prazo.
- `COOKIE_SECURE=true` (já definido no `render.yaml`) porque a Render serve HTTPS.

---

## Problemas comuns

| Sintoma | Causa / solução |
| --- | --- |
| `migrate` falha com `spawn tsx ENOENT` | Imagem antiga (o stage de build era podado antes do seed). Rebuild: `docker compose build --no-cache backend migrate && docker compose up`. |
| `Seed abortado: define SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD` | Falta `SEED_ADMIN_PASSWORD` no `.env` (mínimo 12 caracteres, com maiúsculas, minúsculas e dígitos). Preencher e repetir `docker compose up`. |
| `backend` unhealthy com `unable to determine transport target for "pino-pretty"` | Imagem de produção a correr com `NODE_ENV=development`. Corrigido: o compose força `NODE_ENV=production` no backend e o logger só usa pino-pretty se estiver instalado. Rebuild com `docker compose up --build`. |
| `Palavra-passe fraca: ...` | O script exige 12+ caracteres, com maiúscula, minúscula e algarismo (ex.: `Reborestampa2026`). Volta a perguntar até 3 vezes; se desistir, corre outra vez. |
| `As palavras-passe não coincidem` | O `setup-env.py` não escreveu nada. Corre outra vez com `--echo` para veres o que escreves. |
| `port is already allocated` na 5432 | Já tens um PostgreSQL local. Muda o mapeamento em `docker-compose.yml` para `127.0.0.1:5433:5432` e ajusta `DATABASE_URL` se correres o backend fora do Docker. |
| Login responde 401 com credenciais do `.env` | O seed não correu (ver linha acima) ou o email não corresponde a `SEED_ADMIN_EMAIL`. |
| `openssl rand: Extra option` | `openssl` do macOS é LibreSSL e rejeita o argumento. Usa o comando com `tr`/`urandom` do arranque rápido. |

---

## Variáveis de ambiente

Todas as variáveis são validadas no arranque (`backend/src/config/env.ts`): a API
recusa arrancar com configuração inválida e exige segredos JWT distintos com pelo
menos 32 caracteres.

| Variável | Obrigatória | Notas |
| --- | --- | --- |
| `DATABASE_URL` | sim | URI `postgresql://…` |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Docker | usadas pelo serviço `db` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | sim | ≥ 32 caracteres, diferentes entre si |
| `ACCESS_TOKEN_TTL_SECONDS` | não | omissão 900 (15 min) |
| `REFRESH_TOKEN_TTL_SECONDS` | não | omissão 604800 (7 dias) |
| `CORS_ORIGINS` | não | lista separada por vírgulas; omissão `http://localhost:3000` |
| `COOKIE_SECURE` | não | `true` em produção (HTTPS); `false` em local |
| `COOKIE_DOMAIN` | não | vazio em localhost |
| `RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_MAX` | não | 120/min e 10 falhas/15 min por IP+email |
| `TRUST_PROXY` | não | nº de proxies à frente da API (omissão 1) |
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

---

## Segurança implementada

**Fronteira**
- CORS com allowlist explícita (sem wildcards) e `credentials: true`.
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
- Duas travas de administração: ninguém altera o próprio papel e o sistema recusa
  remover o último administrador ativo.
- RBAC por middleware, declarado rota a rota (`ADMIN`, `EDITOR`, `VIEWER`).

**Privacidade e auditoria**
- `/[privacidade]` descreve responsável, dados recolhidos, finalidade, prazo de
  conservação (24 meses), subcontratantes, direitos e o único cookie usado
  (`rb_refresh`, essencial).
- `AuditLog` registra alterações de contas, papéis, reposições de palavra-passe e
  estados de pedidos. A escrita é *best-effort*: se falhar, a ação prossegue e o
  erro vai para o log — nunca se bloqueia uma operação legítima por causa do
  histórico. Sem FK para `users`, para sobreviver à eliminação de contas.
- Aviso de novo pedido por email (Resend) é opcional: sem `RESEND_API_KEY` o site
  funciona igual e os pedidos ficam na caixa de entrada.
- Cada pedido guarda o **estado do aviso** (`PENDING`, `SENT`, `FAILED`,
  `DISABLED`) e, em caso de falha, a mensagem do fornecedor. O painel mostra-o no
  cartão, para não ser preciso procurar nos logs para saber se o email saiu.

**Operação**
- Variáveis de ambiente validadas no boot; zero credenciais no código.
- `helmet`, CSP restritiva na API, HSTS, `no-store` nas respostas de auth.
- Logs estruturados (Pino) com `authorization`, `cookie` e tokens redigidos;
  `requestId` em todas as respostas de erro.
- Erros internos nunca expõem stack traces ao cliente.

---

## Limites conhecidos / decisões a rever

- **Multi-separador**: a rotação estrita revoga a família em caso de reutilização.
  Duas tabs a renovar exatamente ao mesmo tempo podem provocar logout. Aceitável
  para o âmbito atual; se incomodar, introduzir uma janela de tolerância de poucos
  segundos em `auth.service.refresh`.
- **Guard de UI** (`AuthGuard`) é conveniência de navegação. A autorização real é
  sempre feita na API; o frontend nunca é fonte de verdade.
- **CSP do Next.js**: para já só há headers básicos (`next.config.ts`). Uma CSP
  completa exige nonce por pedido — próximo passo antes de produção.
- **Sem verificação de email, recuperação por email ou MFA** — a palavra-passe
  muda-se com a atual; se for esquecida, um administrador repõe. Recuperação
  autónoma exigiria um serviço de email.
- **Aviso por email**: enquanto não houver domínio verificado no Resend, o
  remetente `onboarding@resend.dev` só entrega ao email dono da conta Resend.
  Com domínio verificado, trocar `CONTACT_NOTIFY_FROM` para o endereço da empresa.
- **Política de privacidade**: o texto é uma base técnica; deve ser revisto pela
  empresa (prazo de conservação e dados do responsável) antes de divulgar o site.
- **Textos do site**: os factos vêm do perfil oficial da empresa (fundação em 1992,
  sede, 12 cores, técnicas). As descrições de processo são proposta editorial a
  validar; não foram inventados contactos (telefone/email) porque não há fonte
  verificada.
- **Docker**: os ficheiros foram escritos e o compose validado estruturalmente,
  mas o ambiente onde este projeto foi gerado não tinha daemon Docker — o primeiro
  `docker compose up --build` deve ser feito na tua máquina.

---

## Próximos passos sugeridos

1. Modelar o domínio: `Cliente`, `Encomenda`, `Referência`, `Prova`, `Tecnica`.
2. Fichas técnicas por técnica de estampagem (consumos, cores, tempos).
3. Auditoria de ações administrativas e histórico de alterações.
4. CI: `tsc`, build do frontend, `tests/smoke.sh` e `tests/smoke-admin.sh` contra
   um Postgres de serviço.
5. CSP com nonce, backups da base de dados e observabilidade (métricas + alertas).
6. Política de privacidade e tratamento de dados (RGPD) antes de recolher
   contactos em produção — o formulário já guarda nome, email, empresa, telefone
   e mensagem.
