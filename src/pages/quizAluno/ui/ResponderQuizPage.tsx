// Pagina do "Treino Infinito" de quiz do aluno. Carrega questoes por tema/
// dificuldade (vindos da query string), apresenta uma por vez com cronometro
// pausavel, confirma a resposta exibindo o feedback (acerto/erro, ganho de moedas,
// "saiba mais" e conquistas desbloqueadas) e busca novas paginas continuamente.
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Clock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  ChevronRight,
  Check,
  Loader2,
  Flag,
  Coins,
  Zap,
} from "lucide-react";

import {
  buscarQuestoesQuiz,
  responderQuestaoQuiz,
} from "../../../features/random-quiz/randomQuizService";
import type {
  QuizQuestion,
  QuestaoQuizFeedback,
} from "../../../features/random-quiz/types";
import type { ApiQuestionDifficulty } from "../../../features/manage-questions";
import { useStudentCoinsStore } from "../../../features/student-coins/model/useStudentCoinsStore";
import { useAchievementStore } from "../../../features/achievements";

export const ResponderQuizPage = () => {
  const navigate = useNavigate();

  // Filtros do treino vem da URL (tema e dificuldade escolhidos na tela anterior).
  const [searchParams] = useSearchParams();
  const temaQuery = searchParams.get("tema") || "";
  const dificuldadeQuery = searchParams.get("dificuldade") || "";
  const setSaldoMoedas = useStudentCoinsStore((state) => state.setSaldoMoedas);
  const adicionarDesbloqueios = useAchievementStore(
    (state) => state.adicionarDesbloqueios,
  );

  // Questoes da pagina atual e o feedback da questao respondida (se houver).
  const [questoes, setQuestoes] = useState<QuizQuestion[]>([]);
  const [feedback, setFeedback] = useState<
    (QuestaoQuizFeedback & { respostaCorreta?: string }) | null
  >(null);
  const [isRespondendo, setIsRespondendo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Controle de progresso: pagina/indice na pagina, numero global e placar.
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [numeroDaQuestao, setNumeroDaQuestao] = useState(1);
  const [acertos, setAcertos] = useState(0);
  const [questoesRespondidas, setQuestoesRespondidas] = useState(0);

  // Estado da questao atual: selecao, se ja respondeu, cronometro e pausa.
  const [alternativaSelecionada, setAlternativaSelecionada] = useState<
    string | null
  >(null);
  const [jaRespondeu, setJaRespondeu] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Tamanho de cada pagina de questoes buscada do backend.
  const limit = 10;

  // Carrega a primeira pagina de questoes ao montar e quando os filtros mudam.
  useEffect(() => {
    let deveAtualizarEstado = true;

    buscarQuestoesQuiz({
      tema: temaQuery,
      dificuldade: dificuldadeQuery as ApiQuestionDifficulty,
      page: 1,
      limit,
    })
      .then((response) => {
        if (!deveAtualizarEstado) return;
        setQuestoes(response.dados);
        setPaginaAtual(1);
        setIndiceAtual(0);
      })
      .catch((error) => console.error("Erro ao buscar questões:", error))
      .finally(() => {
        if (deveAtualizarEstado) setIsLoading(false);
      });

    return () => {
      deveAtualizarEstado = false;
    };
  }, [temaQuery, dificuldadeQuery]);

  // Cronometro: incrementa a cada segundo enquanto nao esta pausado/carregando.
  useEffect(() => {
    let timer: number | undefined;
    if (!isPaused && !isLoading && questoes.length > 0) {
      timer = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isPaused, isLoading, questoes.length]);

  // Formata os segundos acumulados no formato MM:SS.
  const formatarTempo = (totalSegundos: number) => {
    const m = Math.floor(totalSegundos / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSegundos % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (isLoading && questoes.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#14D5C2] animate-spin mb-4" />
        <p className="text-[#0A1128] font-bold">
          Buscando questões no servidor...
        </p>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md">
          <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-[#0A1128] mb-2">
            Nenhuma questão encontrada
          </h2>
          <p className="text-[#0A1128]/60 mb-6">
            Não conseguimos encontrar questões para o tema selecionado no
            momento.
          </p>
          <button
            onClick={() => navigate("/aluno/quiz/escolha")}
            className="bg-[#14D5C2] text-white px-6 py-3 rounded-full font-bold w-full"
          >
            Voltar e escolher outro
          </button>
        </div>
      </div>
    );
  }

  // Questao em exibicao no momento.
  const questaoAtual = questoes[indiceAtual];

  if (!questaoAtual) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#14D5C2] animate-spin mb-4" />
        <p className="text-[#0A1128] font-bold text-sm">
          Preparando a próxima questão...
        </p>
      </div>
    );
  }

  // Derivados do feedback: se acertou e se houve ganho de moedas a destacar.
  const acertou = feedback?.correcao ?? false;
  const deveMostrarGanhoMoedas =
    acertou && (feedback?.moedasConcedidas ?? 0) > 0;

  // Taxa de acerto acumulada no treino (para a barra de progresso).
  const taxaAcerto =
    questoesRespondidas === 0 ? 0 : (acertos / questoesRespondidas) * 100;

  // Alternativas normalizadas: remove vazias e simplifica a chave ("alternativaA" -> "A").
  const alternativasFormatadas = questaoAtual?.alternativas
    ? Object.entries(questaoAtual.alternativas)
        .filter(([, texto]) => texto !== null && texto !== "")
        .map(([id, texto]) => ({ id: id.replace("alternativa", ""), texto }))
    : [];

  /**
   * Confirma a resposta selecionada: envia ao backend, guarda o feedback,
   * atualiza saldo de moedas e conquistas, pausa o cronometro e atualiza o placar.
   */
  const handleConfirmar = async () => {
    if (!alternativaSelecionada) return;

    try {
      setIsRespondendo(true);
      const response = await responderQuestaoQuiz({
        questaoId: questaoAtual.id,
        tipo: questaoAtual.tipo,
        respostaMarcada: alternativaSelecionada as "A" | "B" | "C" | "D" | "E",
      });

      setFeedback(response);
      setSaldoMoedas(response.saldoMoedas);
      adicionarDesbloqueios(response.conquistasDesbloqueadas ?? []);
      setJaRespondeu(true);
      setIsPaused(true);
      setQuestoesRespondidas((prev) => prev + 1);

      if (response.correcao) {
        setAcertos((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Erro ao responder questão:", error);
    } finally {
      setIsRespondendo(false);
    }
  };

  /**
   * Avanca para a proxima questao. Dentro da pagina, apenas incrementa o indice;
   * ao chegar ao fim, busca a proxima pagina (ou reinicia da pagina 1 se acabarem),
   * garantindo o "treino infinito".
   */
  const handleProxima = async () => {
    // Reseta o estado da questao para a proxima.
    setAlternativaSelecionada(null);
    setJaRespondeu(false);
    setFeedback(null);
    setIsPaused(false);
    setNumeroDaQuestao((prev) => prev + 1);

    // No fim da pagina atual: tenta a proxima pagina; se vazia, volta ao inicio.
    if (indiceAtual >= questoes.length - 1) {
      setIsLoading(true);
      try {
        const proxPagina = paginaAtual + 1;
        const response = await buscarQuestoesQuiz({
          tema: temaQuery,
          dificuldade: dificuldadeQuery as ApiQuestionDifficulty,
          page: proxPagina,
          limit,
        });

        if (response.dados.length > 0) {
          setQuestoes(response.dados);
          setPaginaAtual(proxPagina);
          setIndiceAtual(0);
        } else {
          const responseInicial = await buscarQuestoesQuiz({
            tema: temaQuery,
            dificuldade: dificuldadeQuery as ApiQuestionDifficulty,
            page: 1,
            limit,
          });
          setQuestoes(responseInicial.dados);
          setPaginaAtual(1);
          setIndiceAtual(0);
        }
      } catch (error) {
        console.error("Erro ao buscar novas questões:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIndiceAtual((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <button
          onClick={() => navigate("/aluno/quiz/escolha")}
          className="flex items-center gap-2 text-[11px] text-rose-500/70 hover:text-rose-600 font-black uppercase tracking-wide mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Encerrar Treino
        </button>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4 flex justify-between items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-black text-[#0A1128] leading-tight">
              Prática de Anatomia
            </h2>
            <p className="text-xs text-[#0A1128]/60 mt-0.5">
              Modo Treino Infinito
            </p>
          </div>

          <div className="flex gap-6 items-center">
            <div className="hidden md:flex flex-col w-32">
              <div className="flex justify-between text-[10px] text-[#0A1128]/50 font-bold uppercase tracking-wider mb-1.5">
                <span>Taxa de Acerto</span>
                <span>{Math.round(taxaAcerto)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out ${taxaAcerto >= 50 ? "bg-[#14D5C2]" : taxaAcerto > 0 ? "bg-amber-400" : "bg-gray-300"}`}
                  style={{
                    width: `${taxaAcerto === 0 ? 100 : taxaAcerto}%`,
                    opacity: taxaAcerto === 0 ? 0.3 : 1,
                  }}
                />
              </div>
            </div>

            <div className="text-center border-l border-gray-100 pl-6 hidden sm:block">
              <p className="text-[10px] text-[#0A1128]/50 font-bold uppercase tracking-wider mb-0.5">
                Questão
              </p>
              <p className="text-sm font-black text-[#0A1128]">
                {numeroDaQuestao}
              </p>
            </div>

            <div className="text-right border-l border-gray-100 pl-6 flex items-center gap-4">
              <div>
                <p className="text-[10px] text-[#0A1128]/50 font-bold uppercase tracking-wider mb-0.5">
                  Tempo
                </p>
                <div className="flex items-center gap-1.5 justify-end">
                  <Clock className="w-3.5 h-3.5 text-[#0A1128]/50" />
                  <span className="text-sm font-black text-[#0A1128]">
                    {formatarTempo(segundos)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => !jaRespondeu && setIsPaused(!isPaused)}
                disabled={jaRespondeu}
                className={`transition-colors ${isPaused ? "text-[#14D5C2]" : "text-[#14D5C2] hover:brightness-95"}`}
              >
                {isPaused && !jaRespondeu ? (
                  <PlayCircle className="w-8 h-8" />
                ) : (
                  <PauseCircle className="w-8 h-8" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Estado pausado (antes de responder): oculta a questao para o aluno descansar. */}
        {isPaused && !jaRespondeu ? (
          <div className="bg-white rounded-xl p-16 shadow-sm border border-gray-100 mb-4 flex flex-col items-center justify-center text-center animate-fade-in">
            <PauseCircle className="w-16 h-16 text-[#14D5C2] mb-4 opacity-50" />
            <h2 className="text-2xl font-black text-[#0A1128] mb-2">
              Treino Pausado
            </h2>
            <p className="text-[#0A1128]/60 mb-8 max-w-md">
              O tempo foi interrompido. A questão está oculta para que possa
              descansar.
            </p>
            <button
              onClick={() => setIsPaused(false)}
              className="bg-[#14D5C2] text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wide shadow-md"
            >
              Retomar Treino
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-4 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 bg-[#E6FCFA] text-[#14D5C2] px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-6 border border-[#14D5C2]/20">
              <CheckCircle2 className="w-3 h-3" />
              {questaoAtual.tipo.replace("_", " ")}
            </div>

            <h3 className="text-xl font-black text-[#0A1128] mb-8 leading-relaxed">
              {questaoAtual.enunciado}
            </h3>

            {questaoAtual.imagem && (
              <div className="mb-6 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex justify-center">
                <img
                  src={questaoAtual.imagem}
                  alt="Imagem da questão"
                  className="w-full max-h-[420px] object-contain"
                  loading="lazy"
                />
              </div>
            )}

            {/* Alternativas: o estilo de cada uma muda conforme selecao e feedback (acerto/erro). */}
            <div className="flex flex-col gap-4">
              {alternativasFormatadas.map((alt) => {
                const isSelecionada = alternativaSelecionada === alt.id;
                const isCorretaPeloFeedback =
                  feedback?.respostaCorreta === alt.id;

                // Monta as classes de cor conforme o estado (respondido x correto x selecionado).
                let estilosBase =
                  "p-4 rounded-xl border-2 flex items-center justify-between font-bold text-sm transition-all cursor-pointer";
                let iconClass =
                  "bg-gray-50 text-[#0A1128]/60 border border-gray-200";

                if (jaRespondeu) {
                  if (acertou && isSelecionada) {
                    estilosBase +=
                      " bg-[#E6FCFA] border-[#14D5C2] text-[#0A1128]";
                    iconClass = "bg-[#14D5C2] text-white border-[#14D5C2]";
                  } else if (!acertou && isSelecionada) {
                    estilosBase +=
                      " bg-rose-50 border-rose-500 text-rose-600 opacity-90";
                    iconClass = "bg-rose-500 text-white border-rose-500";
                  } else if (!acertou && isCorretaPeloFeedback) {
                    estilosBase +=
                      " bg-[#E6FCFA] border-[#14D5C2] text-[#0A1128]";
                    iconClass = "bg-[#14D5C2] text-white border-[#14D5C2]";
                  } else {
                    estilosBase +=
                      " border-gray-100 text-[#0A1128]/40 bg-white cursor-default opacity-60";
                  }
                } else {
                  if (isSelecionada) {
                    estilosBase +=
                      " border-[#14D5C2] text-[#0A1128] bg-white shadow-sm scale-[1.01]";
                    iconClass = "bg-[#14D5C2] text-white border-[#14D5C2]";
                  } else {
                    estilosBase +=
                      " border-gray-100 text-[#0A1128]/70 hover:border-gray-300 bg-white hover:bg-gray-50";
                  }
                }

                return (
                  <button
                    key={alt.id}
                    disabled={jaRespondeu}
                    onClick={() => setAlternativaSelecionada(alt.id)}
                    className={estilosBase}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-black ${iconClass}`}
                      >
                        {alt.id}
                      </div>
                      <span>{alt.texto}</span>
                    </div>
                    {jaRespondeu && acertou && isSelecionada && (
                      <Check className="w-5 h-5 text-[#14D5C2]" />
                    )}
                    {jaRespondeu && !acertou && isSelecionada && (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    )}
                    {jaRespondeu && !acertou && isCorretaPeloFeedback && (
                      <Check className="w-5 h-5 text-[#14D5C2] opacity-80" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-6">
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#0A1128]/50">
                  Dificuldade:
                  <span className="rounded bg-[#E6FCFA] px-2 py-0.5 text-[#14D5C2]">
                    {questaoAtual.dificuldade}
                  </span>
                </span>

                <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-500/70 transition-colors hover:text-rose-500">
                  <Flag className="h-3 w-3" />
                  Reportar
                </button>
              </div>

              <div className="w-full sm:w-auto">
                {jaRespondeu ? (
                  <button
                    onClick={handleProxima}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#14D5C2] px-8 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-md hover:brightness-95 sm:w-auto"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmar}
                    disabled={!alternativaSelecionada || isRespondendo}
                    className="w-full rounded-full bg-[#14D5C2] px-8 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-md hover:brightness-95 disabled:opacity-50 sm:w-auto"
                  >
                    {isRespondendo ? "Enviando..." : "Confirmar"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bloco "saiba mais": explicacao exibida apos responder, com o ganho de moedas. */}
        {jaRespondeu && feedback?.saibaMais && (
          <div
            className={`rounded-xl p-6 border animate-fade-in relative overflow-hidden ${acertou ? "bg-[#E6FCFA] border-[#14D5C2]" : "bg-rose-50 border-rose-200"}`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3
                className={`text-sm font-black uppercase tracking-wide ${acertou ? "text-[#0E9384]" : "text-rose-700"}`}
              >
                {acertou ? "Resposta Correta!" : "Resposta Incorreta!"}
              </h3>

              {deveMostrarGanhoMoedas && (
                <div
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#F59E0B] px-3 py-1.5 text-xs font-black text-[#0A1128] shadow-lg shadow-[#F59E0B]/20"
                  style={{ animation: "coins-reward-rise 900ms ease-out both" }}
                >
                  <Coins className="w-4 h-4" />+{feedback.moedasConcedidas} ATP
                </div>
              )}
            </div>

            <p className="text-sm font-medium leading-relaxed text-[#0A1128]/80">
              {feedback.saibaMais}
            </p>
            {feedback.potencializadorAplicado && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F59E0B]/15 px-3 py-2 text-xs font-black text-[#B45309]">
                <Zap className="h-4 w-4" />
                {feedback.potencializadorAplicado.nome}: +
                {feedback.potencializadorAplicado.bonusMoedas} ATP extras
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
