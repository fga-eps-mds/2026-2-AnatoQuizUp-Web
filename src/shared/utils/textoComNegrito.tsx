// Converte **trecho** em <strong>, unico marcador markdown que a Gemini usa nas
// respostas; o resto do texto segue plano. Usado pelo chat de ajuda e pela simulacao
// OSCE, que recebem texto do mesmo modelo.
import { Fragment, type ReactNode } from 'react';

const PADRAO_NEGRITO = /(\*\*[^*]+\*\*)/g;

export function renderizarTextoComNegrito(texto: string): ReactNode[] {
  // A chave e a posicao do trecho dentro do texto, nao o indice do array: a mesma
  // resposta sempre gera as mesmas chaves, e elas nao escorregam quando um trecho
  // novo entra no meio.
  let posicao = 0;

  return texto.split(PADRAO_NEGRITO).map((trecho) => {
    const chave = `${posicao}:${trecho.length}`;
    posicao += trecho.length;

    if (trecho.startsWith('**') && trecho.endsWith('**')) {
      return <strong key={chave}>{trecho.slice(2, -2)}</strong>;
    }
    return <Fragment key={chave}>{trecho}</Fragment>;
  });
}
