import { AvatarCosmetico } from '../../../shared/ui/profile-identity-card';
import { EloIcon } from '../../progressao/ui/EloIcon';
import type { LinhaRanking } from '../types';

type RankingRowProps = {
  linha: LinhaRanking;
  rotuloMetrica: string;
};

/** Classe de cor do badge de posicao: ouro/prata/bronze para o top 3, neutro depois. */
const corPosicao = (posicao: number): string => {
  if (posicao === 1) return 'bg-[#F59E0B] text-white';
  if (posicao === 2) return 'bg-[#94A3B8] text-white';
  if (posicao === 3) return 'bg-[#B45309] text-white';
  return 'bg-[#0A1128]/5 text-[#0A1128]/70';
};

/**
 * Linha do ranking (fora do podio): posicao, avatar, nome/nickname, nivel, elo,
 * metrica principal (XP ou acertos) e taxa. Destaca visualmente a linha do
 * proprio usuario com o selo "Você".
 */
export const RankingRow = ({ linha, rotuloMetrica }: RankingRowProps) => {
  const destaque = linha.destaque;

  return (
    <article
      className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors sm:gap-4 sm:p-4 ${
        destaque
          ? 'border-[#00A88F] bg-[#71edc8]/10 ring-1 ring-[#00A88F]'
          : 'border-[#0A1128]/10 bg-white hover:bg-[#F8FAFC]'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black tabular-nums sm:h-10 sm:w-10 ${corPosicao(
          linha.posicao,
        )}`}
      >
        {linha.posicao}
      </span>

      <div className="shrink-0">
        <AvatarCosmetico identidade={{ nome: linha.nome }} cosmeticos={linha.cosmeticos} tamanho="sm" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-black text-[#0A1128] sm:text-base">{linha.nome}</h3>
          {linha.nivel !== undefined && (
            <span className="shrink-0 rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#7C3AED]">
              Nível {linha.nivel}
            </span>
          )}
          {linha.elo && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-black text-[#EA580C]">
              <EloIcon elo={linha.elo} size={11} className="text-[#EA580C]" />
              {linha.elo}
            </span>
          )}
          {destaque && (
            <span className="shrink-0 rounded-full bg-[#00A88F] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
              Você
            </span>
          )}
        </div>
        <p className="truncate text-xs font-semibold text-[#0A1128]/50">
          {linha.nickname ? `@${linha.nickname}` : linha.detalhe ?? 'Sem nickname'}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end">
        <span className="text-lg font-black leading-none text-[#00A88F] tabular-nums sm:text-xl">
          {(linha.pontuacao ?? linha.totalAcertos).toLocaleString('pt-BR')}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#0A1128]/40">
          {rotuloMetrica}
        </span>
      </div>

      <div className="hidden w-16 shrink-0 flex-col items-end sm:flex">
        <span className="text-sm font-black leading-none text-[#0A1128] tabular-nums">
          {linha.taxaAcerto}%
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#0A1128]/40">
          acerto
        </span>
      </div>
    </article>
  );
};
