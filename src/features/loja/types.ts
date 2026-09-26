// Tipos do dominio da loja/inventario: cosmeticos e itens consumiveis.

// Categorias de item e a origem pela qual entrou no inventario. DICA e
// POTENCIALIZADOR sao consumiveis (compraveis varias vezes, com quantidade).
export type TipoItemLoja =
  | 'ICONE_PERFIL'
  | 'MOLDURA'
  | 'AVATAR'
  | 'TITULO'
  | 'PLANO_FUNDO'
  | 'DICA'
  | 'POTENCIALIZADOR';
export type OrigemItemInventario = 'COMPRA' | 'CONQUISTA';

// Item como aparece no catalogo da loja (com preco e flags de disponibilidade/posse).
export type ItemLoja = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  tipo: TipoItemLoja;
  precoMoedas: number;
  valor: string | null;
  imagemUrl: string | null;
  previewImagemUrl: string | null;
  ativo: boolean;
  disponivelNaLoja: boolean;
  // true em DICA/POTENCIALIZADOR: pode ser comprado varias vezes.
  consumivel?: boolean;
  // Texto do efeito do item consumivel (ex.: "+30 segundos na questao").
  efeito?: string | null;
  // Cosmetico ja possuido (sempre false para consumiveis).
  adquirido: boolean;
  // Unidades que o aluno ja possui deste item (0 se nenhuma).
  quantidadePossuida?: number;
};

// Item ja possuido pelo usuario (sem os campos exclusivos da vitrine).
export type ItemInventario = Omit<
  ItemLoja,
  'adquirido' | 'disponivelNaLoja' | 'quantidadePossuida'
> & {
  disponivelNaLoja?: boolean;
};

// Registro do inventario: o item possuido + metadados (equipado, origem, quantidade, data).
export type InventarioItem = {
  id: string;
  equipado: boolean;
  origem?: OrigemItemInventario;
  // Unidades possuidas (so passa de 1 em itens consumiveis).
  quantidade?: number;
  adquiridoEm: string | null;
  item: ItemInventario;
};

// Versao "achatada" do registro de inventario (campos do item e metadados no mesmo nivel).
export type InventarioItemPlano = ItemInventario & {
  inventarioId: string;
  equipado: boolean;
  origem: OrigemItemInventario;
  quantidade?: number;
  adquiridoEm?: string;
};

// Metadados de paginacao das listagens da loja.
export type MetadadosPaginacao = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// Envelope generico de resposta paginada.
export type RespostaPaginada<T> = {
  dados: T[];
  metadados: MetadadosPaginacao;
};

// Resposta da compra de um item: mensagem, novo saldo de moedas, unidades
// compradas e o registro do item no inventario (com a quantidade total atualizada).
export type CompraItemResponse = {
  mensagem: string;
  saldoMoedas: number;
  quantidadeComprada?: number;
  item: InventarioItem;
};

// Parametros para listar o catalogo (filtro por tipo e paginacao).
export type ListarCatalogoParams = {
  tipo?: TipoItemLoja;
  page?: number;
  limit?: number;
};

// Resposta do inventario completo (itens no formato achatado).
export type RespostaInventarioCompleto = {
  mensagem: string;
  dados: InventarioItemPlano[];
};

/** Converte os registros achatados do inventario para o formato aninhado (item + metadados). */
export const normalizarInventarioPlano = (registros: InventarioItemPlano[]): InventarioItem[] =>
  registros.map(({ inventarioId, equipado, origem, quantidade, adquiridoEm, ...item }) => ({
    id: inventarioId,
    equipado,
    origem,
    quantidade,
    adquiridoEm: adquiridoEm ?? null,
    item,
  }));
