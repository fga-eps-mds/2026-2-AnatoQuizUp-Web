import { CheckCircle2, Info } from 'lucide-react';

import { resolverDadosEloProgresso } from '../eloUtils';
import type { FaixaElo, ProgressoNivel } from '../types';
import { EloIcon } from './EloIcon';

type EloConquistadoBannerProps = {
  eloAnterior?: FaixaElo;
  novoElo: FaixaElo;
  xpRecebido: number;
  xpExcedente: number;
  progresso: ProgressoNivel;
  onContinuar: () => void;
  onVerJornada: () => void;
};

const formatar = (valor: number) => valor.toLocaleString('pt-BR');

/**
 * Componente das telas 4 ("Novo elo conquistado") e 5 ("Elo máximo alcançado — Staff do serviço")
 * do Figma. Exibe a celebracao de evolucao de elo, o XP recebido e excedente mantido,
 * os cartoes de resumo (Elo atual, XP total, Proximo elo / Nao ha) e a barra do proximo marco.
 */
export const EloConquistadoBanner = ({
  novoElo,
  xpRecebido,
  xpExcedente,
  progresso,
  onContinuar,
  onVerJornada,
}: EloConquistadoBannerProps) => {
  const dados = resolverDadosEloProgresso(progresso);
  const ehMaximo = novoElo.codigo === 'STAFF_DO_SERVICO' || dados.proximoElo === null;

  return (
    <section
      aria-label={ehMaximo ? 'Elo máximo alcançado' : 'Novo elo conquistado'}
      className="flex w-full flex-col gap-5"
    >
      {/* Cabecalho da tela de conquista de elo */}
      <header className="rounded-2xl border border-[#0A1128]/10 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-wider text-[#EA580C]">
          RANKING / ELOS
        </p>
        <h2 className="mt-1 text-2xl font-black text-[#0A1128]">
          {ehMaximo ? 'Elo máximo alcançado' : 'Novo elo conquistado'}
        </h2>
        <p className="mt-0.5 text-sm font-medium text-[#0A1128]/60">
          {ehMaximo
            ? 'O XP continua acumulando mesmo após o último elo.'
            : 'Seu XP de elo alcançou a próxima faixa automaticamente.'}
        </p>
      </header>

      {/* Card principal de celebracao */}
      <div
        role="status"
        className="flex flex-col items-center rounded-2xl border border-[#10B981]/25 bg-[#ECFDF5] p-6 text-center shadow-sm sm:p-8"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#0A1128] shadow-sm">
          <EloIcon elo={novoElo.codigo} size={32} />
        </div>

        <span className="mt-4 text-[11px] font-black uppercase tracking-wider text-[#059669]">
          {ehMaximo ? 'ELO MÁXIMO ALCANÇADO' : 'NOVO ELO CONQUISTADO'}
        </span>

        <h3 className="mt-1 text-3xl font-black text-[#0A1128]">{novoElo.nome}</h3>

        <p className="mt-2 max-w-lg text-sm font-medium text-[#0A1128]/70">
          {ehMaximo
            ? `Você alcançou ${formatar(dados.xpTotal)} XP de elo. Este é o maior marco da progressão.`
            : `Você recebeu ${formatar(xpRecebido)} XP e chegou a ${formatar(dados.xpTotal)} XP de elo. Os ${formatar(xpExcedente)} XP excedentes foram mantidos.`}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onContinuar}
            className="rounded-xl bg-[#EA580C] px-6 py-2.5 text-xs font-black text-white shadow-sm transition-colors hover:bg-[#C2410C]"
          >
            Continuar
          </button>
          <button
            type="button"
            onClick={onVerJornada}
            className="rounded-xl border border-[#0A1128]/15 bg-white px-6 py-2.5 text-xs font-black text-[#0A1128] transition-colors hover:bg-[#F8FAFC]"
          >
            Ver jornada
          </button>
        </div>
      </div>

      {/* Tres cards de resumo: Elo atual, XP total e Proximo elo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-[#0A1128]/10 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#0A1128]/55">Elo atual</p>
          <p className="mt-1 text-xl font-black text-[#059669]">{novoElo.nome}</p>
          <p className="mt-1 text-xs font-medium text-[#0A1128]/50">Atualizado automaticamente</p>
        </article>

        <article className="rounded-2xl border border-[#0A1128]/10 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#0A1128]/55">XP total</p>
          <p className="mt-1 text-xl font-black tabular-nums text-[#D97706]">
            {formatar(dados.xpTotal)} XP
          </p>
          <p className="mt-1 text-xs font-medium text-[#0A1128]/50">
            {ehMaximo ? 'XP histórico preservado' : 'Nenhum XP foi perdido'}
          </p>
        </article>

        <article className="rounded-2xl border border-[#0A1128]/10 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#0A1128]/55">Próximo elo</p>
          <p className="mt-1 text-xl font-black text-[#EA580C]">
            {dados.proximoElo ? dados.proximoElo.nome : 'Não há'}
          </p>
          <p className="mt-1 text-xs font-medium text-[#0A1128]/50">
            {dados.proximoElo
              ? `Faltam ${formatar(dados.xpFaltanteProximoElo)} XP`
              : 'Elo máximo disponível'}
          </p>
        </article>
      </div>

      {/* Card de barra do proximo marco ou topo alcancado */}
      <div className="rounded-2xl border border-[#0A1128]/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-black text-[#0A1128]">
              {ehMaximo
                ? 'Você chegou ao topo'
                : `Próximo marco: ${dados.proximoElo?.nome ?? ''}`}
            </h4>
            <p className="mt-0.5 text-xs font-medium text-[#0A1128]/60">
              {ehMaximo
                ? 'Seu XP continua acumulando em quizzes válidos, sem limite máximo.'
                : 'Conclua quizzes que concedem XP para chegar ao próximo elo.'}
            </p>
          </div>
          <span className="rounded-full bg-[#FFF7ED] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#EA580C]">
            {ehMaximo
              ? 'SEM PRÓXIMO ELO'
              : `${formatar(dados.xpFaltanteProximoElo)} XP RESTANTES`}
          </span>
        </div>

        <div
          role="progressbar"
          aria-label={
            ehMaximo
              ? 'Progresso no elo máximo Staff do serviço'
              : `Progresso para o elo ${dados.proximoElo?.nome ?? ''}`
          }
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={ehMaximo ? 100 : dados.percentualElo}
          className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#0A1128]/10"
        >
          <div
            className="h-full rounded-full bg-[#EA580C] transition-all duration-700 ease-out"
            style={{ width: `${ehMaximo ? 100 : dados.percentualElo}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs font-bold text-[#0A1128]/60">
          <span>{formatar(dados.xpTotal)} XP</span>
          <span className="text-[#0A1128]">
            {dados.proximoElo ? `${formatar(dados.proximoElo.xpMinimo)} XP` : 'Sem limite'}
          </span>
        </div>
      </div>

      {/* Nota informativa de rodape */}
      <div className="flex items-center gap-2.5 rounded-xl bg-[#EFF6FF] px-4 py-3 text-xs font-semibold text-[#0A1128]/75">
        {ehMaximo ? (
          <Info className="h-4 w-4 shrink-0 text-[#059669]" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#059669]" aria-hidden="true" />
        )}
        <span>
          {ehMaximo
            ? 'Staff do serviço é um elo gamificado, não um título profissional.'
            : `O elo ${novoElo.nome} foi registrado como conquista na sua progressão.`}
        </span>
      </div>
    </section>
  );
};

