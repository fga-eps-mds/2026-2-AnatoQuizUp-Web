export {
  buscarInventarioCompleto,
  comprarItem,
  listarCatalogo,
  listarInventario,
  listarHistorico,
  usarItem,
} from "./lojaService";
export type {
  CompraItemResponse,
  InventarioItem,
  ItemInventario,
  ItemLoja,
  ListarCatalogoParams,
  RespostaPaginada,
  TipoItemLoja,
  OrigemItemInventario,
  UsoItemResponse,
  HistoricoLojaItem,
} from "./types";
export { normalizarInventarioPlano } from "./types";
