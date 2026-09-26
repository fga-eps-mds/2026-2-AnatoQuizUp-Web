// Servico da loja de cosmeticos. Expoe as chamadas para listar o catalogo,
// consultar o inventario (paginado e completo) e comprar itens. Erros sao
// uniformizados via extractErrorMessage para exibir mensagens amigaveis.
import { httpClient } from "../../shared/api/httpClient";
import { extractErrorMessage } from "../manage-questions/model/questionService";
import type {
  CompraItemResponse,
  InventarioItem,
  ItemLoja,
  ListarCatalogoParams,
  RespostaInventarioCompleto,
  RespostaPaginada,
} from "./types";
import { normalizarInventarioPlano } from "./types";

// Prefixo base das rotas da loja.
const LOJA_ENDPOINT = "/loja";

// GET /loja/catalogo — lista os itens a venda (paginado/filtrado).
export const listarCatalogo = async (
  params?: ListarCatalogoParams,
): Promise<RespostaPaginada<ItemLoja>> => {
  try {
    const { data } = await httpClient.get<RespostaPaginada<ItemLoja>>(
      `${LOJA_ENDPOINT}/catalogo`,
      {
        params,
      },
    );

    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// GET /loja/meu-inventario — lista o inventario do aluno (paginado).
export const listarInventario = async (params?: {
  page?: number;
  limit?: number;
}): Promise<RespostaPaginada<InventarioItem>> => {
  try {
    const { data } = await httpClient.get<RespostaPaginada<InventarioItem>>(
      `${LOJA_ENDPOINT}/meu-inventario`,
      { params },
    );

    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// GET /inventario/meuInventario — inventario completo, achatado para lista plana.
export const buscarInventarioCompleto = async (): Promise<InventarioItem[]> => {
  try {
    const { data } = await httpClient.get<RespostaInventarioCompleto>(
      "/inventario/meuInventario",
    );

    return normalizarInventarioPlano(data.dados);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// POST /loja/comprar — compra um item (quantidade > 1 so para consumiveis);
// a resposta traz o item com a quantidade total e o novo saldo.
export const comprarItem = async (
  itemLojaId: string,
  quantidade = 1,
): Promise<CompraItemResponse> => {
  try {
    const { data } = await httpClient.post<CompraItemResponse>(
      `${LOJA_ENDPOINT}/comprar`,
      {
        itemLojaId,
        quantidade,
      },
    );

    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// POST /loja/usar — ativa uma unidade de potencializador do inventario.
export const usarItem = async (
  itemLojaId: string,
): Promise<{
  mensagem: string;
  quantidadeRestante: number;
}> => {
  try {
    const { data } = await httpClient.post(`${LOJA_ENDPOINT}/usar`, {
      itemLojaId,
    });
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
