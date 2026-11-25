import type { DesempenhoLista } from '../../../entities/dashboardTurma/model/types';

/**
 * Normaliza um texto para comparacao de busca: remove acentos/diacriticos,
 * converte para minusculas e descarta espacos excedentes nas extremidades.
 */
export const normalizarTextoBusca = (texto: string): string =>
  texto
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Filtra as listas publicadas da turma pelo nome com correspondencia parcial,
 * ignorando diferencas de maiusculas, minusculas e acentuacao, sem alterar os dados originais.
 */
export const filtrarListasPorNome = (
  listas: readonly DesempenhoLista[],
  termoBusca: string,
): DesempenhoLista[] => {
  const termoNormalizado = normalizarTextoBusca(termoBusca);

  if (!termoNormalizado) {
    return [...listas];
  }

  return listas.filter((lista) =>
    normalizarTextoBusca(lista.nomeLista).includes(termoNormalizado),
  );
};
