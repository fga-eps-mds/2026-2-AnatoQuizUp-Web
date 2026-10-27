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

// Niveis de desempenho da rubrica (capitulo 14 do Practical Guide): competente,
// parcial (metade do peso) e nao realizado.
export type NivelDesempenho = 'competente' | 'parcial' | 'nao_realizado';

// Faixa em que o percentual do checklist caiu.
export type NivelChecklist = 'excelente' | 'bom' | 'suficiente' | 'limitrofe' | 'insuficiente';

export type ItemAvaliado = {
  id: string;
  dominio: string;
  descricao: string;
  // Ancoras comportamentais por nivel de credito: onde fica a linha entre credito
  // cheio e credito parcial. Item sem `parcial` nao tem meio-termo.
  ancoras: { competente: string; parcial?: string };
  peso: number;
  permiteParcial: boolean;
  // Item critico: falhar nele limita a nota global, por melhor que seja o resto.
  critico?: boolean;
  nivel: NivelDesempenho;
  justificativa: string;
  pontos: number;
  pontosMaximos: number;
};

export type AvaliacaoOsce = {
  cenarioId: string;
  titulo: string;
  diagnosticoEsperado: string;
  comentarioFinal: string;
  itens: ItemAvaliado[];
  pontuacao: number;
  pontuacaoMaxima: number;
  percentual: number;
  nivelChecklist: NivelChecklist;
  rotuloChecklist: string;
  // Nota global (0-4) julgada pelo examinador sem olhar a soma do checklist.
  notaGlobal: number;
  rotuloNotaGlobal: string;
  ancoraNotaGlobal: string;
  justificativaNotaGlobal: string;
  aprovado: boolean;
  itensCriticosNaoCumpridos: string[];
  // true quando checklist e nota global discordam demais: pede revisao humana.
  divergente: boolean;
};

// POST /ia/osce/:id/finalizar — encerra a simulacao e devolve a rubrica pontuada.
export const finalizarOsce = async (
  cenarioId: string,
  historico: TurnoOsce[],
): Promise<AvaliacaoOsce> => {
  try {
    const { data } = await httpClient.post<{ avaliacao: AvaliacaoOsce }>(
      `${OSCE_ENDPOINT}/${cenarioId}/finalizar`,
      { historico },
    );
    return data.avaliacao;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
