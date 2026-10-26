import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, EyeOff, Medal, Trophy, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../../app/providers/AuthProvider';
import { converterItensEquipadosParaSlots } from '../../../../features/profile-cosmetics';
import {
  buscarProgressoXp,
  calcularFaixaEloPorXp,
  EloIcon,
  MinhaProgressaoElo,
  obterFaixaEloPorNomeOuCodigo,
  resolverDadosEloProgresso,
  TodosOsElosGrid,
  type ProgressoNivel,
} from '../../../../features/progressao';
import {
  obterRankingAmigos,
  obterRankingGeral,
  RankingBoard,
  type EntradaRanking,
  type LinhaRanking,
  type RankingAlunoResposta,
} from '../../../../features/ranking';

// Abas do ranking do aluno: geral (todos) e entre amigos.
type AbaRanking = 'geral' | 'amigos';

// Sub-visoes da pagina de ranking/elos conforme o fluxo do Figma (Telas 1, 2 e 3).
type VisaoRanking = 'ranking' | 'progressao' | 'elos';

// Configuracao das abas exibidas no topo.
const TABS: Array<{ key: AbaRanking; label: string }> = [
  { key: 'geral', label: 'Ranking geral' },
  { key: 'amigos', label: 'Entre amigos' },
];

/** Monta a linha de detalhe (curso · Nº semestre) de uma entrada, ou null se vazia. */
const montarDetalhe = (curso: string | null, semestre: string | null): string | null => {
  return (
    [curso, semestre ? `${semestre}º semestre` : null].filter(Boolean).join(' · ') || null
  );
};

/**
 * Pagina de ranking do aluno com abas geral/amigos e progressao de elos.
 * Mostra a posicao do usuario, acertos, elo atual, barra de evolucao e permite
 * alternar entre Ranking, Minha progressao e Todos os elos (Telas 1, 2 e 3 do Figma).
 */
