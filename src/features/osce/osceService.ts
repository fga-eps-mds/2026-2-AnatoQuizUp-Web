// Servico da simulacao OSCE: lista cenarios, envia a fala do aluno (resposta do
// "paciente" via Gemini) e fecha a simulacao pedindo o feedback do examinador.
// Ver docs/arquitetura/chatbot-osce.md para a arquitetura e os parametros completos.
import { httpClient } from '../../shared/api/httpClient';
import { extractErrorMessage } from '../manage-questions/model/questionService';

const OSCE_ENDPOINT = '/ia/osce';

export type CenarioOsceResumo = {
  id: string;
  titulo: string;
  especialidade: string;
  dificuldade: 'Fácil' | 'Médio' | 'Difícil';
};

export type TurnoOsce = {
  autor: 'aluno' | 'paciente';
  texto: string;
};

// GET /ia/osce/cenarios — lista publica dos casos disponiveis (sem o roteiro oculto).
export const listarCenariosOsce = async (): Promise<CenarioOsceResumo[]> => {
  try {
    const { data } = await httpClient.get<{ cenarios: CenarioOsceResumo[] }>(
      `${OSCE_ENDPOINT}/cenarios`,
    );
    return data.cenarios;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// POST /ia/osce/:id/mensagem — fala do aluno; devolve a resposta do paciente (IA).
export const enviarMensagemOsce = async (
  cenarioId: string,
  mensagem: string,
  historico: TurnoOsce[],
): Promise<string> => {
  try {
    const { data } = await httpClient.post<{ resposta: string }>(
      `${OSCE_ENDPOINT}/${cenarioId}/mensagem`,
      { mensagem, historico },
    );
    return data.resposta;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// POST /ia/osce/:id/finalizar — encerra a simulacao e devolve o feedback do examinador.
export const finalizarOsce = async (
  cenarioId: string,
  historico: TurnoOsce[],
): Promise<string> => {
  try {
    const { data } = await httpClient.post<{ feedback: string }>(
      `${OSCE_ENDPOINT}/${cenarioId}/finalizar`,
      { historico },
    );
    return data.feedback;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
