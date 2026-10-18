export type CorCerebro = 'rosa' | 'roxo' | 'azul' | 'verde' | 'laranja' | 'amarelo';
export type EstiloCabelo = 'loiro' | 'cacheado' | 'moicano';

export type EstiloAcessorio = 'coroa' | 'oculos' | 'chapeu-formatura';

export type AparenciaAvatar = {
  corCerebro: CorCerebro;
  cabelo: EstiloCabelo | null;
  acessorio: EstiloAcessorio | null;
};

export const APARENCIA_PADRAO: AparenciaAvatar = {
  corCerebro: 'rosa',
  cabelo: null,
  acessorio: null,
};

export const HUE_ROTATE_COR: Record<CorCerebro, number> = {
  rosa: 0,
  roxo: 300,
  azul: 235,
  verde: 170,
  laranja: 50,
  amarelo: 80,
};
