# Publicação do Web em homologação

O workflow **CD - Homologação Web** publica o site existente
<https://anatoquizup-homolog-2026-2.netlify.app> depois que a **CI - Frontend**
aprova um push na `main`. PRs e a branch `develop` não publicam nesse site.

O BFF, os serviços e os bancos no Railway não são alterados por este workflow.
O Web continua usando `https://minio-homolog.up.railway.app/api/v1`, com mocks
desativados. O comando local de desenvolvimento continua sendo `npm run dev`.

## Preparar o acesso uma única vez

Uma pessoa com acesso ao site no Netlify deve:

1. Confirmar que o site é `anatoquizup-homolog-2026-2` e anotar a versão
   publicada atualmente para eventual retorno.
2. Localizar o identificador do projeto/site nas configurações do Netlify.
3. Gerar uma autorização de publicação no Netlify para uma conta da equipe
   com acesso ao site. Não enviar o token pelo chat, issue ou PR.
4. No repositório **2026-2-AnatoQuizUp-Web**, em **Settings → Secrets and
   variables → Actions → Repository secrets**, cadastrar:

   | Secret | Conteúdo |
   |---|---|
   | `NETLIFY_SITE_ID` | Identificador do site de homologação |
   | `NETLIFY_AUTH_TOKEN` | Token da conta autorizada no Netlify |

Se faltarem esses secrets ou o identificador apontar para outro site, o CD
interrompe antes da publicação. Ele não cria outro site.

Confirmar também de onde vêm as publicações atuais no painel do Netlify.
Se houver build automático da integração Git, coordenar a desativação desse
caminho antes de ativar o CD do GitHub, para que ele não publique antes da CI
ou sobrescreva o deploy validado. Não desvincular repositórios nem apagar o
site ou suas variáveis para realizar essa transição.

## O que acontece após o merge

1. A CI existente executa lint, build, testes, cobertura e Sonar.
2. Se passar, o CD verifica se é o commit atual da `main` e obtém esse código.
3. O CD confirma o acesso ao site, instala com `npm ci` e gera `dist/` com
   a URL pública do BFF já usada na homologação.
4. A CLI oficial do Netlify, com versão fixada, publica `dist/` no site existente.
   `--prod` significa atualizar o endereço principal **desse site de homologação**.
5. O CD consulta `/version.json` e verifica se as rotas de perfil respondem
   com a aplicação. A regra `public/_redirects` corrige o 404 de acesso direto
   e F5; ela não remove as proteções de login implementadas pelo React.

As execuções de CD são serializadas. Commits superados por uma atualização
da `main` não devem sobrescrever a versão mais recente.

## Validar a primeira publicação

- Conferir CI e CD aprovados em Actions.
- Abrir `/version.json` e comparar `commit` com a `main` publicada.
- Em janela anônima, verificar login, logout, perfil e avatar.
- Recarregar o perfil e abrir sua URL diretamente: o Netlify deve entregar
  a aplicação, que decide o acesso conforme a sessão.
- Conferir saldo, inventário e histórico sem efetuar compras adicionais.
- Retomar os testes de avatar, incluindo gravação e leitura entre sessões.

As verificações automáticas de HTML e versão não substituem esses testes
funcionais com as contas de homologação.

## Repetir ou interromper uma publicação

Para repetir a publicação do commit atual, usar **Actions → CD - Homologação
Web → Run workflow**, selecionando `main`. O workflow só publica se existir
uma CI de push aprovada para esse mesmo commit.

Se houver regressão, interromper novas publicações automáticas no GitHub
antes de restaurar o deploy anterior no painel do Netlify. Registrar o
commit afetado e o resultado da validação. Corrigir por PR e retestar antes
de reativar. Este workflow não implementa rollback automático.

## Referências

- [Issue #74](https://github.com/fga-eps-mds/2026-2-AnatoQuizUp-Doc/issues/74).
- [Ambiente de homologação](https://fga-eps-mds.github.io/2026-2-AnatoQuizUp-Doc/operacao/ambiente-homologacao/).
- [CLI oficial do Netlify](https://cli.netlify.com/commands/deploy/).
- [Rotas de aplicações SPA no Netlify](https://docs.netlify.com/resources/troubleshooting/page-not-found-error-guide/).
