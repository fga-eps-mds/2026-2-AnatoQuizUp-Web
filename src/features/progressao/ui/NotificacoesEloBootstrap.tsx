import { useEffect } from 'react';

import { useAuth } from '../../../app/providers/AuthProvider';
import { useNotificacoesEloStore } from '../model/useNotificacoesEloStore';
import { buscarNotificacoesElo } from '../progressaoService';

/**
 * Componente "bootstrap" sem UI: ao logar como aluno, carrega os avisos de elo ainda
 * nao lidos e os enfileira para o NotificacaoEloModal exibir. Outros papeis nao tem elo.
 */
export const NotificacoesEloBootstrap = () => {
  const { user } = useAuth();
  const adicionarNotificacoes = useNotificacoesEloStore((state) => state.adicionarNotificacoes);
  const limparFila = useNotificacoesEloStore((state) => state.limparFila);

  useEffect(() => {
    if (user?.role !== 'STUDENT') {
      limparFila();
      return;
    }

    let montado = true;

    const carregar = async () => {
      try {
        const naoLidas = await buscarNotificacoesElo(true);

        if (montado) {
          adicionarNotificacoes(naoLidas);
        }
      } catch {
        // Avisos sao complementares: uma falha aqui nao deve atrapalhar a navegacao.
      }
    };

    void carregar();

    return () => {
      montado = false;
    };
  }, [adicionarNotificacoes, limparFila, user?.role]);

  return null;
};
