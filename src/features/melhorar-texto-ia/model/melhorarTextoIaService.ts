import { httpClient } from '../../../shared/api/httpClient';
import { extractErrorMessage } from '../../manage-questions/model/questionService';

// Servico que reescreve um texto livre do editor de caso OSCE via IA (BFF).
const MELHORAR_TEXTO_ENDPOINT = '/ia/osce/melhorar-texto';

// Contexto opcional que ajuda a IA a manter coerencia com o resto do caso.
export type ContextoMelhorarTexto = {
  titulo?: string;
  especialidade?: string;
  diagnosticoEsperado?: string;
};

// POST /ia/osce/melhorar-texto — devolve o texto reescrito; nunca aplica sozinho.
export const melhorarTextoIa = async (
  campo: string,
  texto: string,
  contexto?: ContextoMelhorarTexto,
): Promise<string> => {
  try {
    const { data } = await httpClient.post<{ textoMelhorado: string }>(MELHORAR_TEXTO_ENDPOINT, {
      campo,
      texto,
      contexto,
    });
    return data.textoMelhorado;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
