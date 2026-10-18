﻿import { ChevronRight } from 'lucide-react';
import type { MouseEvent } from 'react';

import { AchievementMedal, type ConquistaDestacada } from '../../../features/achievements';
import type { ResumoAmizade } from '../../../features/friendship';
import type { SlotsCosmeticos } from '../../../shared/ui/profile-identity-card';
import { AvatarCosmetico } from '../../../shared/ui/profile-identity-card';

export type CardAmigoProps = {
  amizade: ResumoAmizade;
  cosmeticos: SlotsCosmeticos;
  conquistasDestacadas?: ConquistaDestacada[];
  processando: boolean;
  onVerPerfil: () => void;
  onDesfazer: (event: MouseEvent<HTMLButtonElement>) => void;
};

// Plano de fundo padrao do painel lateral quando o amigo nao tem um equipado.
const FUNDO_PADRAO = 'linear-gradient(135deg, #e8f9f4 0%, #c5f5e7 100%)';

/**
 * Cartao de um amigo na lista de amizades: avatar com cosmeticos, nome/nickname,
 * curso, conquistas em destaque e acoes (ver perfil / desfazer amizade).
 */
export const CardAmigo = ({
  amizade,
  cosmeticos,
  conquistasDestacadas = [],
  processando,
  onVerPerfil,
  onDesfazer,
}: CardAmigoProps) => {
  const { amigo } = amizade;
  const fundo = cosmeticos.PLANO_FUNDO;
  const titulo = cosmeticos.TITULO;

  // Linha de curso/semestre montada a partir dos campos disponiveis.
  const cursoLabel = [
    amigo.curso,
    amigo.semestre && `${amigo.semestre}° semestre`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      onClick={onVerPerfil}
      tabIndex={0}
      onKeyDown={(event) => {
        // Acessibilidade: Enter/Espaco no proprio cartao tambem abrem o perfil.
        if (
          event.target === event.currentTarget &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          onVerPerfil();
        }
      }}
      className="group relative z-0 flex min-h-[160px] cursor-pointer overflow-visible rounded-2xl border border-[#0A1128]/10 bg-white shadow-sm transition-shadow hover:z-20 hover:shadow-md focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]"
    >
      {/* Painel lateral colorido com o fundo do amigo */}
      <div
        className="flex w-24 shrink-0 items-center justify-center rounded-l-2xl sm:w-28"
        style={{ background: fundo?.valor ?? FUNDO_PADRAO }}
      >
        <AvatarCosmetico
          identidade={{ nome: amigo.nome, usuarioId: amigo.id, nickname: amigo.nickname }}
          cosmeticos={cosmeticos}
          tamanho="md"
        />
      </div>

      {/* Conteudo a direita */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <div className="min-w-0">
          {titulo ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#B45309]">
              <span aria-hidden="true">🏆</span>
              <span>{titulo.nome}</span>
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-gray-400">
              Sem título equipado
            </span>
          )}

          <h4 className="mt-1 truncate text-base font-black text-[#0A1128]">
            {amigo.nome}
          </h4>

          <p className="text-sm font-semibold text-[#0A1128]/55">
            {amigo.nickname ? `@${amigo.nickname}` : 'Sem nickname'}
          </p>

          {cursoLabel && (
            <p className="mt-0.5 truncate text-xs font-semibold text-[#0A1128]/45">
              {cursoLabel}
            </p>
          )}

          {/* Conquistas em destaque inline (apenas no mobile). */}
          {conquistasDestacadas.length > 0 && (
            <div className="mt-3 flex gap-2 sm:hidden" aria-label="Conquistas em destaque">
              {conquistasDestacadas.slice(0, 3).map((conquista) => (
                <AchievementMedal
                  key={conquista.desbloqueioId}
                  tipo={conquista.tipoConquista}
                  tier={conquista.tier}
                  destacada
                  tamanho="sm"
                  nome={conquista.nome}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onVerPerfil();
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-[#0A1128]/15 px-3 py-2 text-xs font-black text-[#0A1128] transition hover:bg-[#F8FAFC]"
          >
            Ver perfil
            <ChevronRight size={14} />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDesfazer(event);
            }}
            disabled={processando}
            className="inline-flex items-center rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[#0A1128]/10 disabled:text-[#0A1128]/40"
          >
            {processando ? 'Removendo...' : 'Desfazer amizade'}
          </button>
        </div>
      </div>

      {/* Overlay (desktop) com as conquistas em destaque, revelado no hover/foco do cartao. */}
      {conquistasDestacadas.length > 0 && (
        <div className="pointer-events-none absolute inset-x-3 bottom-full z-30 mb-2 hidden translate-y-2 rounded-xl border border-[#E2E8F0] bg-white/95 p-3 opacity-0 shadow-xl backdrop-blur transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 sm:block">
          <p className="mb-2 text-[10px] font-black uppercase text-[#64748B]">
            Conquistas em destaque
          </p>

          <div className="flex gap-3">
            {conquistasDestacadas.slice(0, 3).map((conquista) => (
              <div
                key={conquista.desbloqueioId}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <AchievementMedal
                  tipo={conquista.tipoConquista}
                  tier={conquista.tier}
                  destacada
                  tamanho="sm"
                  nome={conquista.nome}
                />

                <span className="line-clamp-2 text-[10px] font-black leading-3 text-[#0A1128]">
                  {conquista.nome}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
