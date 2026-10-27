// Servico do historico de quiz do aluno: lista as questoes ja respondidas, com
// paginacao e filtros opcionais por tema e dificuldade.
import { httpClient } from '../../shared/api/httpClient';
import type { HistoricoQuizResponse } from './types';

// Parametros da busca de historico (paginacao + filtros de tema/dificuldade).
export type BuscarHistoricoParams = {
  page: number;
  limit: number;
  tema?: string;
  dificuldade?: string;
  somenteErros?: boolean;
};

// GET /quiz/historico — busca o historico paginado/filtrado de respostas do aluno.
export const buscarHistoricoQuiz = async (params: BuscarHistoricoParams): Promise<HistoricoQuizResponse> => {
  const { data } = await httpClient.get<HistoricoQuizResponse>('/quiz/historico', { params });
  return data;
};
