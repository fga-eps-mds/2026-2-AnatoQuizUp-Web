// Store global (Zustand) da fila de avisos de elo (inatividade, rebaixamento e
// recuperacao). Segue o mesmo desenho da fila de conquistas: um aviso na tela por vez,
// os demais aguardam. Marcar como lido e delegado a quem fecha o aviso.
import { create } from 'zustand';

import type { NotificacaoElo } from '../types';

type NotificacoesEloState = {
  fila: NotificacaoElo[];
  notificacaoAtual: NotificacaoElo | null;
  adicionarNotificacoes: (notificacoes: NotificacaoElo[]) => void;
  avancarFila: () => void;
  limparFila: () => void;
};

export const useNotificacoesEloStore = create<NotificacoesEloState>((set) => ({
  fila: [],
  notificacaoAtual: null,
  // Enfileira avisos novos; sem nada em exibicao, o primeiro vai direto para a tela.
  adicionarNotificacoes: (notificacoes) =>
    set((state) => {
      if (notificacoes.length === 0) return state;

      // Evita exibir duas vezes o mesmo aviso (recarga de pagina, refetch).
      const conhecidos = new Set(
        [state.notificacaoAtual?.id, ...state.fila.map((aviso) => aviso.id)].filter(Boolean),
      );
      const novos = notificacoes.filter((aviso) => !conhecidos.has(aviso.id));

      if (novos.length === 0) return state;

      if (!state.notificacaoAtual) {
        const [notificacaoAtual, ...fila] = novos;
        return { notificacaoAtual: notificacaoAtual ?? null, fila };
      }

      return { fila: [...state.fila, ...novos] };
    }),
  // Fecha o aviso atual e promove o proximo da fila (se houver).
  avancarFila: () =>
    set((state) => {
      const [notificacaoAtual, ...fila] = state.fila;
      return { notificacaoAtual: notificacaoAtual ?? null, fila };
    }),
  limparFila: () => set({ notificacaoAtual: null, fila: [] }),
}));
