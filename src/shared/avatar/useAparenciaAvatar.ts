import { useEffect, useSyncExternalStore } from 'react';
import { buscarAparenciaRemota } from './avatarApi';
import { APARENCIA_PADRAO, HUE_ROTATE_COR, type AparenciaAvatar } from './aparencia';

const EVENTO = 'anatoquizup:avatar-atualizado';
const chaveAvatar = (id: string) => `anatoquizup:avatar:${id}`;
const requisicoes = new Map<string, Promise<void>>();
const versoes = new Map<string, number>();

export const sincronizarAparencia = (id: string) => {
  const existente = requisicoes.get(id);
  if (existente) return existente;
  const versao = versoes.get(id) ?? 0;
  const requisicao = buscarAparenciaRemota(id)
    .then((aparencia) => {
      if ((versoes.get(id) ?? 0) === versao && JSON.stringify(carregarAparencia(id)) !== JSON.stringify(aparencia)) {
        salvarAparencia(id, aparencia);
      }
    })
    .catch(() => { requisicoes.delete(id); });
  requisicoes.set(id, requisicao);
  return requisicao;
};

const lerRegistro = (id?: string) => {
  try {
    return id ? localStorage.getItem(chaveAvatar(id)) : null;
  } catch {
    return null;
  }
};

export const temAparenciaSalva = (id?: string) => lerRegistro(id) !== null;

export const carregarAparencia = (id?: string): AparenciaAvatar => {
  try {
    const dados: unknown = JSON.parse(lerRegistro(id) ?? 'null');
    if (!dados || typeof dados !== 'object') return APARENCIA_PADRAO;
    const valor = dados as Partial<AparenciaAvatar>;
    return {
      corCerebro: valor.corCerebro && Object.hasOwn(HUE_ROTATE_COR, valor.corCerebro)
        ? valor.corCerebro : APARENCIA_PADRAO.corCerebro,
      cabelo: ['loiro', 'cacheado', 'moicano'].includes(valor.cabelo ?? '') ? valor.cabelo! : null,
      acessorio: ['coroa', 'oculos', 'chapeu-formatura'].includes(valor.acessorio ?? '') ? valor.acessorio! : null,
    };
  } catch {
    return APARENCIA_PADRAO;
  }
};

export const salvarAparencia = (id: string, aparencia: AparenciaAvatar | null) => {
  versoes.set(id, (versoes.get(id) ?? 0) + 1);
  if (aparencia) localStorage.setItem(chaveAvatar(id), JSON.stringify(aparencia));
  else localStorage.removeItem(chaveAvatar(id));
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
