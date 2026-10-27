// Servico do chat de ajuda: a dica baseada em regra (sem LLM, etapa 1 do roadmap)
// e a pergunta livre respondida pela Gemini API (etapa 3) - ver
// docs/arquitetura/chatbot-ajuda-ia.md.
import { httpClient } from '../../shared/api/httpClient';
import { extractErrorMessage } from '../manage-questions/model/questionService';

const IA_ENDPOINT = '/ia';

type RespostaDica = {
  dica: string;
};

type RespostaPergunta = {
  resposta: string;
};

// Contexto opcional da questao em andamento, enviado junto da pergunta livre para a
// Gemini conseguir responder sem revelar a alternativa correta.
export type ContextoQuestaoAjuda = {
  tema?: string;
  dificuldade?: string;
  enunciado?: string;
};

// GET /ia/dica — dica de estudo baseada no tema de pior desempenho do aluno logado.
export const buscarDicaAjuda = async (): Promise<string> => {
  try {
    const { data } = await httpClient.get<RespostaDica>(`${IA_ENDPOINT}/dica`);

    return data.dica;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// POST /ia/perguntar — pergunta livre do aluno, respondida pela Gemini API.
export const enviarPerguntaAjuda = async (
  pergunta: string,
  contexto?: ContextoQuestaoAjuda,
): Promise<string> => {
  try {
    const { data } = await httpClient.post<RespostaPergunta>(`${IA_ENDPOINT}/perguntar`, {
      pergunta,
      ...contexto,
    });

    return data.resposta;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