export const RankingAlunoPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Aba ativa, visao ativa, resposta do ranking e estados de carga/erro.
  const [aba, setAba] = useState<AbaRanking>('geral');
  const [visao, setVisao] = useState<VisaoRanking>('ranking');
  const [resposta, setResposta] = useState<RankingAlunoResposta | null>(null);
  const [progressoServidor, setProgressoServidor] = useState<ProgressoNivel | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      setCarregando(true);
      setErro(null);

      try {
        const dados = aba === 'geral' ? await obterRankingGeral() : await obterRankingAmigos();
        if (ativo) {
          setResposta(dados);
        }
      } catch (error) {
        if (ativo) {
          setResposta(null);
          setErro(error instanceof Error ? error.message : 'Erro ao carregar o ranking.');
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    };

    void carregar();

    return () => {
      ativo = false;
    };
  }, [aba]);

  // Consulta /quiz/progresso na montagem para exibir os dados reais de elo do aluno
  // mesmo na visao principal do ranking quando o perfil esta privado no ranking geral.
  useEffect(() => {
    let ativo = true;

    buscarProgressoXp()
      .then((dados) => {
        if (ativo && dados) {
          setProgressoServidor(dados);
        }
      })
      .catch(() => {
        // Silencioso: usa os dados derivados do ranking caso a chamada falhe.
      });

    return () => {
      ativo = false;
    };
  }, []);

  // Recarrega o ranking a cada troca de aba; flag evita aplicar resultado apos unmount.
  // Converte uma entrada bruta da API na linha exibida pelo board (com cosmeticos, elo e destaque).
  const mapearLinha = (entrada: EntradaRanking): LinhaRanking => {
    const xp = entrada.xpTotal ?? 0;
    const eloResolvido = entrada.elo ?? calcularFaixaEloPorXp(xp).nome;
    return {
      posicao: entrada.posicao,
      id: entrada.usuarioId,
      nome: entrada.nome,
      nickname:
        entrada.ehUsuarioAtual && !entrada.nickname ? user?.nickname ?? null : entrada.nickname,
      detalhe: montarDetalhe(entrada.curso, entrada.semestre),
      totalAcertos: entrada.totalAcertos,
      taxaAcerto: entrada.taxaAcerto,
      // Ranking de alunos e ordenado por XP: o XP e a metrica principal da linha.
      pontuacao: xp,
      nivel: entrada.nivel ?? 1,
      elo: eloResolvido,
      destaque: entrada.ehUsuarioAtual,
      cosmeticos: converterItensEquipadosParaSlots(entrada.cosmeticos ?? []),
    };
  };

  const linhas = useMemo(
    () => (resposta ? resposta.dados.map(mapearLinha) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resposta, user?.nickname],
  );

  const usuarioAtual = useMemo(
    () => (resposta?.usuarioAtual ? mapearLinha(resposta.usuarioAtual) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resposta, user?.nickname],
  );

  // Combina o progresso retornado pelo servidor (se houver) com os dados da linha do usuario no ranking.
  const progressoEfetivo = useMemo<ProgressoNivel | null>(() => {
    if (progressoServidor) return progressoServidor;
    if (!resposta?.usuarioAtual) return null;

    const entrada = resposta.usuarioAtual;
    const xpTotal = entrada.xpTotal ?? 0;
    const nivel = entrada.nivel ?? 1;
    // O ranking devolve o elo ATUAL do aluno (que pode ter caido por inatividade). Se o
    // nome vier desconhecido, cai no elo calculado pelo XP em vez de assumir Curioso.
    const faixaDoRanking = entrada.elo ? obterFaixaEloPorNomeOuCodigo(entrada.elo) : null;
    const eloEfetivo =
      faixaDoRanking && faixaDoRanking.nome === entrada.elo
        ? faixaDoRanking
        : calcularFaixaEloPorXp(xpTotal);

    // Esta rota nao traz o XP de elo. O XP total serve de aproximacao, mas limitado ao
    // teto da faixa atual: num aluno rebaixado, o XP total extrapola a faixa e o card
    // mostraria "7.000 XP de elo" num elo que termina em 5.999.
    const xpEloAproximado = Math.min(xpTotal, eloEfetivo.xpMaximo ?? xpTotal);

    return {
      xpTotal,
      xpElo: xpEloAproximado,
      nivel,
      proximoNivel: nivel + 1,
      xpNoNivel: 0,
      xpNecessarioNoNivel: 100,
      xpFaltante: 100,
      percentual: 0,
      eloAtual: eloEfetivo,
      maiorElo: eloEfetivo,
      estadoElo: 'ATIVO',
      diasInatividade: 0,
      prazoRebaixamentoEm: null,
    };
  }, [progressoServidor, resposta?.usuarioAtual]);

  const dadosElo = useMemo(
    () => resolverDadosEloProgresso(progressoEfetivo),
    [progressoEfetivo],
  );

  // Perfil privado: no ranking geral, com resposta carregada mas sem a linha do usuario.
  const perfilPrivado =
    aba === 'geral' && !carregando && !erro && resposta !== null && usuarioAtual === null;

  /** Texto da posicao do usuario no cartao de resumo, conforme o estado atual. */
  const resumoPosicao = () => {
    if (carregando) return '—';
    if (perfilPrivado) return 'Perfil privado';
    if (!usuarioAtual) return 'Sem dados';
    return `${usuarioAtual.posicao}º`;
  };

  /** Texto auxiliar com o total de participantes (alunos ou amigos). */
  const resumoTotal = () => {
    if (!resposta) return aba === 'amigos' ? 'amigos' : 'participantes';
    const sufixo = aba === 'amigos' ? 'amigos (incluindo você)' : 'alunos no ranking';
    return `de ${resposta.totalParticipantes} ${sufixo}`;
  };

  const acertosUsuario = resposta?.usuarioAtual?.totalAcertos ?? 0;
  const taxaAcertoUsuario = resposta?.usuarioAtual?.taxaAcerto ?? 0;
  const semMetricasUsuario = carregando || !usuarioAtual;

  return (
    <main className="min-h-full bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {/* Cabecalho com navegacao entre Ranking, Minha progressao e Todos os elos */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            {visao !== 'ranking' && (
              <p className="text-[11px] font-black uppercase tracking-wider text-[#EA580C]">
                RANKING / PROGRESSÃO DE ELOS
              </p>
            )}
            <div className="flex items-center gap-3 text-[#0A1128]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#71edc8]/20 text-[#00A88F]">
                <Trophy size={24} />
              </span>
              <h1 className="text-3xl font-black">
                {visao === 'ranking'
                  ? 'Ranking'
                  : visao === 'progressao'
                    ? 'Minha progressão'
                    : 'Todos os elos'}
              </h1>
            </div>
            <p className="max-w-2xl text-sm font-medium text-[#0A1128]/60">
              {visao === 'ranking'
                ? 'Acompanhe sua evolução no AnatoQuizUp pelo XP acumulado ao concluir quizzes e veja como você está em relação aos colegas e amigos.'
                : visao === 'progressao'
                  ? 'Acompanhe seu elo atual, o XP de elo acumulado e quanto falta para a próxima faixa.'
                  : 'Veja todas as faixas de XP e acompanhe seu caminho até o último marco.'}
            </p>
          </div>

          <div
            role="group"
            aria-label="Visualização do ranking e elos"
            className="flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setVisao('ranking')}
              aria-pressed={visao === 'ranking'}
              className={`rounded-xl px-4 py-2.5 text-xs font-black transition-colors ${
                visao === 'ranking'
                  ? 'bg-[#EA580C] text-white shadow-sm'
                  : 'border border-[#0A1128]/15 bg-white text-[#0A1128] hover:bg-[#F8FAFC]'
              }`}
            >
              Ver ranking
            </button>
            <button
              type="button"
              onClick={() => setVisao('progressao')}
              aria-pressed={visao === 'progressao'}
              className={`rounded-xl px-4 py-2.5 text-xs font-black transition-colors ${
                visao === 'progressao'
                  ? 'bg-[#EA580C] text-white shadow-sm'
                  : 'border border-[#0A1128]/15 bg-white text-[#0A1128] hover:bg-[#F8FAFC]'
              }`}
            >
              Minha progressão
            </button>
            <button
              type="button"
              onClick={() => setVisao('elos')}
              aria-pressed={visao === 'elos'}
              className={`rounded-xl px-4 py-2.5 text-xs font-black transition-colors ${
                visao === 'elos'
                  ? 'bg-[#EA580C] text-white shadow-sm'
                  : 'border border-[#0A1128]/15 bg-white text-[#0A1128] hover:bg-[#F8FAFC]'
              }`}
            >
              Todos os elos
            </button>
          </div>
        </div>

        {visao === 'progressao' && (
          <MinhaProgressaoElo
            nomeUsuario={usuarioAtual?.nome ?? user?.name ?? 'Estudante'}
            totalAcertos={acertosUsuario}
            cosmeticos={usuarioAtual?.cosmeticos}
            progresso={progressoEfetivo}
            onVerTodosOsElos={() => setVisao('elos')}
            onFazerQuiz={() => navigate('/aluno/quiz/escolha')}
          />
        )}

        {visao === 'elos' && <TodosOsElosGrid progresso={progressoEfetivo} />}

        {visao === 'ranking' && (
          <>
            {/* Tres cartoes de resumo do topo (Tela 1 do Figma): Sua posicao, Seus acertos, Seu elo */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="flex items-center gap-4 rounded-2xl border border-[#0A1128]/10 bg-white p-5 shadow-sm">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#71edc8]/20 text-[#00A88F]">
                  <Medal size={28} />
                </span>
                <div className="min-w-0">
                  <p className="text-3xl font-black leading-none text-[#0A1128]">
                    {resumoPosicao()}
                  </p>
                  <h2 className="mt-2 text-base font-black text-[#0A1128]">Sua posição</h2>
                  <p className="mt-1 text-sm font-medium text-[#0A1128]/55">{resumoTotal()}</p>
                </div>
              </article>

              <article className="flex items-center gap-4 rounded-2xl border border-[#0A1128]/10 bg-white p-5 shadow-sm">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#ECFDF5] text-[#059669]">
                  <CheckCircle2 size={28} />
                </span>
                <div className="min-w-0">
                  <p className="text-3xl font-black leading-none tabular-nums text-[#0A1128]">
                    {semMetricasUsuario ? '—' : acertosUsuario.toLocaleString('pt-BR')}
                  </p>
                  <h2 className="mt-2 text-base font-black text-[#0A1128]">Seus acertos</h2>
                  <p className="mt-1 text-sm font-medium text-[#0A1128]/55">
                    Taxa de acerto: {semMetricasUsuario ? '—' : `${taxaAcertoUsuario}%`}
                  </p>
                </div>
              </article>

              <article className="flex items-center gap-4 rounded-2xl border border-[#0A1128]/10 bg-white p-5 shadow-sm">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFF7ED] text-[#EA580C]">
                  <EloIcon elo={dadosElo.eloAtual.codigo} size={26} />
                </span>
                <div className="min-w-0">
                  <p className="text-2xl font-black leading-none text-[#0A1128]">
                    {dadosElo.eloAtual.nome}
                  </p>
                  <h2 className="mt-2 text-base font-black text-[#0A1128]">Seu elo</h2>
                  <p className="mt-1 text-sm font-medium text-[#0A1128]/55">
                    {dadosElo.proximoElo
                      ? `Faltam ${dadosElo.xpFaltanteProximoElo.toLocaleString('pt-BR')} XP para ${dadosElo.proximoElo.nome}`
                      : 'Elo máximo alcançado'}
                  </p>
                </div>
              </article>
            </div>

            <div className="w-full overflow-hidden rounded-2xl border border-[#0A1128]/10 bg-white shadow-sm">
              <div className="grid grid-cols-2">
                {TABS.map((tab) => {
                  const isActive = aba === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setAba(tab.key)}
                      aria-pressed={isActive}
                      className={`min-h-12 border-r border-[#0A1128]/10 px-3 text-sm font-black transition-colors last:border-r-0 ${
                        isActive
                          ? 'bg-[#71edc8]/15 text-[#0A1128]'
                          : 'bg-white text-[#0A1128]/60 hover:bg-[#F8FAFC] hover:text-[#0A1128]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aviso quando o perfil privado impede a participacao no ranking geral. */}
            {perfilPrivado && (
              <div className="flex items-start gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <EyeOff size={22} />
                </span>
                <div>
                  <h3 className="text-base font-black text-[#0A1128]">Seu perfil está privado</h3>
                  <p className="mt-1 text-sm font-medium text-[#0A1128]/60">
                    Com o perfil privado você não aparece no ranking geral. Ative a visibilidade em{' '}
                    <Link
                      to="/aluno/amigos"
                      className="font-black text-[#00A88F] hover:underline"
                    >
                      Amigos › Privacidade
                    </Link>{' '}
                    para entrar na disputa.
                  </p>
                </div>
              </div>
            )}

            {/* Convite para adicionar amigos quando a aba "amigos" tem so o proprio usuario. */}
            {aba === 'amigos' &&
              !carregando &&
              !erro &&
              resposta &&
              resposta.totalParticipantes <= 1 && (
                <div className="flex items-start gap-4 rounded-2xl border border-[#0A1128]/10 bg-white p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#71edc8]/20 text-[#00A88F]">
                    <Users size={22} />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-[#0A1128]">
                      Adicione amigos para comparar
                    </h3>
                    <p className="mt-1 text-sm font-medium text-[#0A1128]/60">
                      Você ainda não tem amigos no ranking. Vá em{' '}
                      <Link
                        to="/aluno/amigos"
                        className="font-black text-[#00A88F] hover:underline"
                      >
                        Amigos
                      </Link>{' '}
                      e envie convites para disputar com seus colegas.
                    </p>
                  </div>
                </div>
              )}

            <RankingBoard
              linhas={linhas}
              rotuloMetrica="XP"
              usuarioAtual={usuarioAtual}
              carregando={carregando}
              erro={erro}
              mensagemVazio={
                aba === 'amigos'
                  ? 'Ninguém por aqui ainda. Adicione amigos e comece a responder questões para aparecer no ranking.'
                  : 'Ainda não há alunos no ranking. Conclua quizzes para ganhar XP e aparecer aqui.'
              }
            />

            {/* Card inferior de resumo do elo atual e barra de progresso (Tela 1 do Figma) */}
            <article
              aria-label="Resumo do seu elo"
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#0A1128]/10 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0A1128]">
                  <EloIcon elo={dadosElo.eloAtual.codigo} size={22} />
                </span>
                <div>
                  <h3 className="text-base font-black text-[#0A1128]">
                    Elo atual: {dadosElo.eloAtual.nome}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-[#0A1128]/60">
                    Nível {dadosElo.nivel} · {dadosElo.xpElo.toLocaleString('pt-BR')} XP de elo
                    {dadosElo.proximoElo
                      ? ` · Próximo elo: ${dadosElo.proximoElo.nome} em ${dadosElo.xpFaltanteProximoElo.toLocaleString('pt-BR')} XP`
                      : ' · Elo máximo disponível'}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-end gap-4">
                <div className="hidden w-full max-w-xs sm:block">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0A1128]/10">
                    <div
                      className="h-full rounded-full bg-[#EA580C] transition-all duration-500"
                      style={{ width: `${dadosElo.percentualElo}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVisao('progressao')}
                  className="shrink-0 rounded-xl bg-[#EA580C] px-4 py-2.5 text-xs font-black text-white shadow-sm transition-colors hover:bg-[#C2410C]"
                >
                  Minha progressão
                </button>
              </div>
            </article>
          </>
        )}
      </section>
    </main>
  );
};

