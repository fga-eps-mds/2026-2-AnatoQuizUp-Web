import { CheckCircle2, ShieldAlert, TriangleAlert } from 'lucide-react';

import { diasAtePrazo, formatarDataPrazo } from '../eloUtils';
import type { EstadoElo, FaixaElo } from '../types';

type AvisoInatividadeBannerProps = {
  estadoElo: EstadoElo;
  diasInatividade: number;
  // Limiar configurado do aviso preventivo, vindo do backend.
  diasParaAviso: number;
  prazoRebaixamentoEm: string | null;
  eloAtual: FaixaElo;
  maiorElo: FaixaElo;
  onFazerQuiz?: () => void;
};

// Aparencia e texto de cada estado. Telas 1 ("Aviso preventivo"), 2 ("Elo em risco")
// e 3 ("Elo rebaixado") do Figma.
type Aparencia = {
  rotulo: string;
  titulo: string;
  borda: string;
  fundo: string;
  cor: string;
  Icone: typeof TriangleAlert;
};

const APARENCIA: Record<Exclude<EstadoElo, 'ATIVO'>, Aparencia> = {
  EM_RISCO: {
    rotulo: 'ELO EM RISCO',
    titulo: 'Seu elo está em risco',
    borda: 'border-[#F59E0B]/35',
    fundo: 'bg-[#FFFBEB]',
    cor: 'text-[#B45309]',
    Icone: TriangleAlert,
  },
  REBAIXADO: {
    rotulo: 'ELO REBAIXADO',
    titulo: 'Seu elo foi rebaixado por inatividade',
    borda: 'border-[#F43F5E]/35',
    fundo: 'bg-[#FFF1F2]',
    cor: 'text-[#BE123C]',
    Icone: ShieldAlert,
  },
};

const APARENCIA_PREVENTIVA: Aparencia = {
  rotulo: 'ATENÇÃO AO SEU ELO',
  titulo: 'Seu elo precisa de atenção',
  borda: 'border-[#DBEAFE]',
  fundo: 'bg-[#EFF6FF]',
  cor: 'text-[#1D4ED8]',
  Icone: TriangleAlert,
};

/**
 * Faixa de aviso de inatividade exibida acima da progressao do aluno.
 *
 * Nao renderiza nada quando o elo esta ativo e dentro do prazo de aviso: a US so pede
 * aviso a partir do periodo preventivo.
 */
export const AvisoInatividadeBanner = ({
  estadoElo,
  diasInatividade,
  diasParaAviso,
  prazoRebaixamentoEm,
  eloAtual,
  maiorElo,
  onFazerQuiz,
}: AvisoInatividadeBannerProps) => {
  // Aviso preventivo: ainda ATIVO, mas ja alcancou o limiar configurado de dias.
  const preventivo = estadoElo === 'ATIVO' && diasInatividade >= diasParaAviso;

  if (estadoElo === 'ATIVO' && !preventivo) {
    return null;
  }

  const aparencia = estadoElo === 'ATIVO' ? APARENCIA_PREVENTIVA : APARENCIA[estadoElo];
  const { Icone } = aparencia;
  const diasRestantes = diasAtePrazo(prazoRebaixamentoEm);
  const dataPrazo = formatarDataPrazo(prazoRebaixamentoEm);
  const perdeuElo = maiorElo.ordem > eloAtual.ordem;

  const mensagem =
    estadoElo === 'REBAIXADO'
      ? `Você ficou ${diasInatividade} dias sem concluir um quiz válido. Seu XP total e o maior elo conquistado (${maiorElo.nome}) foram preservados — conclua quizzes para recuperar o elo.`
      : `Você está há ${diasInatividade} dias sem concluir um quiz que concede XP. Conclua um quiz para manter o elo ${eloAtual.nome} ativo.`;

  return (
    <output
      aria-label={aparencia.titulo}
      className={`flex w-full flex-wrap items-start justify-between gap-4 rounded-2xl border ${aparencia.borda} ${aparencia.fundo} p-5`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Icone className={`mt-0.5 h-5 w-5 shrink-0 ${aparencia.cor}`} aria-hidden="true" />
        <div className="min-w-0">
          <p className={`text-[11px] font-black uppercase tracking-wider ${aparencia.cor}`}>
            {aparencia.rotulo}
          </p>
          <h3 className="mt-0.5 text-base font-black text-[#0A1128]">{aparencia.titulo}</h3>
          <p className="mt-1 text-xs font-medium text-[#0A1128]/70">{mensagem}</p>

          {dataPrazo && (
            <p className="mt-2 text-xs font-black text-[#0A1128]">
              {estadoElo === 'REBAIXADO'
                ? `Próximo rebaixamento em ${dataPrazo}`
                : `Prazo para agir: ${dataPrazo}`}
              {diasRestantes !== null && ` · ${diasRestantes} dia(s) restante(s)`}
            </p>
          )}

          {perdeuElo && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#059669]">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Maior elo preservado: {maiorElo.nome}
            </p>
          )}
        </div>
      </div>

      {onFazerQuiz && (
        <button
          type="button"
          onClick={onFazerQuiz}
          className="shrink-0 rounded-xl bg-[#EA580C] px-5 py-2.5 text-xs font-black text-white shadow-sm transition-colors hover:bg-[#C2410C]"
        >
          Fazer um quiz
        </button>
      )}
    </output>
  );
};
