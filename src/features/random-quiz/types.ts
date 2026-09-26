import type {
  QuestionTopic,
  ApiQuestionType,
  ApiQuestionDifficulty,
  QuestionAlternativeKey,
  PaginationMetadata,
  QuestionAlternatives,
} from "../manage-questions";
import type { ConquistaDesbloqueada } from "../achievements";

// Tipos do dominio do quiz avulso (random-quiz).

// Questao exibida no quiz, ja no formato consumido pela tela.
export type QuizQuestion = {
  id: string;
  tema: QuestionTopic;
  enunciado: string;
  tipo: ApiQuestionType;
  dificuldade: ApiQuestionDifficulty;
  imagem: string | null;
  alternativas: QuestionAlternatives | null;
};

// Resposta paginada da listagem de questoes do quiz.
export type ListQuizQuestionResponse = {
  dados: QuizQuestion[];
  metadados: PaginationMetadata;
};

// Resposta do aluno a uma questao (alternativa marcada).
export type QuestaoQuizAnwser = {
  questaoId: string;
  tipo: ApiQuestionType;
  respostaMarcada: QuestionAlternativeKey;
};

// Feedback retornado apos responder: correcao, recompensas e conquistas desbloqueadas.
export type QuestaoQuizFeedback = {
  correcao: boolean;
  saibaMais: string | null;
  respostaCorreta: QuestionAlternativeKey;
  moedasConcedidas: number;
  saldoMoedas: number;
  moedasJaConcedidas: boolean;
  conquistasDesbloqueadas: ConquistaDesbloqueada[];
  potencializadorAplicado: { nome: string; bonusMoedas: number } | null;
};

// Saldo de moedas (ATP) do aluno.
export type SaldoMoedasResponse = {
  saldoMoedas: number;
};

// Niveis de dificuldade e a contagem de questoes por nivel.
export type Dificuldade = "FACIL" | "MEDIA" | "DIFICIL";
type QuantidadePorDificuldade = Record<Dificuldade, number>;

// Tema com o total de questoes e o detalhamento por dificuldade.
export type QuantidadeQuestoesTema = {
  nome: string;
  totalQuestoes: number;
  porDificuldade: QuantidadePorDificuldade;
};

// Resposta com a contagem de questoes disponiveis por tema.
export type QuantidadeQuestoesTemaResponse = {
  quantidadeDeQuestoesPorTema: QuantidadeQuestoesTema[];
};
