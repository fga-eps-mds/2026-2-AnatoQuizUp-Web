import { resolverDadosEloProgresso } from '../eloUtils';
import type { ProgressoNivel } from '../types';
import { EloIcon } from './EloIcon';

type BarraNivelProps = {
  progresso: ProgressoNivel;
  className?: string;
};

const formatar = (valor: number) => valor.toLocaleString('pt-BR');

/**
 * Barra de progresso de nivel e elo: mostra o nivel atual, o elo atual, quanto XP
 * ja foi acumulado e quanto falta para o proximo nivel e para o proximo elo.
 */
export const BarraNivel = ({ progresso, className = '' }: BarraNivelProps) => {
  const percentual = Math.min(100, Math.max(0, progresso.percentual));
  const dadosElo = resolverDadosEloProgresso(progresso);

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-[#0A1128]">Nível {progresso.nivel}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7ED] px-2.5 py-0.5 text-xs font-black text-[#EA580C]">
            <EloIcon elo={dadosElo.eloAtual.codigo} size={13} className="text-[#EA580C]" />
            {dadosElo.eloAtual.nome}
          </span>
        </div>
        <span className="text-xs font-bold tabular-nums text-[#0A1128]/60">
          {formatar(progresso.xpNoNivel)} / {formatar(progresso.xpNecessarioNoNivel)} XP
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={`Progresso para o nível ${progresso.proximoNivel}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentual}
        className="h-2.5 w-full overflow-hidden rounded-full bg-[#0A1128]/10"
      >
        <div
          className="h-full rounded-full bg-[#7C3AED] transition-all duration-700 ease-out"
          style={{ width: `${percentual}%` }}
        />
      </div>

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#0A1128]/60">
        <span>
          Faltam {formatar(progresso.xpFaltante)} XP para o nível {progresso.proximoNivel}
        </span>
        <span>
          {dadosElo.proximoElo
            ? `Faltam ${formatar(dadosElo.xpFaltanteProximoElo)} XP para ${dadosElo.proximoElo.nome}`
            : 'Elo máximo alcançado'}
        </span>
      </div>
    </div>
  );
};
