import { useEffect, useSyncExternalStore } from 'react';
import { buscarAparenciaRemota } from './avatarApi';
import { APARENCIA_PADRAO, type AparenciaAvatar } from './aparencia';

const EVENTO = 'anatoquizup:avatar-atualizado';
const ID_AVATAR_VALIDO = /^[A-Za-z0-9_-]{1,128}$/;
const chaveAvatar = (id: string) =>
  ID_AVATAR_VALIDO.test(id) ? `anatoquizup:avatar:${id}` : null;
const requisicoes = new Map<string, Promise<void>>();
const versoes = new Map<string, number>();

const normalizarCorCerebro = (valor: unknown): AparenciaAvatar['corCerebro'] => {
  switch (valor) {
    case 'roxo': return 'roxo';
    case 'azul': return 'azul';
    case 'verde': return 'verde';
    case 'laranja': return 'laranja';
    case 'amarelo': return 'amarelo';
    default: return 'rosa';
  }
};

const normalizarCabelo = (valor: unknown): AparenciaAvatar['cabelo'] => {
  switch (valor) {
    case 'loiro': return 'loiro';
    case 'cacheado': return 'cacheado';
    case 'moicano': return 'moicano';
    case 'loiro-castanho': return 'loiro-castanho';
    case 'loiro-ruivo': return 'loiro-ruivo';
    case 'cacheado-loiro': return 'cacheado-loiro';
    case 'cacheado-castanho': return 'cacheado-castanho';
    case 'moicano-loiro': return 'moicano-loiro';
    case 'moicano-ruivo': return 'moicano-ruivo';
    case 'curto-cacheado': return 'curto-cacheado';
    case 'trancas': return 'trancas';
    case 'curto-grisalho': return 'curto-grisalho';
    case 'curto-cacheado-loiro': return 'curto-cacheado-loiro';
    default: return null;
  }
};

const normalizarAcessorio = (valor: unknown): AparenciaAvatar['acessorio'] => {
  switch (valor) {
    case 'coroa': return 'coroa';
    case 'oculos': return 'oculos';
    case 'chapeu-formatura': return 'chapeu-formatura';
    case 'bone': return 'bone';
    case 'tiara': return 'tiara';
    case 'oculos-sol': return 'oculos-sol';
    case 'chapeu-festa': return 'chapeu-festa';
    case 'capacete': return 'capacete';
    case 'chapeu-mago': return 'chapeu-mago';
    case 'chapeu-chef': return 'chapeu-chef';
    case 'chapeu-palha': return 'chapeu-palha';
    case 'mascara-carnaval': return 'mascara-carnaval';
    case 'chapeu-cowboy': return 'chapeu-cowboy';
    default: return null;
  }
};

const normalizarLuva = (valor: unknown): AparenciaAvatar['luva'] => {
  switch (valor) {
    case 'luva-boxe': return 'luva-boxe';
    case 'luva-cirurgica': return 'luva-cirurgica';
    case 'luva-la': return 'luva-la';
    case 'luva-boxe-azul': return 'luva-boxe-azul';
    case 'luva-boxe-verde': return 'luva-boxe-verde';
    case 'luva-boxe-dourado': return 'luva-boxe-dourado';
    case 'luva-boxe-roxo': return 'luva-boxe-roxo';
    case 'luva-boxe-preta': return 'luva-boxe-preta';
    case 'luva-la-rosa': return 'luva-la-rosa';
    case 'luva-la-verde': return 'luva-la-verde';
    case 'luva-la-azul': return 'luva-la-azul';
    case 'luva-jardinagem': return 'luva-jardinagem';
    case 'luva-goleiro': return 'luva-goleiro';
    default: return null;
  }
};

const normalizarCalcado = (valor: unknown): AparenciaAvatar['calcado'] => {
  switch (valor) {
    case 'sapato-plantao': return 'sapato-plantao';
    case 'tenis-cano-alto': return 'tenis-cano-alto';
    case 'tenis-esportivo': return 'tenis-esportivo';
    case 'tenis-esportivo-vermelho': return 'tenis-esportivo-vermelho';
    case 'tenis-esportivo-verde': return 'tenis-esportivo-verde';
    case 'tenis-esportivo-amarelo': return 'tenis-esportivo-amarelo';
    case 'tenis-esportivo-preto': return 'tenis-esportivo-preto';
    case 'tenis-cano-alto-azul': return 'tenis-cano-alto-azul';
    case 'tenis-cano-alto-verde': return 'tenis-cano-alto-verde';
    case 'tenis-cano-alto-amarelo': return 'tenis-cano-alto-amarelo';
    case 'tenis-cano-alto-preto': return 'tenis-cano-alto-preto';
    case 'tenis-skate': return 'tenis-skate';
    case 'bota-coturno': return 'bota-coturno';
    default: return null;
  }
};

const normalizarAparencia = (dados: unknown): AparenciaAvatar => {
  if (!dados || typeof dados !== 'object') return APARENCIA_PADRAO;
  const valor = dados as Record<string, unknown>;
  return {
    corCerebro: normalizarCorCerebro(valor.corCerebro),
    cabelo: normalizarCabelo(valor.cabelo),
    acessorio: normalizarAcessorio(valor.acessorio),
    luva: normalizarLuva(valor.luva),
    calcado: normalizarCalcado(valor.calcado),
  };
};

export const sincronizarAparencia = (id: string) => {
  if (!ID_AVATAR_VALIDO.test(id)) return Promise.resolve();
  const existente = requisicoes.get(id);
  if (existente) return existente;
  const versao = versoes.get(id) ?? 0;
  const requisicao = buscarAparenciaRemota(id)
    .then((aparencia) => {
      if ((versoes.get(id) ?? 0) === versao && JSON.stringify(carregarAparencia(id)) !== JSON.stringify(aparencia)) {
        salvarAparencia(id, aparencia);
      }
    })
    .catch(() => {})
    .finally(() => { requisicoes.delete(id); });
  requisicoes.set(id, requisicao);
  return requisicao;
};

const lerRegistro = (id?: string) => {
  try {
    const chave = id ? chaveAvatar(id) : null;
    return chave ? localStorage.getItem(chave) : null;
  } catch {
    return null;
  }
};

export const carregarAparencia = (id?: string): AparenciaAvatar => {
  try {
    return normalizarAparencia(JSON.parse(lerRegistro(id) ?? 'null'));
  } catch {
    return APARENCIA_PADRAO;
  }
};

export const salvarAparencia = (id: string, aparencia: AparenciaAvatar | null) => {
  const chave = chaveAvatar(id);
  if (!chave) return;
  versoes.set(id, (versoes.get(id) ?? 0) + 1);
  if (aparencia) {
    const aparenciaValidada = normalizarAparencia(aparencia);
    localStorage.setItem(chave, JSON.stringify(aparenciaValidada));
  } else {
    localStorage.removeItem(chave);
  }
  window.dispatchEvent(new Event(EVENTO));
};

const subscribe = (notificar: () => void) => {
  window.addEventListener(EVENTO, notificar);
  window.addEventListener('storage', notificar);
  return () => {
    window.removeEventListener(EVENTO, notificar);
    window.removeEventListener('storage', notificar);
  };
};

export const useAparenciaAvatar = (id?: string) => {
  useSyncExternalStore(subscribe, () => lerRegistro(id), () => null);
  useEffect(() => {
    if (id) void sincronizarAparencia(id);
  }, [id]);
  return carregarAparencia(id);
};
