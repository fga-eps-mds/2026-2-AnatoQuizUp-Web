# Validação de Sonar, métricas e segurança do Web

Este PR trata de Sonar, coleta de métricas e segurança. CD, testes de sistema/aceitação,
regras de proteção e revisão dos links do site de documentação exigem validação própria.
Não declarar atendimento integral às exigências do professor apenas com CI verde.

## Fluxo

1. CI usa Node 24, como os Dockerfiles, executa lint, build, testes do coletor e Jest.
2. Jest gera `coverage/lcov.info`, `coverage/coverage-summary.json` e `sonar-report.xml`.
3. A CI principal envia sua análise ao Sonar e aguarda o Quality Gate. Os workflows
   com nome iniciado por `tcc-` são de responsabilidade de outra pessoa e estão
   fora deste PR. Eventuais análises adicionais desses workflows permanecem
   conforme a configuração do responsável.
4. Após merge em `main` ou `develop`, a coleta espera a CI de push do SHA integrado.
5. O parser seleciona explicitamente a branch, espera o mesmo SHA no Sonar e exige
   Quality Gate aprovado. Se outra análise substituir a esperada durante a coleta,
   a execução falha, sem atribuir medidas de outro commit à versão solicitada.
6. O JSON inclui as 12 medidas do projeto, componentes paginados, branch, commit,
   identificador da análise e timestamp UTC. Ausência de uma medida é erro; zero é válido.
7. Só depois da coleta válida, labels de release em `main` criam a versão no SHA
   analisado. Reexecução reutiliza a release desse SHA. Coleta manual não cria release.
8. O histórico é enviado para `2026-2-AnatoQuizUp-Doc/analytics-raw-data/web`.
9. Publicar a release dispara o ZIP de todos os arquivos versionados daquela tag,
   incluindo `src/`, `test/` e configurações. Não inclui arquivos locais ignorados.

## Configuração administrativa necessária

- `SONAR_TOKEN`: disponível para a CI e para o environment `actions` da coleta.
- `DOC_PUSH_TOKEN`: token pessoal ou de GitHub App autorizado a escrever no Web
  (Contents: write, para criar release) e no repositório Doc (para enviar os JSONs).
  A criação da release deve gerar o evento `release: published`; não substituir esse
  token pelo `GITHUB_TOKEN` padrão, cujo comportamento de disparar workflows é restrito.
- Confirmar projeto `fga-eps-mds_2026-2-AnatoQuizUp-Web`, organização `fga-eps-mds-1`
  e correspondência entre branches no Sonar e no GitHub. `develop` precisa ser uma
  branch suportada para as medidas de execução de testes.
- Exigir `Lint, Build, Test e SonarCloud` e `Security Gate` na proteção de `main`.
  A configuração de arquivos YAML sozinha não impede merges com checks vermelhos.
- Definir e aplicar com a equipe as regras equivalentes em `develop`.

## Evidências de aceitação

### No PR

- CI principal, SCA e Security Gate verdes no último commit.
- Artefato `testes-<sha>` com os três relatórios e `report-task.txt` do scanner.
- No log do scanner: importação do LCOV e comportamento do Generic Test Execution.
  Em análise de PR, não exigir a exibição das medidas de execução: a comprovação
  de quantidade, falhas, erros e duração deve ocorrer na análise da branch.
- Conferir a classificação dos testes: arquivos `.test.*` e `.spec.*` são testes;
  mocks e setup não são código de produção. Não confundir exclusão de cobertura
  com exclusão da contagem de código-fonte.

### Depois do merge

- CI de push do SHA integrado aprovada.
- Coleta aprovada e JSON no repositório Doc, com nome
  `fga-eps-mds-2026_2_UNB-AnatoQuizUp-WEB-MM-DD-YYYY-HH-MM-SS-vX.Y.Z.json`.
- `commit` igual ao SHA integrado; `analysis.revision` igual a `commit`.
- `project_measures` contém valores para `files`, `functions`, `complexity`,
  `comment_lines_density`, `duplicated_lines_density`, `coverage`, `ncloc`, `tests`,
  `test_errors`, `test_failures`, `test_execution_time` e `security_rating`.
- Comparar `tests` com o total efetivamente executado naquela CI e verificar tempo,
  erros e falhas. Cobertura Sonar pode diferir do percentual de linhas do Jest.
- Preservar as coletas por release; não substituir histórico por um único `latest.json`.

### Release major/minor

- Escolher uma única label: `MAJOR RELEASE`, `MINOR RELEASE` ou `FIX RELEASE`.
- Usar labels de release de produto apenas em PRs destinados à `main`.
- Sem label, coletar métricas mantendo a versão atual; `NOT RELEASE` não suprime
  a coleta. Não fechar PRs de teste apenas para criar releases fictícias.
- Na entrega real, confirmar incremento da versão, tag no commit correto e ZIP
  nos assets. Baixar o ZIP e conferir código, testes e configurações.
- Executar coleta manual em `main` para verificar o caminho sem criar release.
- Se uma análise mais nova ultrapassar o SHA esperado, investigar a execução que
  falhou. Não rotular a análise nova como se pertencesse à release antiga.

## Segurança e verificações locais

Atualizações pontuais: Axios 1.20.0 e source-map-js 1.2.2. Não reduzir o nível do
Security Gate nem usar `npm audit fix --force`. Avisos moderados da cadeia do Jest
continuam exigindo acompanhamento; ausência de High/Critical não significa zero riscos.

```bash
node -v  # 24.x, conforme .nvmrc
npm ci --include=optional
npm run lint
npm run build
npm run test:ci
npm audit --audit-level=high
python -m pip install requests python-dotenv packaging
python -m unittest discover -s sonar_scripts -p 'test_*.py' -v
```

Os testes do parser usam respostas simuladas e não acessam tokens nem publicam
releases. Eles não substituem a execução real das pipelines e a inspeção dos JSONs.

Referências:
- https://docs.sonarsource.com/sonarqube-cloud/enriching/test-coverage/test-execution-parameters
- https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow
