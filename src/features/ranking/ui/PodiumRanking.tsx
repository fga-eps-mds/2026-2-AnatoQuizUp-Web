import { Crown } from 'lucide-react';

import { AvatarCosmetico } from '../../../shared/ui/profile-identity-card';
import type { LinhaRanking } from '../types';

type PodiumRankingProps = {
  linhas: LinhaRanking[];
  rotuloMetrica: string;
};

// Configuracao visual de cada degrau do podio (altura, cor do anel/medalha e rotulo).
type DegrauConfig = {
  altura: string;
  anel: string;
  medalha: string;
  rotulo: string;
};

// 1o lugar e o mais alto e dourado; 2o prata; 3o bronze.
const CONFIG_DEGRAU: Record<1 | 2 | 3, DegrauConfig> = {
  1: {
    altura: 'h-28',
    anel: 'ring-[#F59E0B]',
    medalha: 'bg-[#F59E0B]',
    rotulo: '1º',
  },
  2: {
    altura: 'h-20',
    anel: 'ring-[#94A3B8]',
    medalha: 'bg-[#94A3B8]',
    rotulo: '2º',
  },
  3: {
    altura: 'h-16',
    anel: 'ring-[#B45309]',
    medalha: 'bg-[#B45309]',
    rotulo: '3º',
  },
};

/** Um degrau do podio: avatar, nome (com nivel e selo "Você") e o bloco com posicao e metrica. */
const Degrau = ({
  linha,
  rotuloMetrica,
}: {
  linha: LinhaRanking;
  rotuloMetrica: string;
}) => {
  const config = CONFIG_DEGRAU[linha.posicao as 1 | 2 | 3];
  const ehPrimeiro = linha.posicao === 1;

  return (
    <div className="flex w-full flex-col items-center justify-end gap-3">
      <div className="flex flex-col items-center gap-2">
        {ehPrimeiro && <Crown className="text-[#F59E0B]" size={24} aria-hidden="true" />}
        <div className={`rounded-full ring-2 ring-offset-2 ${config.anel}`}>
          <AvatarCosmetico
            identidade={{ nome: linha.nome, usuarioId: linha.id, preferirAvatarCerebro: linha.destaque }}
            cosmeticos={linha.cosmeticos}
            tamanho="sm"
          />
        </div>
        <div className="flex max-w-[8rem] flex-col items-center text-center">
          <span className="flex items-center gap-1">
            <span className="truncate text-sm font-black text-[#0A1128]">{linha.nome}</span>
          </span>
          {linha.nivel !== undefined && (
            <span className="text-[10px] font-black uppercase tracking-wide text-[#7C3AED]">
              Nível {linha.nivel}
            </span>
          )}
          {linha.destaque && (
            <span className="rounded-full bg-[#00A88F] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
              Você
            </span>
          )}
        </div>
      </div>

      <div
        className={`flex w-full flex-col items-center justify-start rounded-t-2xl bg-white pt-3 shadow-sm ${config.altura} border border-b-0 border-[#0A1128]/10`}
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white ${config.medalha}`}
        >
          {config.rotulo}
        </span>
        <span className="mt-1 text-xl font-black leading-none text-[#00A88F] tabular-nums">
          {(linha.pontuacao ?? linha.totalAcertos).toLocaleString('pt-BR')}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wide text-[#0A1128]/40">
          {rotuloMetrica}
        </span>
      </div>
    </div>
  );
};

/**
 * Podio do ranking (top 3): 2o a esquerda, 1o ao centro (mais alto) e 3o a direita.
 * Sem ao menos o 1o colocado, nada e renderizado.
 */
export const PodiumRanking = ({ linhas, rotuloMetrica }: PodiumRankingProps) => {
  // Localiza as tres primeiras posicoes.
  const primeiro = linhas.find((linha) => linha.posicao === 1);
  const segundo = linhas.find((linha) => linha.posicao === 2);
  const terceiro = linhas.find((linha) => linha.posicao === 3);

  if (!primeiro) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#0A1128]/10 bg-gradient-to-b from-[#71edc8]/15 to-white p-5 shadow-sm">
      {/* Ordem visual dos degraus: 2o, 1o (centro) e 3o. */}
      <div className="mx-auto grid max-w-md grid-cols-3 items-end gap-2 sm:gap-4">
        <div className="flex items-end">{segundo && <Degrau linha={segundo} rotuloMetrica={rotuloMetrica} />}</div>
        <div className="flex items-end">{<Degrau linha={primeiro} rotuloMetrica={rotuloMetrica} />}</div>
        <div className="flex items-end">{terceiro && <Degrau linha={terceiro} rotuloMetrica={rotuloMetrica} />}</div>
      </div>
    </div>
  );
};
