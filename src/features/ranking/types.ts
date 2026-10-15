import type { ItemInventario } from '../loja';
import type { SlotsCosmeticos } from '../profile-cosmetics';

export type EntradaRanking = {
  posicao: number;
  usuarioId: string;
  nome: string;
  nickname: string | null;
  curso: string | null;
  semestre: string | null;
  xpTotal: number;
  nivel: number;
  totalAcertos: number;
  totalRespondidas: number;
  taxaAcerto: number;
  ehUsuarioAtual: boolean;
  cosmeticos: ItemInventario[];
};

export type RankingAlunoResposta = {
  dados: EntradaRanking[];
  usuarioAtual: EntradaRanking | null;
  totalParticipantes: number;
};

export type EntradaRankingTurma = {
  posicao: number;
  alunoId: string;
  nome: string;
  nickname: string | null;
  totalAcertos: number;
  totalRespondidas: number;
  taxaAcerto: number;
  cosmeticos: ItemInventario[];
};

export type RankingTurmaResposta = {
  turmaId: string;
  totalAlunos: number;
  dados: EntradaRankingTurma[];
};

export type StatusListaAluno = 'SUBMETIDA' | 'EM_ANDAMENTO' | 'NAO_RESPONDEU';

export type EntradaRankingLista = {
  posicao: number;
  alunoId: string;
  nome: string;
  nickname: string | null;
  status: StatusListaAluno;
  totalAcertos: number;
  taxaAcerto: number;
  submissaoEm: string | null;
  cosmeticos: ItemInventario[];
};

export type RankingListaResposta = {
  turmaId: string;
  listaTurmaId: string;
  nomeLista: string;
  totalQuestoes: number;
  dados: EntradaRankingLista[];
};

export type OpcaoListaTurma = {
  listaTurmaId: string;
  nomeLista: string;
};

/**
 * Modelo unificado consumido pelos componentes visuais de ranking, para que
 * o podio e a lista funcionem tanto no lado do aluno quanto do professor.
 *
 * `pontuacao` e o valor exibido como metrica principal (XP no ranking de
 * alunos); quando ausente, os componentes mostram o total de acertos, como nos
 * rankings de turma e de lista. `nivel` so existe no ranking por XP.
 */
export type LinhaRanking = {
  posicao: number;
  id: string;
  nome: string;
  nickname: string | null;
  detalhe: string | null;
  totalAcertos: number;
  taxaAcerto: number;
  pontuacao?: number;
  nivel?: number;
  destaque: boolean;
  cosmeticos: SlotsCosmeticos;
};
