import { httpClient } from '../api/httpClient';
import type { AparenciaAvatar } from './aparencia';

type RespostaAvatar = { dados: AparenciaAvatar };

export const buscarAparenciaRemota = async (id: string, proprio = false) => {
  const rota = proprio ? '/usuarios/meu-avatar' : `/usuarios/${encodeURIComponent(id)}/avatar`;
  const response = await httpClient.get<RespostaAvatar>(rota);
  return response.data.dados;
};

export const salvarAparenciaRemota = async (aparencia: AparenciaAvatar) => {
  const response = await httpClient.put<RespostaAvatar>('/usuarios/meu-avatar', aparencia);
  return response.data.dados;
};
