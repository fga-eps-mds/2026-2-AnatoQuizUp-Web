// Tipos e constantes da personalizacao de aparencia do avatar-cerebro (cor do
// cerebro + estilo de cabelo). Ficam num modulo a parte (nao-tsx) para nao
// misturar exports de componente com exports de valor no mesmo arquivo, o que
// quebraria o Fast Refresh (regra react-refresh/only-export-components).

export type CorCerebro = 'rosa' | 'roxo' | 'azul' | 'verde' | 'laranja' | 'amarelo';
export type EstiloCabelo = 'loiro' | 'cacheado' | 'moicano';

export type AparenciaAvatar = {
  corCerebro: CorCerebro;
  cabelo: EstiloCabelo | null;
};

export const APARENCIA_PADRAO: AparenciaAvatar = { corCerebro: 'rosa', cabelo: null };

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
