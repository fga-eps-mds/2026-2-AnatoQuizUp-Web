// Servico da progressao do aluno: inicia e conclui rodadas de quiz, consulta o
// nivel atual e o historico de XP recebido.
import { httpClient } from '../../shared/api/httpClient';
import { extractErrorMessage } from '../manage-questions/model/questionService';
import type {
  HistoricoXpResponse,
  IniciarTentativaParams,
  ProgressoNivel,
  ResultadoTentativa,
  TentativaIniciada,
} from './types';

const QUIZ_ENDPOINT = '/quiz';

// POST /quiz/tentativas — inicia uma rodada de ate 10 questoes para o tema/dificuldade.
export const iniciarTentativaQuiz = async (
  params: IniciarTentativaParams,
): Promise<TentativaIniciada> => {
  try {
    const { data } = await httpClient.post<TentativaIniciada>(`${QUIZ_ENDPOINT}/tentativas`, {
      ...(params.tema ? { tema: params.tema } : {}),
      ...(params.dificuldade ? { dificuldade: params.dificuldade } : {}),
    });
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// POST /quiz/tentativas/:id/concluir — fecha a rodada e recebe a recompensa de XP.
// Idempotente no backend: repetir a chamada nao concede XP de novo.
export const concluirTentativaQuiz = async (tentativaId: string): Promise<ResultadoTentativa> => {
  try {
    const { data } = await httpClient.post<ResultadoTentativa>(
      `${QUIZ_ENDPOINT}/tentativas/${tentativaId}/concluir`,
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// GET /quiz/progresso — XP acumulado, nivel e quanto falta para o proximo nivel.
export const buscarProgressoXp = async (): Promise<ProgressoNivel> => {
  try {
    const { data } = await httpClient.get<ProgressoNivel>(`${QUIZ_ENDPOINT}/progresso`);
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// GET /quiz/xp/historico — historico paginado do XP recebido.
export const buscarHistoricoXp = async (
  params: { page?: number; limit?: number } = {},
): Promise<HistoricoXpResponse> => {
  try {
    const { data } = await httpClient.get<HistoricoXpResponse>(`${QUIZ_ENDPOINT}/xp/historico`, {
      params,
    });
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
