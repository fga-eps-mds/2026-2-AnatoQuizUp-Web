// Tipos do dominio do historico de quiz do aluno.

// Quantas vezes cada alternativa foi escolhida (letra -> contagem).
export type DistribuicaoAlternativas = Record<string, number>;

// Detalhe da questao tal como aparece no historico (com gabarito e explicacao).
export type HistoricoQuestaoDetalhe = {
  tema: {
    id: string;
    nome: string;
  };
  enunciado: string;
  tipoQuestao: string;
  respostaCorreta: string;
  dificuldade: string;
  saibaMais: string | null;
  urlImagem?: string | null;
  alternativas: Record<string, string> | null;
};

// Um registro de resposta no historico (questao + resposta marcada + metadados).
export type ItemHistoricoQuiz = {
  id: string;
  criadoEm: string;
  respostaMarcada: string;
  questaoId: string;
  tentativas: number;
  distribuicao: DistribuicaoAlternativas;
  questao: HistoricoQuestaoDetalhe;
};

// Resposta paginada do historico de quiz.
export type HistoricoQuizResponse = {
  dados: ItemHistoricoQuiz[];
  metadados: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
