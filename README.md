# AnatoQuizUp Web

Frontend do projeto **AnatoQuizUp** — SPA em React + Vite + Tailwind. Consome **somente o BFF** (não acessa o Usuario-Service nem o Quiz-Service diretamente).

## Ambiente de homologação

Para testar a versão integrada disponibilizada ao time, acesse [AnatoQuizUp — Homologação](https://anatoquizup-homolog-2026-2.netlify.app).

Esse ambiente contém dados de demonstração, não é produção e pode ser reinicializado durante validações da equipe.

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Axios
- Zustand (estado global; AuthProvider em Context API + localStorage atualmente)
- Jest + Testing Library + jest-dom

## Pré-requisitos

| Ferramenta | Versão | Como instalar |
|---|---|---|
| Node.js | ≥ 20 (CI roda em 20; LTS) | https://nodejs.org/ |
| npm | vem com o Node | — |
| Git | qualquer recente | https://git-scm.com/ |
| GNU Make | opcional | Windows: `choco install make` |
| BFF rodando em `localhost:4000` | — | siga o README de `2026-1-AnatoQuizUp-BFF` antes |

> O Frontend **não fala** com Usuario-Service ou Quiz-Service diretamente. Você precisa do **BFF** rodando para fluxos autenticados funcionarem.

## Setup local — passo a passo

### 1. Clonar e entrar no repo

```powershell
git clone https://github.com/fga-eps-mds/2026-2-AnatoQuizUp-Web.git
cd 2026-2-AnatoQuizUp-Web
```

### 2. Criar e preencher o `.env`

```powershell
Copy-Item .env.example .env
```

O `.env` deve apontar para o **BFF** (porta 4000), não para os serviços de domínio:

```dotenv
VITE_API_URL=http://localhost:4000/api/v1
VITE_USE_MOCKS=false
```

> `VITE_USE_MOCKS=true` ativa mocks locais para `aluno@unb.br` e `desativado@unb.br` (sem rede). Em dev real, mantenha `false`.

### 3. Instalar e rodar

```bash
npm ci
npm run dev   # vite em http://localhost:5173
```

## Stack completa de desenvolvimento

Para rodar a aplicação fim-a-fim, você precisa de **quatro processos** em quatro terminais:

| Terminal | Repo | Porta | Comando |
|---|---|---|---|
| 1 | `2026-2-AnatoQuizUp-Usuario-Service` | 3333 | `npm run dev` (com Postgres `:5432` no Docker) |
| 2 | `2026-2-AnatoQuizUp-Quiz-Service` | 3334 | `npm run dev` (com Postgres `:5433` + MinIO no Docker) |
| 3 | `2026-2-AnatoQuizUp-BFF` | 4000 | `npm run dev` |
| 4 | `2026-2-AnatoQuizUp-Web` (este) | 5173 | `npm run dev` |

> Para passo-a-passo completo (envs, docker, smoke tests, troubleshooting), veja `2026-1-AnatoQuizUp-Doc/docs/contribuicao/setup-local.md`.

Atalho prático no Web:

```bash
make dev-stack    # imprime instruções pra subir os 3 (não orquestra; abre 3 terminais)
```

## Atalhos com Make

```bash
make help       # lista comandos
make setup      # cp .env.example .env (se não existir) + npm ci
make dev        # vite (porta 5173)
make test       # jest
make test-ci    # jest --coverage --runInBand
make lint       # eslint
make build      # tsc + vite build
make preview    # vite preview (porta 4173)
make clean      # apaga dist/ e coverage/
```

## Estrutura — Feature-Sliced Design

```text
src/
├── app/                     # configuração global, providers, rotas, layouts, estilos
├── pages/                   # telas acessadas por rota
│   ├── aluno/{minhas-turmas, turma}/    # visão do aluno
│   ├── forgot-password/, reset-password/
│   ├── home/, homeAluno/, homeProfessor/
│   ├── login/, register/, professor-register/
│   ├── professor/criar-questao/
│   ├── questao/                          # banco de questões
│   └── turma/                            # gestão de turmas (professor/admin)
├── widgets/                 # blocos compostos de interface (header, sidebar, ...)
├── features/                # funcionalidades orientadas ao usuário
│   ├── auth-by-credencials/
│   ├── manage-questions/
│   ├── manage-turmas/
│   ├── minhas-turmas/
│   ├── recover-password/
│   ├── register-professor/
│   └── register-student/
├── entities/                # modelos centrais do domínio
│   ├── turmas/
│   ├── user/                # ainda em inglês (débito conhecido)
│   └── usuarios/
├── shared/                  # genérico/técnico
│   ├── api/                 # httpClient (axios, com refresh-token rotation), services
│   ├── assets/
│   ├── config/env.ts        # API_BASE_URL e USE_MOCKS
│   ├── constants/
│   ├── ui/                  # botões, inputs reutilizáveis
│   └── utils/
├── __mocks__/               # stubs Jest para assets
├── main.tsx
└── setupTests.ts
```

> Regra FSD: camada superior pode importar inferior; nunca o inverso.

## Variáveis de ambiente

| Variável | Padrão dev | Produção | Descrição |
|---|---|---|---|
| `VITE_API_URL` | `http://localhost:4000/api/v1` | URL pública do BFF | Base do `httpClient` |
| `VITE_USE_MOCKS` | `false` | `false` | Liga mocks locais (`authService`) |

## Troubleshooting

| Sintoma | Causa | Solução |
|---|---|---|
| Network error ao tentar login | BFF não está rodando | Suba o BFF em `localhost:4000` |
| Login devolve 401 mesmo com credenciais certas | `JWT_SECRET_KEY` divergente entre BFF e Usuario-Service | Confira que estão idênticos nos dois `.env` |
| `VITE_API_URL` mudou mas o front continua chamando URL antiga | Vite cacheia a build | Stop `npm run dev`, apague `node_modules/.vite/` e suba de novo |
| Erro 503 com `IA_INDISPONIVEL` em `/ia/...` | Esperado | AI Service ainda não foi implementado nesta release; mantenha placeholders |
| CORS bloqueando localhost | `CORS_ORIGINS` do BFF não inclui `http://localhost:5173` | Editar `.env` do BFF |

## Como contribuir

- Branches: Git Flow (`feature/<id>-descricao` a partir de `develop`).
- Commits: Conventional Commits.
- Cobertura mínima: **85%**.
- Componentes em `ui/`, lógica em `model/`. Testes ao lado do arquivo.
- Tailwind para estilo. Tipos em PT-BR (decisão DP12).
