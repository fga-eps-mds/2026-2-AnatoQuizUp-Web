// Tipos do cadastro de casos OSCE (US26). Os nomes de campo batem 1:1 com a API
// do Quiz-Service (/casos-osce), sem necessidade de normalizacao.

export type CasoOsceDificuldade = 'FACIL' | 'MEDIA' | 'DIFICIL';
export type CasoOsceStatus = 'RASCUNHO' | 'PUBLICADO';

export type ExameCasoOsce = {
  nome: string;
  resultado: string;
};

// Caso como a API devolve: todo campo de conteudo e opcional (rascunho parcial).
export type CasoOsce = {
  id: string;
  titulo: string | null;
  especialidade: string | null;
  dificuldade: CasoOsceDificuldade | null;
  diagnosticoEsperado: string | null;
  local: string | null;
  papelEstudante: string | null;
  idadePaciente: number | null;
  sexoPaciente: string | null;
  queixaPaciente: string | null;
  perfilPaciente: string | null;
  historiaSintomas: string | null;
  exameFisico: string | null;
  status: CasoOsceStatus;
  exames: ExameCasoOsce[];
  criadoEm: string;
};

// Payload de criacao/edicao: os mesmos campos de conteudo, todos opcionais.
export type SalvarCasoOsce = Partial<Omit<CasoOsce, 'id' | 'status' | 'criadoEm'>>;

// Valores do formulario do editor (um pouco mais amigavel que o DTO da API:
// idade como string pra nao lutar com o input number vazio).
export type CasoOsceFormValues = {
  titulo: string;
  especialidade: string;
  dificuldade: CasoOsceDificuldade | '';
  diagnosticoEsperado: string;
  local: string;
  papelEstudante: string;
  idadePaciente: string;
  sexoPaciente: string;
  queixaPaciente: string;
  perfilPaciente: string;
  historiaSintomas: string;
  exameFisico: string;
  exames: ExameCasoOsce[];
};
