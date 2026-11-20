// Cliente de API do dashboard de desempenho de turmas. Expoe as quatro visoes
// usadas pelo professor: indicadores macro da turma, desempenho individual dos
// alunos, desempenho por lista e o detalhe de uma lista especifica.
import type {
  DesempenhoListaIndividual,
  DashboardIndividual,
  DashboardMacro,
  DesempenhoLista,
  DetalheEntrega,
} from '../model/types';
import { httpClient } from '../../../shared/api/httpClient';

// GET /turmasDashboard/:turmaId/macro — indicadores agregados da turma.
export const buscarDashboardMacro = async (turmaId: string): Promise<DashboardMacro> => {
  const { data } = await httpClient.get(`/turmasDashboard/${turmaId}/macro`);
  return data;
};

// GET /turmasDashboard/:turmaId/individual — desempenho aluno a aluno.
export const buscarDesempenhoIndividual = async (turmaId: string): Promise<DashboardIndividual> => {
  const { data } = await httpClient.get(`/turmasDashboard/${turmaId}/individual`);
  return data;
};

// GET /turmasDashboard/:turmaId/listas — desempenho agregado por lista.
export const buscarDesempenhoPorListas = async (turmaId: string): Promise<DesempenhoLista[]> => {
  const { data } = await httpClient.get(`/turmasDashboard/${turmaId}/listas`);
  return data;
};

// GET /turmasDashboard/:turmaId/listas/:listaId — detalhe de uma lista especifica.
export const buscarDesempenhoListaIndividual = async (
  turmaId: string,
  listaId: string
): Promise<DesempenhoListaIndividual> => {
  const { data } = await httpClient.get(`/turmasDashboard/${turmaId}/listas/${listaId}`);
  return data;
};

// GET detalhe da entrega submetida por um aluno em uma lista da turma.
export const buscarDetalheEntrega = async (
  turmaId: string,
  listaId: string,
  alunoId: string,
): Promise<DetalheEntrega> => {
  const { data } = await httpClient.get(
    `/turmasDashboard/${turmaId}/listas/${listaId}/alunos/${alunoId}/entrega`,
  );
  return data;
};

