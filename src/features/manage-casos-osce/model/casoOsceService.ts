import axios from 'axios';
import { httpClient } from '../../../shared/api/httpClient';
import type { CasoOsce, SalvarCasoOsce } from './types';

// Service do cadastro de casos OSCE (US26): fala direto com /casos-osce no BFF,
// que so repassa pro Quiz-Service (sem mocks - feature nova, sem equivalente ainda).
const CASO_OSCE_ENDPOINT = '/casos-osce';

type ApiSuccessResponse<T> = { mensagem: string; dados: T };
type ApiPaginatedResponse<T> = { dados: T[] };

// Extrai uma mensagem de erro amigavel de um erro do Axios.
export const extractCasoOsceErrorMessage = (
  error: unknown,
  fallback = 'Não foi possível salvar o caso OSCE.',
): string => {
  if (!axios.isAxiosError(error) || !error.response) {
    return 'Não foi possível conectar ao servidor. Tente novamente.';
  }

  const data = error.response.data as { mensagem?: string; erro?: { mensagem?: string } };

  return data.erro?.mensagem ?? data.mensagem ?? fallback;
};

export const listarCasosOsce = async (): Promise<CasoOsce[]> => {
  try {
    const { data } = await httpClient.get<ApiPaginatedResponse<CasoOsce>>(CASO_OSCE_ENDPOINT);
    return data.dados;
  } catch (error) {
    throw new Error(extractCasoOsceErrorMessage(error));
  }
};

export const buscarCasoOscePorId = async (id: string): Promise<CasoOsce> => {
  try {
    const { data } = await httpClient.get<ApiSuccessResponse<CasoOsce>>(
      `${CASO_OSCE_ENDPOINT}/${id}`,
    );
    return data.dados;
  } catch (error) {
    throw new Error(extractCasoOsceErrorMessage(error));
  }
};

// Cria um caso (rascunho), com o que ja estiver preenchido no passo 1.
export const criarCasoOsce = async (payload: SalvarCasoOsce): Promise<CasoOsce> => {
  try {
    const { data } = await httpClient.post<ApiSuccessResponse<CasoOsce>>(
      CASO_OSCE_ENDPOINT,
      payload,
    );
    return data.dados;
  } catch (error) {
    throw new Error(extractCasoOsceErrorMessage(error));
  }
};

// Autosave: atualiza (merge parcial) os campos do passo atual.
export const atualizarCasoOsce = async (
  id: string,
  payload: SalvarCasoOsce,
): Promise<CasoOsce> => {
  try {
    const { data } = await httpClient.patch<ApiSuccessResponse<CasoOsce>>(
      `${CASO_OSCE_ENDPOINT}/${id}`,
      payload,
    );
    return data.dados;
  } catch (error) {
    throw new Error(extractCasoOsceErrorMessage(error));
  }
};

// Exclui um caso (soft delete no Quiz-Service); tentativas dos alunos sao preservadas.
export const excluirCasoOsce = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`${CASO_OSCE_ENDPOINT}/${id}`);
  } catch (error) {
    throw new Error(extractCasoOsceErrorMessage(error, 'Não foi possível excluir o caso OSCE.'));
  }
};
