import type { ApiQuestionDifficulty } from '../manage-questions';
import type { QuizQuestion } from '../random-quiz/types';

// Tipos da progressao do aluno: rodadas de quiz, XP, nivel e elo.

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

// Codigos de elo de progressao por XP.
export type CodigoEloXp =
  | 'CURIOSO'
  | 'ACADEMICO'
  | 'INTERNO'
  | 'R1'
  | 'R3'
  | 'R6'
  | 'STAFF_DO_SERVICO';

// Definicao de uma faixa de elo.
export type FaixaElo = {
  codigo: CodigoEloXp;
  nome: string;
  ordem: number;
  xpMinimo: number;
  xpMaximo: number | null;
  objetivo: string;
};

// Status de cada elo na tela "Todos os elos".
export type StatusFaixaElo =
  | 'CONQUISTADO'
  | 'ELO_ATUAL'
  | 'PROXIMO_ELO'
  | 'BLOQUEADO'
  | 'ELO_MAXIMO';

// Item da jornada de elos.
export type EloJornada = FaixaElo & {
  status: StatusFaixaElo;
  conquistado: boolean;
  ehAtual: boolean;
  percentual: number;
  xpFaltante: number;
  eloAnteriorNome: string | null;
};

// Nivel/elo atual e progresso ate o proximo (dados da barra de progresso e telas de elo).
export type ProgressoNivel = {
  xpTotal: number;
  nivel: number;
  proximoNivel: number;
  xpNoNivel: number;
  xpNecessarioNoNivel: number;
  xpFaltante: number;
  percentual: number;
  eloAtual?: FaixaElo;
  maiorElo?: FaixaElo;
  proximoElo?: FaixaElo | null;
  xpNoElo?: number;
  xpNecessarioNoElo?: number | null;
  xpFaltanteProximoElo?: number;
  percentualElo?: number;
  todosOsElos?: EloJornada[];
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
  subiuDeElo?: boolean;
  eloAnterior?: FaixaElo;
  novoElo?: FaixaElo;
  xpExcedenteElo?: number;
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
