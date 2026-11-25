export type CorCerebro = 'rosa' | 'roxo' | 'azul' | 'verde' | 'laranja' | 'amarelo';
export type EstiloCabelo =
  | 'loiro'
  | 'cacheado'
  | 'moicano'
  | 'loiro-castanho'
  | 'loiro-ruivo'
  | 'cacheado-loiro'
  | 'cacheado-castanho'
  | 'moicano-loiro'
  | 'moicano-ruivo'
  | 'curto-cacheado'
  | 'trancas'
  | 'curto-grisalho'
  | 'curto-cacheado-loiro';

export type EstiloAcessorio =
  | 'coroa'
  | 'oculos'
  | 'chapeu-formatura'
  | 'bone'
  | 'tiara'
  | 'oculos-sol'
  | 'chapeu-festa'
  | 'capacete'
  | 'chapeu-mago'
  | 'chapeu-chef'
  | 'chapeu-palha'
  | 'mascara-carnaval'
  | 'chapeu-cowboy';
export type EstiloLuva =
  | 'luva-boxe'
  | 'luva-cirurgica'
  | 'luva-la'
  | 'luva-boxe-azul'
  | 'luva-boxe-verde'
  | 'luva-boxe-dourado'
  | 'luva-boxe-roxo'
  | 'luva-boxe-preta'
  | 'luva-la-rosa'
  | 'luva-la-verde'
  | 'luva-la-azul'
  | 'luva-jardinagem'
  | 'luva-goleiro';
export type EstiloCalcado =
  | 'sapato-plantao'
  | 'tenis-cano-alto'
  | 'tenis-esportivo'
  | 'tenis-esportivo-vermelho'
  | 'tenis-esportivo-verde'
  | 'tenis-esportivo-amarelo'
  | 'tenis-esportivo-preto'
  | 'tenis-cano-alto-azul'
  | 'tenis-cano-alto-verde'
  | 'tenis-cano-alto-amarelo'
  | 'tenis-cano-alto-preto'
  | 'tenis-skate'
  | 'bota-coturno';

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

export const HUE_ROTATE_COR: Record<CorCerebro, number> = {
  rosa: 0,
  roxo: 300,
  azul: 235,
  verde: 170,
  laranja: 50,
  amarelo: 80,
};
