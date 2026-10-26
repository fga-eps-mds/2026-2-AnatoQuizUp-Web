import { Info } from 'lucide-react';

import { resolverDadosEloProgresso } from '../eloUtils';
import type { EloJornada, ProgressoNivel } from '../types';
import { EloIcon } from './EloIcon';

type TodosOsElosGridProps = {
  progresso?: ProgressoNivel | null;
};

const formatar = (valor: number) => valor.toLocaleString('pt-BR');

const badgePorStatus: Record<
  EloJornada['status'],
  { texto: string; classe: string }
> = {
  CONQUISTADO: {
    texto: 'CONQUISTADO',
    classe: 'bg-[#DCFCE7] text-[#047857]',
  },
  ELO_ATUAL: {
    texto: 'ELO ATUAL',
    classe: 'bg-[#DBEAFE] text-[#1D4ED8]',
  },
  PROXIMO_ELO: {
    texto: 'PRÓXIMO ELO',
    classe: 'bg-[#F1F5F9] text-[#475569]',
  },
  BLOQUEADO: {
    texto: 'BLOQUEADO',
    classe: 'bg-[#F1F5F9] text-[#475569]',
  },
  ELO_MAXIMO: {
    texto: 'ELO MÁXIMO',
    classe: 'bg-[#F1F5F9] text-[#475569]',
  },
};

/**
 * Componente da Tela 3 ("Todos os elos") do Figma.
 * Exibe o aviso sobre titulos gamificados, os 7 cartoes de faixas de XP com
 * status, icone, objetivo, barra de progresso e o card explicativo "Como funciona a evolução?".
 */
export const TodosOsElosGrid = ({ progresso }: TodosOsElosGridProps) => {
  const dados = resolverDadosEloProgresso(progresso);

  return (
    <section aria-label="Todos os elos" className="flex w-full flex-col gap-5">
      {/* Aviso de que elos sao marcos gamificados */}
      <div className="flex items-center gap-2.5 rounded-2xl border border-[#0A1128]/10 bg-white px-4 py-3 text-xs font-semibold text-[#0A1128]/80 shadow-sm">
        <Info className="h-4 w-4 shrink-0 text-[#EA580C]" aria-hidden="true" />
        <span>Elos são marcos do AnatoQuizUp, não títulos acadêmicos ou profissionais.</span>
      </div>

      {/* Grid de cartoes de elos + card explicativo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dados.todosOsElos.map((faixa, index) => {
          const badge = badgePorStatus[faixa.status];
          const proximoMarco = dados.todosOsElos[index + 1] ?? null;

          let legendaProgresso = `Conquiste ${faixa.eloAnteriorNome ?? 'o elo anterior'} primeiro`;
          if (faixa.status === 'CONQUISTADO') {
            legendaProgresso = 'Elo concluído';
          } else if (faixa.status === 'ELO_ATUAL') {
            legendaProgresso = proximoMarco
              ? `${formatar(dados.xpTotal)} de ${formatar(proximoMarco.xpMinimo)} XP`
              : `${formatar(dados.xpTotal)} XP · Elo máximo alcançado`;
          } else if (faixa.status === 'PROXIMO_ELO') {
            legendaProgresso = `Faltam ${formatar(faixa.xpFaltante)} XP`;
          }

          const corBarra =
            faixa.status === 'CONQUISTADO'
              ? 'bg-[#10B981]'
              : faixa.status === 'ELO_ATUAL'
                ? 'bg-[#EA580C]'
                : 'bg-[#CBD5E1]';

          const corTextoStatus =
            faixa.status === 'CONQUISTADO' ? 'text-[#059669]' : 'text-[#0A1128]/65';

          const fundoIcone =
            faixa.status === 'ELO_ATUAL'
              ? 'bg-[#FFF7ED] text-[#0A1128]'
              : faixa.status === 'CONQUISTADO'
                ? 'bg-[#ECFDF5] text-[#0A1128]'
                : 'bg-[#F1F5F9] text-[#0A1128]';

          return (
            <article
              key={faixa.codigo}
              className={`flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-colors ${
                faixa.ehAtual
                  ? 'border-[#EA580C]/40 bg-white ring-1 ring-[#EA580C]/20'
                  : 'border-[#0A1128]/10 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${badge.classe}`}
                  >
                    {badge.texto}
                  </span>
                  <span
                    className={`text-xs font-black tabular-nums ${
                      faixa.conquistado || faixa.ehAtual ? 'text-[#EA580C]' : 'text-[#0A1128]/60'
                    }`}
                  >
                    {formatar(faixa.xpMinimo)} XP
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${fundoIcone}`}
                  >
                    <EloIcon elo={faixa.codigo} size={20} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-[#0A1128]">{faixa.nome}</h3>
                    <p className="text-xs font-medium text-[#0A1128]/55">{faixa.objetivo}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold">
                  <span className={corTextoStatus}>{legendaProgresso}</span>
                  <span
                    className={`tabular-nums ${
                      faixa.status === 'CONQUISTADO' ? 'text-[#059669]' : 'text-[#0A1128]'
                    }`}
                  >
                    {faixa.percentual}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#0A1128]/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${corBarra}`}
                    style={{ width: `${faixa.percentual}%` }}
                  />
                </div>
              </div>
            </article>
          );
        })}

        {/* Card explicativo final (ocupa 2 colunas em telas grandes, igual ao Figma) */}
        <article className="flex flex-col justify-center rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] p-6 md:col-span-2">
          <h3 className="text-lg font-black text-[#0A1128]">Como funciona a evolução?</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs font-medium text-[#0A1128]/75">
            <li>Quizzes válidos concedem XP total e XP de elo.</li>
            <li>A faixa é alcançada automaticamente; o XP excedente continua.</li>
            <li>
              Alterações nas faixas ou inatividade não apagam o XP total nem reduzem o maior elo já
              conquistado.
            </li>
          </ol>
        </article>
      </div>
    </section>
  );
};

