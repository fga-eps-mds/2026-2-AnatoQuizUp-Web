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

// Estado do elo quanto a inatividade do aluno (US #89).
export type EstadoElo = 'ATIVO' | 'EM_RISCO' | 'REBAIXADO';

// Nivel/elo atual e progresso ate o proximo (dados da barra de progresso e telas de elo).
export type ProgressoNivel = {
  xpTotal: number;
  // Pontuacao que define o elo: sobe com o XP total, mas cai no rebaixamento por inatividade.
  xpElo?: number;
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
  // Inatividade: estado do elo, contagem de dias e prazo do proximo rebaixamento.
  estadoElo?: EstadoElo;
  diasInatividade?: number;
  // Limiar configurado do aviso preventivo (o administrador pode mudar).
  diasParaAviso?: number;
  ultimaAtividadeEm?: string | null;
  prazoRebaixamentoEm?: string | null;
};

// Tipos de evento do historico de progressao de elo.
export type TipoEventoElo = 'PROMOCAO' | 'REBAIXAMENTO' | 'RECUPERACAO';

// Linha do historico de elo (GET /quiz/progressao/elo/historico).
export type EventoElo = {
  id: string;
  data: string;
  tipo: TipoEventoElo;
  eloAnterior: FaixaElo;
  eloNovo: FaixaElo;
  xpEloAntes: number;
  xpEloDepois: number;
  diasInatividade: number | null;
};

export type HistoricoEloResponse = {
  dados: EventoElo[];
  metadados: { page: number; limit: number; total: number; totalPages: number };
};

// Tipos de aviso de elo enviados ao aluno.
export type TipoNotificacaoElo =
  | 'AVISO_PREVENTIVO'
  | 'ELO_EM_RISCO'
  | 'VESPERA_REBAIXAMENTO'
  | 'ELO_REBAIXADO'
  | 'ELO_RECUPERADO';

// Aviso de elo do proprio aluno (GET /quiz/progressao/notificacoes).
export type NotificacaoElo = {
  id: string;
  data: string;
  tipo: TipoNotificacaoElo;
  titulo: string;
  mensagem: string;
  eloRelacionado: CodigoEloXp | null;
  prazoRebaixamentoEm: string | null;
  lida: boolean;
};

// Resultado de concluir uma rodada. jaConcluida indica chamada repetida (sem XP novo).
export type ResultadoTentativa = {
  missoesConcluidas?: { nome: string; recompensaXp: number }[];
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
export type OrigemXp = 'QUIZ_CONCLUIDO' | 'MISSAO_CONCLUIDA';

// Linha do historico de XP: data, origem, quiz relacionado e valor.
export type HistoricoXpItem = {
  id: string;
  data: string;
  origem: OrigemXp;
  missao?: { codigo: string; nome: string } | null;
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
