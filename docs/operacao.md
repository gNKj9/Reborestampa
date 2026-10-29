# Operação e passagem de testemunho

Guia para quem mantém o site em produção. Assume acesso aos painéis da Render,
Neon e Resend; não assume conhecimento do código.

---

## 1. Propriedade das contas

O maior risco deste projeto não é técnico: é tudo estar em contas pessoais. Se a
pessoa que tem os acessos desaparecer, o site fica órfão.

| Ativo | Onde | Deve pertencer a | Como se verifica |
| --- | --- | --- | --- |
| Código | GitHub `gNKj9/Reborestampa` | conta ou organização da empresa, com 2 administradores | Settings → Collaborators |
| Aplicação | Render, serviço `reborestampa` | conta da empresa | Account Settings → Team |
| Base de dados | Neon, projeto com a base `neondb` | conta da empresa | Project Settings → Members |
| Email | Resend | email institucional da empresa | Dashboard → Account |
| Domínio | registador (quando existir) | empresa, com dois contactos técnicos | WHOIS / painel do registador |
| Segredos | cofre de palavras-passe | sócios + responsável técnico | — |

**Transferência não é partilha de palavra-passe.** Convida-se o email da empresa
como administrador, confirma-se o acesso, e só depois se remove a conta pessoal.
Partilhar credenciais deixa rasto nenhum de quem fez o quê.

---

## 2. Administração da aplicação

**Nunca deixar um único administrador ativo.** O sistema recusa remover o último,
mas isso protege o sistema, não a empresa.

1. `/painel/utilizadores` → **Nova conta** → papel **Administrador**.
2. Confirmar que a segunda conta entra e vê o painel.
3. Rodar a palavra-passe da conta antiga em `/painel/conta` (termina as outras
   sessões dessa conta).
4. Desativar contas de teste.

Verificação rápida do estado:

```bash
cd backend
DATABASE_URL='postgresql://...' npm run db:stats
```

O comando imprime utilizadores (total, ativos, admins), pedidos por estado,
registos de auditoria, links de recuperação válidos e o último pedido. Avisa se
só existir **um** administrador ativo.

---

## 3. Deploy, CI e rollback

- O CI corre a cada push (`Actions → CI`): tipos, migrações, smoke tests e os dois
  builds. **Um push com CI vermelho não deve ser publicado.**
- A Render está com `autoDeploy: true`. Se quiseres garantir que nada vermelho
  entra em produção, desliga o auto-deploy em **Settings → Build & Deploy** e
  publica à mão depois do CI verde.
- Publicar: **Manual Deploy → Deploy latest commit**.
- Verificação obrigatória depois de cada deploy:

```bash
BASE_URL=https://reborestampa.onrender.com bash scripts/preflight.sh
```

São 20 verificações de páginas, API, cabeçalhos e recuperação de palavra-passe.

**Rollback**: Render → **Deploys** → escolher o commit anterior → **Rollback to
this deploy**. Atenção: as migrações da base **não** revertem — o esquema é
forward-only. Se o problema for de dados, o caminho é o restauro do Neon (secção 5).

---

## 4. Segredos e rotação

| Segredo | Onde | Efeito de rodar |
| --- | --- | --- |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Render → Environment | todas as sessões caem; todos voltam a entrar |
| `SEED_ADMIN_PASSWORD` | Render → Environment | só usado na criação do admin; depois ignora-se |
| palavra-passe do admin | `/painel/conta` | termina as outras sessões dessa conta |
| `RESEND_API_KEY` | Resend → API Keys + Render | avisos e recuperação deixam de sair até atualizar |
| `DATABASE_URL` | Neon + Render | site em baixo até atualizar; fazer em janela |

Regras: nunca colar segredos em chat, issues ou commits; rodar sempre com o site
acessível para confirmar que voltou; depois de rodar, correr o `preflight.sh`.

---

## 5. Backups e restauro (Neon)

O Neon guarda histórico por *branch*. A janela de restauro depende do plano —
confirmar em **Project → Settings → Backups** e escrever aqui a janela real:

> Janela de restauro confirmada em: `____ / ____ / ______` (por preencher)

### Ensaio de restauro (trimestral, numa branch descartável)

1. Neon → **Branches** → **Create branch** a partir de um ponto no tempo
   (escolher, por exemplo, 24 h atrás).
2. Copiar a connection string da branch nova.
3. Validar com a API local:

```bash
cd backend
DATABASE_URL='postgresql://...branch...' npm run db:deploy   # deve dizer "No pending migrations"
DATABASE_URL='postgresql://...branch...' npm run db:stats
```

4. Comparar os números com o que se esperava (utilizadores, pedidos, auditoria).
5. Apagar a branch de ensaio.

### Restauro real

1. Congelar escritas: suspender o serviço na Render (evita divergência).
2. Criar a branch no ponto anterior ao incidente.
3. Validar com os passos 3 e 4 acima.
4. Apontar `DATABASE_URL` da Render para a branch restaurada e publicar.
5. Correr `preflight.sh`, confirmar login e caixa de entrada.
6. Registar: hora, causa, ponto de restauro, dados perdidos (se algum).

---

## 6. Monitorização

- **UptimeRobot** (gratuito): monitor HTTP(s) para
  `https://reborestampa.onrender.com/api/health`, intervalo 5 minutos, alerta por
  email para duas pessoas. O plano gratuito da Render **dorme** após 15 minutos
  sem tráfego: configurar o alerta para disparar só após **2 falhas consecutivas**,
  senão o primeiro pedido de cada manhã gera um alarme falso.
- **Render**: alertas de falha de deploy por email (Settings → Notifications).
- **Semanal**: `scripts/preflight.sh` e uma vista de olhos ao `/painel/atividade`.

---

## 7. Diagnóstico rápido

| Sintoma | Causa provável | Ação |
| --- | --- | --- |
| Primeiro acesso do dia demora ~1 min | instância free a acordar | esperar; se for crítico, plano pago |
| Site 502/503 | deploy em curso ou crash | Render → Logs; ver última linha |
| Todos recebem 429 | `TRUST_PROXY` errado | deve ser `2` na Render |
| Emails não saem, cartão diz `desativado` | falta `RESEND_API_KEY` | Environment → adicionar |
| Emails falham `403` | destinatário ≠ email da conta Resend | `CONTACT_NOTIFY_TO` igual ao email da conta, até haver domínio |
| Emails falham `401` | chave revogada | criar nova no Resend e atualizar |
| Login 401 com password certa | conta desativada ou password rodada | `/painel/utilizadores`; repor |
| Pedido de recuperação não chega | spam, ou destinatário errado | verificar Resend → Emails |
| Recuperação responde 429 | limite por IP (15/15 min) ou por email (3/15 min) | esperar; é intencional |

Cada erro da API devolve um `requestId`; procurá-lo nos logs da Render encontra o
pedido exato.

---

## 8. Checklist de passagem de testemunho

- [ ] Repositório com dois administradores, um deles da empresa
- [ ] Render, Neon e Resend em contas da empresa (não pessoais)
- [ ] Duas contas de administrador na aplicação, ambas testadas
- [ ] Palavra-passe da conta antiga rodada
- [ ] Contas de teste desativadas
- [ ] `npm run db:stats` sem aviso de administrador único
- [ ] Monitor de uptime ativo, com dois destinatários de alerta
- [ ] Janela de restauro do Neon confirmada e escrita neste documento
- [ ] Um ensaio de restauro feito e registado
- [ ] `preflight.sh` verde
- [ ] Este documento revisto por quem fica responsável
