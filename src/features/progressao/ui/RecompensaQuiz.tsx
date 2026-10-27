import { useState } from 'react';
import { CheckCircle2, PartyPopper, RotateCcw, Sparkles } from 'lucide-react';

import { resolverDadosEloProgresso } from '../eloUtils';
import type { ResultadoTentativa } from '../types';
import { BarraNivel } from './BarraNivel';
import { EloConquistadoBanner } from './EloConquistadoBanner';
import { TodosOsElosGrid } from './TodosOsElosGrid';

type RecompensaQuizProps = {
  resultado: ResultadoTentativa;
  onJogarDeNovo: () => void;
  onVoltar: () => void;
  onRevisarErros?: () => void;
};

const formatar = (valor: number) => valor.toLocaleString('pt-BR');

/** Linha do detalhamento da recompensa (rotulo a esquerda, XP a direita). */
const LinhaXp = ({ rotulo, valor }: { rotulo: string; valor: number }) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <dt className="text-sm font-semibold text-[#0A1128]/70">{rotulo}</dt>
    <dd className="text-sm font-black tabular-nums text-[#0A1128]">+{formatar(valor)} XP</dd>
  </div>
);

/**
 * Tela de fim de quiz: resumo da rodada, detalhamento do XP recebido, XP
 * acumulado, nivel/elo atual e, quando houver, a celebracao de novo nivel
 * e de novo elo conquistado (Telas 4 e 5 do Figma).
 */
export const RecompensaQuiz = ({ resultado, onJogarDeNovo, onVoltar, onRevisarErros }: RecompensaQuizProps) => {
  const { recompensa, progresso } = resultado;
  const [mostrarJornadaElos, setMostrarJornadaElos] = useState(false);
  const [celebracaoEloFechada, setCelebracaoEloFechada] = useState(false);

  const dadosElo = resolverDadosEloProgresso(progresso);
  const novoElo = resultado.novoElo ?? dadosElo.eloAtual;
  const xpExcedente =
    resultado.xpExcedenteElo ?? Math.max(0, dadosElo.xpTotal - novoElo.xpMinimo);

  const taxa =
    resultado.totalQuestoes === 0
      ? 0
      : Math.round((resultado.totalAcertos / resultado.totalQuestoes) * 100);

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F8FAFC] p-4 md:p-6">
      <div className="flex w-full max-w-3xl flex-col gap-5">
        {/* Celebracao de novo elo conquistado (Telas 4 e 5 do Figma). */}
        {resultado.subiuDeElo && !celebracaoEloFechada && (
          <EloConquistadoBanner
            novoElo={novoElo}
            xpRecebido={recompensa.xpTotalRecebido}
            xpExcedente={xpExcedente}
            progresso={progresso}
            onContinuar={() => setCelebracaoEloFechada(true)}
            onVerJornada={() => setMostrarJornadaElos((atual) => !atual)}
          />
        )}

        {mostrarJornadaElos && <TodosOsElosGrid progresso={progresso} />}

        {/* Celebracao de novo nivel. */}
        {resultado.subiuDeNivel && (
          <div
            role="status"
            className="flex items-center gap-4 rounded-2xl border border-[#7C3AED]/30 bg-[#7C3AED] p-5 text-white shadow-lg shadow-[#7C3AED]/20"
          >
            <PartyPopper className="h-10 w-10 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-lg font-black leading-tight">
                Parabéns! Você alcançou o nível {progresso.nivel}
              </p>
              <p className="mt-0.5 text-sm font-medium text-white/85">
                Você saiu do nível {resultado.nivelAnterior}. Continue praticando para evoluir.
              </p>
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6FCFA] text-[#14D5C2]">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-2xl font-black text-[#0A1128]">Quiz concluído!</h1>
            <p className="mt-1 text-sm font-medium text-[#0A1128]/60">
              {resultado.tema ?? 'Quiz'}
              {resultado.dificuldade ? ` · ${resultado.dificuldade}` : ''}
            </p>
            <p className="mt-4 text-sm font-bold text-[#0A1128]">
              Você acertou {resultado.totalAcertos} de {resultado.totalQuestoes} questões ({taxa}%)
            </p>
          </div>

          {/* Detalhamento do XP recebido. */}
          <div className="mt-6 rounded-xl border border-gray-100 bg-[#F8FAFC] px-5 py-2">
            <dl className="divide-y divide-gray-200">
              <LinhaXp rotulo="XP base" valor={recompensa.xpBase} />
              <LinhaXp rotulo="Bônus por desempenho" valor={recompensa.bonusDesempenho} />
              {recompensa.bonusPowerUp > 0 && (
                <LinhaXp rotulo="Bônus de power-up" valor={recompensa.bonusPowerUp} />
              )}
            </dl>
            <div className="flex items-center justify-between gap-4 border-t-2 border-[#0A1128]/10 py-3">
              <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#0A1128]">
                <Sparkles className="h-4 w-4 text-[#7C3AED]" aria-hidden="true" />
                XP total recebido
              </span>
              <span className="text-xl font-black tabular-nums text-[#7C3AED]">
                +{formatar(recompensa.xpTotalRecebido)} XP
              </span>
            </div>
          </div>

          {resultado.jaConcluida && (
            <p className="mt-3 text-center text-xs font-semibold text-[#0A1128]/50">
              Esta rodada já havia sido concluída. O XP não é concedido novamente.
            </p>
          )}

          {/* XP acumulado, nivel/elo atual e progresso ate o proximo nivel/elo. */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A1128]/50">
                XP acumulado
              </span>
              <span className="text-sm font-black tabular-nums text-[#0A1128]">
                {formatar(progresso.xpTotal)} XP
              </span>
            </div>
            <BarraNivel progresso={progresso} />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {resultado.totalAcertos < resultado.totalQuestoes && onRevisarErros && (
              <button type="button" onClick={onRevisarErros} className="w-full rounded-full border border-rose-200 bg-rose-50 px-6 py-3 text-xs font-bold uppercase tracking-wide text-rose-800 hover:bg-rose-100">
                Revisar meus erros
              </button>
            )}
            <button
              type="button"
              onClick={onVoltar}
              className="w-full rounded-full border border-gray-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-[#0A1128] hover:bg-gray-50"
            >
              Escolher outro quiz
            </button>
            <button
              type="button"
              onClick={onJogarDeNovo}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#14D5C2] px-6 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-md hover:brightness-95"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Jogar de novo
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
