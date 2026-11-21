// Cliente de API do dashboard de desempenho de turmas. Expoe as cinco visoes
// usadas pelo professor: indicadores macro da turma, desempenho individual dos
// alunos, desempenho por lista, o detalhe de uma lista especifica e o top erros.
import type {
  DesempenhoListaIndividual,
  DashboardIndividual,
  DashboardMacro,
  DesempenhoLista,
  TopErrosLista,
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

// GET /turmasDashboard/:turmaId/listas/:listaId/top-erros — ranking de questoes com mais erros.
export const buscarTopErrosLista = async (
  turmaId: string,
  listaId: string
): Promise<TopErrosLista> => {
  const { data } = await httpClient.get(`/turmasDashboard/${turmaId}/listas/${listaId}/top-erros`);
  return data;
};
