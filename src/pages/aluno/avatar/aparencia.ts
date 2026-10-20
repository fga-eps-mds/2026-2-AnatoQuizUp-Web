// Tipos e constantes da personalizacao de aparencia do avatar-cerebro (cor do
// cerebro + estilo de cabelo). Ficam num modulo a parte (nao-tsx) para nao
// misturar exports de componente com exports de valor no mesmo arquivo, o que
// quebraria o Fast Refresh (regra react-refresh/only-export-components).

export type CorCerebro = 'rosa' | 'roxo' | 'azul' | 'verde' | 'laranja' | 'amarelo';
export type EstiloCabelo = 'loiro' | 'cacheado' | 'moicano';
// Acessorios de cabeca liberados como base (issue #34); os demais itens da loja entram depois.
export type EstiloAcessorio = 'coroa' | 'oculos' | 'chapeu-formatura';
// Luvas: tambem entram na aba Acessorios, mas num slot proprio (independente de
// EstiloAcessorio) para poderem ser combinadas com coroa/oculos/chapeu ao mesmo tempo.
export type EstiloLuva = 'luva-boxe' | 'luva-cirurgica' | 'luva-la';
// Calcados liberados como base (issue #33); os demais itens da loja entram depois.
export type EstiloCalcado = 'sapato-plantao' | 'tenis-cano-alto' | 'tenis-esportivo';

export type AparenciaAvatar = {
  corCerebro: CorCerebro;
  cabelo: EstiloCabelo | null;
  acessorio: EstiloAcessorio | null;
  luva: EstiloLuva | null;
  calcado: EstiloCalcado | null;
};

export const APARENCIA_PADRAO: AparenciaAvatar = {
  corCerebro: 'rosa',
  cabelo: null,
  acessorio: null,
  luva: null,
  calcado: null,
};

// ponytail: recolore a arte base (rosa) girando o matiz via CSS filter, em vez de
// exigir uma ilustracao por cor. Graus aproximados; se alguma cor destoar muito,
// o upgrade natural e substituir por uma arte dedicada para aquele tom.
export const HUE_ROTATE_COR: Record<CorCerebro, number> = {
  rosa: 0,
  roxo: 300,
  azul: 235,
  verde: 170,
  laranja: 50,
  amarelo: 80,
};
