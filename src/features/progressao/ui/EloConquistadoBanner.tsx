import { CheckCircle2, Info } from 'lucide-react';

import { resolverDadosEloProgresso } from '../eloUtils';
import type { FaixaElo, ProgressoNivel } from '../types';
import { EloIcon } from './EloIcon';

type EloConquistadoBannerProps = {
  novoElo: FaixaElo;
  xpRecebido: number;
  xpExcedente: number;
  progresso: ProgressoNivel;
  onContinuar: () => void;
  onVerJornada: () => void;
};

type TextosConquistaElo = {
  titulo: string;
  subtituloCabecalho: string;
  seloCelebracao: string;
  descricaoCelebracao: string;
  detalheXpTotal: string;
  valorProximoElo: string;
  detalheProximoElo: string;
  tituloMarco: string;
  subtituloMarco: string;
  seloMarco: string;
  ariaLabelBarra: string;
  percentualBarra: number;
  rotuloLimiteBarra: string;
  notaRodape: string;
};

const formatar = (valor: number) => valor.toLocaleString('pt-BR');

const criarTextosEloMaximo = (xpTotal: number): TextosConquistaElo => ({
  titulo: 'Elo máximo alcançado',
  subtituloCabecalho: 'O XP continua acumulando mesmo após o último elo.',
  seloCelebracao: 'ELO MÁXIMO ALCANÇADO',
  descricaoCelebracao: `Você alcançou ${formatar(xpTotal)} XP de elo. Este é o maior marco da progressão.`,
  detalheXpTotal: 'XP histórico preservado',
  valorProximoElo: 'Não há',
  detalheProximoElo: 'Elo máximo disponível',
  tituloMarco: 'Você chegou ao topo',
  subtituloMarco: 'Seu XP continua acumulando em quizzes válidos, sem limite máximo.',
  seloMarco: 'SEM PRÓXIMO ELO',
  ariaLabelBarra: 'Progresso no elo máximo Staff do serviço',
  percentualBarra: 100,
  rotuloLimiteBarra: 'Sem limite',
  notaRodape: 'Staff do serviço é um elo gamificado, não um título profissional.',
});

const criarTextosNovoElo = (
  novoElo: FaixaElo,
  xpRecebido: number,
  xpExcedente: number,
  xpTotal: number,
  proximoElo: FaixaElo,
  xpFaltanteProximoElo: number,
  percentualElo: number,
): TextosConquistaElo => ({
  titulo: 'Novo elo conquistado',
  subtituloCabecalho: 'Seu XP de elo alcançou a próxima faixa automaticamente.',
  seloCelebracao: 'NOVO ELO CONQUISTADO',
  descricaoCelebracao: `Você recebeu ${formatar(xpRecebido)} XP e chegou a ${formatar(xpTotal)} XP de elo. Os ${formatar(xpExcedente)} XP excedentes foram mantidos.`,
  detalheXpTotal: 'Nenhum XP foi perdido',
  valorProximoElo: proximoElo.nome,
  detalheProximoElo: `Faltam ${formatar(xpFaltanteProximoElo)} XP`,
  tituloMarco: `Próximo marco: ${proximoElo.nome}`,
  subtituloMarco: 'Conclua quizzes que concedem XP para chegar ao próximo elo.',
  seloMarco: `${formatar(xpFaltanteProximoElo)} XP RESTANTES`,
  ariaLabelBarra: `Progresso para o elo ${proximoElo.nome}`,
  percentualBarra: percentualElo,
  rotuloLimiteBarra: `${formatar(proximoElo.xpMinimo)} XP`,
  notaRodape: `O elo ${novoElo.nome} foi registrado como conquista na sua progressão.`,
});

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
  const proximoElo = novoElo.codigo === 'STAFF_DO_SERVICO' ? null : dados.proximoElo;
  const ehMaximo = proximoElo === null;

  const textos = proximoElo
    ? criarTextosNovoElo(
        novoElo,
        xpRecebido,
        xpExcedente,
        dados.xpTotal,
        proximoElo,
        dados.xpFaltanteProximoElo,
        dados.percentualElo,
      )
    : criarTextosEloMaximo(dados.xpTotal);

  return (
    <section aria-label={textos.titulo} className="flex w-full flex-col gap-5">
      {/* Cabecalho da tela de conquista de elo */}
      <header className="rounded-2xl border border-[#0A1128]/10 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-wider text-[#EA580C]">
          RANKING / ELOS
        </p>
        <h2 className="mt-1 text-2xl font-black text-[#0A1128]">{textos.titulo}</h2>
        <p className="mt-0.5 text-sm font-medium text-[#0A1128]/60">{textos.subtituloCabecalho}</p>
      </header>

      {/* Card principal de celebracao */}
      <output className="flex flex-col items-center rounded-2xl border border-[#10B981]/25 bg-[#ECFDF5] p-6 text-center shadow-sm sm:p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#0A1128] shadow-sm">
          <EloIcon elo={novoElo.codigo} size={32} />
        </div>

        <span className="mt-4 text-[11px] font-black uppercase tracking-wider text-[#059669]">
          {textos.seloCelebracao}
        </span>

        <h3 className="mt-1 text-3xl font-black text-[#0A1128]">{novoElo.nome}</h3>

        <p className="mt-2 max-w-lg text-sm font-medium text-[#0A1128]/70">
          {textos.descricaoCelebracao}
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
      </output>

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
          <p className="mt-1 text-xs font-medium text-[#0A1128]/50">{textos.detalheXpTotal}</p>
        </article>

        <article className="rounded-2xl border border-[#0A1128]/10 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#0A1128]/55">Próximo elo</p>
          <p className="mt-1 text-xl font-black text-[#EA580C]">{textos.valorProximoElo}</p>
          <p className="mt-1 text-xs font-medium text-[#0A1128]/50">{textos.detalheProximoElo}</p>
        </article>
      </div>

      {/* Card de barra do proximo marco ou topo alcancado */}
      <div className="rounded-2xl border border-[#0A1128]/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-black text-[#0A1128]">{textos.tituloMarco}</h4>
            <p className="mt-0.5 text-xs font-medium text-[#0A1128]/60">{textos.subtituloMarco}</p>
          </div>
          <span className="rounded-full bg-[#FFF7ED] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#EA580C]">
            {textos.seloMarco}
          </span>
        </div>

        <progress
          aria-label={textos.ariaLabelBarra}
          value={textos.percentualBarra}
          max={100}
          className="mt-4 block h-2.5 w-full appearance-none overflow-hidden rounded-full bg-[#0A1128]/10 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-[#EA580C] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[#0A1128]/10 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[#EA580C] [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-700 [&::-webkit-progress-value]:ease-out"
        />

        <div className="mt-2 flex items-center justify-between text-xs font-bold text-[#0A1128]/60">
          <span>{formatar(dados.xpTotal)} XP</span>
          <span className="text-[#0A1128]">{textos.rotuloLimiteBarra}</span>
        </div>
      </div>

      {/* Nota informativa de rodape */}
      <div className="flex items-center gap-2.5 rounded-xl bg-[#EFF6FF] px-4 py-3 text-xs font-semibold text-[#0A1128]/75">
        {ehMaximo ? (
          <Info className="h-4 w-4 shrink-0 text-[#059669]" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#059669]" aria-hidden="true" />
        )}
        <span>{textos.notaRodape}</span>
      </div>
    </section>
  );
};

