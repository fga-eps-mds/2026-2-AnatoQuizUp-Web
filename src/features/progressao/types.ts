import type { ApiQuestionDifficulty } from '../manage-questions';
import type { QuizQuestion } from '../random-quiz/types';

// Tipos da progressao do aluno: rodadas de quiz, XP e nivel.

// Filtros para iniciar uma rodada (os mesmos da tela de escolha do quiz).
export type IniciarTentativaParams = {
  tema?: string;
  dificuldade?: ApiQuestionDifficulty;
};

// Rodada criada pelo backend: id para amarrar as respostas e as questoes sorteadas.
export type TentativaIniciada = {
  tentativaId: string;
  totalQuestoes: number;
  questoes: QuizQuestion[];
};

// Detalhamento do XP recebido em uma rodada.
export type RecompensaXp = {
  xpBase: number;
  bonusDesempenho: number;
  bonusPowerUp: number;
  xpTotalRecebido: number;
};

// Nivel atual e progresso ate o proximo (dados da barra de progresso).
export type ProgressoNivel = {
  xpTotal: number;
  nivel: number;
  proximoNivel: number;
  xpNoNivel: number;
  xpNecessarioNoNivel: number;
  xpFaltante: number;
  percentual: number;
};

// Resultado de concluir uma rodada. jaConcluida indica chamada repetida (sem XP novo).
export type ResultadoTentativa = {
  tentativaId: string;
  tema: string | null;
  dificuldade: ApiQuestionDifficulty | null;
  totalQuestoes: number;
  totalAcertos: number;
  jaConcluida: boolean;
  recompensa: RecompensaXp;
  progresso: ProgressoNivel;
  subiuDeNivel: boolean;
  nivelAnterior: number;
};

// Origens possiveis de XP (hoje, apenas a conclusao de quiz).
export type OrigemXp = 'QUIZ_CONCLUIDO';

// Linha do historico de XP: data, origem, quiz relacionado e valor.
export type HistoricoXpItem = {
  id: string;
  data: string;
  origem: OrigemXp;
  quiz: {
    tentativaId: string;
    tema: string | null;
    dificuldade: ApiQuestionDifficulty | null;
    totalQuestoes: number;
    totalAcertos: number;
  } | null;
  xpBase: number;
  bonusDesempenho: number;
  bonusPowerUp: number;
  valor: number;
};

export type HistoricoXpResponse = {
  dados: HistoricoXpItem[];
  metadados: { page: number; limit: number; total: number; totalPages: number };
};
