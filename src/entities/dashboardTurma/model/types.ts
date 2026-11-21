// Tipos de dominio do dashboard de desempenho de turmas (visao do professor).

// Classificacao qualitativa do desempenho em um tema/aluno.
export type StatusDesempenho = 'Tranquilo' | 'Atenção' | 'Crítico';

// Desempenho agregado de um tema (quantas respostas, taxa de acerto e status).
export interface TemaDesempenho {
  nome: string;
  totalRespondidas: number;
  taxaAcerto: number;
  status: StatusDesempenho;
}

// Indicadores macro da turma (totais e desempenho por tema).
export interface DashboardMacro {
  totalAlunos: number;
  totalQuestoesRespondidas: number;
  taxaMediaAcertos: number;
  desempenhoPorTema: TemaDesempenho[];
}

// Desempenho consolidado de um aluno (totais, taxa e detalhe por tema).
export interface DesempenhoAluno {
  alunoId: string;
  totalRespondidas: number;
  totalAcertos: number;
  taxaAcerto: number;
  ultimaAtividade: string | null;
  desempenhoPorTema: TemaDesempenho[];
}

// Visao individual: lista de desempenho de cada aluno da turma.
export interface DashboardIndividual {
  alunos: DesempenhoAluno[];
}

// Desempenho agregado de uma lista publicada (entregas, pendencias, taxa).
export interface DesempenhoLista {
  listaTurmaId: string;
  nomeLista: string;
  totalAlunos: number;
  totalSubmeteram: number;
  totalPendentes: number;
  taxaMediaAcerto: number;
  prazo: string | null;
}

// Desempenho de um aluno em uma lista especifica (status da entrega + acertos).
export type AlunoDesempenhoLista = {
  alunoId: string;
  status: 'SUBMETIDA' | 'NAO_RESPONDEU' | 'EM_ANDAMENTO';
  totalAcertos: number;
  taxaAcerto: number;
  submissaoEm: string | null;
  mensagem: string;
};

// Detalhe de uma lista: total de questoes + desempenho aluno a aluno.
export type DesempenhoListaIndividual = {
  listaTurmaId: string;
  nomeLista: string;
  totalQuestoes: number;
  desempenhoAlunos: AlunoDesempenhoLista[];
};

export type ResultadoQuestaoEntrega = 'ACERTO' | 'ERRO' | 'NAO_RESPONDIDA';

export type DetalheQuestaoEntrega = {
  ordem: number;
  questaoId: string;
  enunciado: string;
  respostaAluno: { alternativa: string; texto: string } | null;
  resultado: ResultadoQuestaoEntrega;
  gabarito: { alternativa: string; texto: string } | null;
};

export type DetalheEntrega = {
  lista: {
    id: string;
    nome: string;
    publicadaEm: string;
  };
  alunoId: string;
  resumo: {
    totalQuestoes: number;
    acertos: number;
    erros: number;
    naoRespondidas: number;
    taxaAcerto: number;
  };
  questoes: DetalheQuestaoEntrega[];
};

export type StatusResultadoTema = 'SUBMETIDA' | 'EM_ANDAMENTO' | 'NAO_RESPONDEU';

export type ResultadoTemaLista = {
  listaTurmaId: string;
  nomeLista: string;
  publicadaEm: string;
  status: StatusResultadoTema;
  acertos: number | null;
  totalQuestoes: number;
  taxaAcerto: number | null;
  variacaoPp: number | null;
};

export type EvolucaoTema = {
  temaId: string;
  nome: string;
  totalResultadosValidos: number;
  mensagem: string | null;
  resultados: ResultadoTemaLista[];
};

export type EvolucaoTemasAluno = {
  alunoId: string;
  temas: EvolucaoTema[];
};
