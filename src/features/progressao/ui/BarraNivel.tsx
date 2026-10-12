import type { ProgressoNivel } from '../types';

type BarraNivelProps = {
  progresso: ProgressoNivel;
  className?: string;
};

const formatar = (valor: number) => valor.toLocaleString('pt-BR');

/**
 * Barra de progresso de nivel: mostra o nivel atual, quanto XP ja foi acumulado
 * dentro dele e quanto falta para o proximo nivel.
 */
export const BarraNivel = ({ progresso, className = '' }: BarraNivelProps) => {
  const percentual = Math.min(100, Math.max(0, progresso.percentual));

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-black text-[#0A1128]">Nível {progresso.nivel}</span>
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

      <p className="mt-1.5 text-xs font-semibold text-[#0A1128]/60">
        Faltam {formatar(progresso.xpFaltante)} XP para o nível {progresso.proximoNivel}
      </p>
    </div>
  );
};
