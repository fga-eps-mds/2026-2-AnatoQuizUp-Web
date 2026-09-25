// Servico de autenticacao por credenciais. Cuida do login, da busca do usuario
// autenticado e do logout, alem de mapear o usuario do formato do backend (PT-BR,
// papel/status) para o tipo User do dominio (EN). Em modo mock, delega ao
// mockAuthService. Traduz erros HTTP (401/403/sem-resposta) em mensagens claras.
import axios from 'axios';
import type { User } from '../../../entities/user/model/types';
import { httpClient } from '../../../shared/api/httpClient';
import { USE_MOCKS } from '../../../shared/config/env';
import { getAuthenticatedUserMock, loginWithMockCredencials } from './mockAuthService';

// Tokens retornados ao front apos um login bem-sucedido.
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

// Formato cru da resposta de login do backend (tokens dentro de "dados").
interface BackendLoginResponse {
  dados: {
    accessToken: string;
    refreshToken: string;
  };
}

// Papeis e status como nomeados pelo backend (PT-BR).
type BackendPapel = 'ALUNO' | 'PROFESSOR' | 'ADMIN' | 'ADMINISTRADOR';
type BackendStatus = 'ATIVO' | 'INATIVO' | 'PENDENTE' | 'RECUSADO';

// Formato cru do usuario autenticado retornado pelo backend.
interface BackendUsuarioAutenticado {
  id: string;
  nome: string;
  nickname?: string | null;
  email: string;
  papel: BackendPapel;
  status: BackendStatus;
  instituicao?: string | null;
  curso?: string | null;
  periodo?: string | null;
  dataNascimento?: string | null;
  createdAt?: string | null;
  visivel?: boolean;
}

// Formato cru da resposta de "usuario atual" (usuario aninhado em "dados").
interface BackendMeResponse {
  dados: {
    usuario: BackendUsuarioAutenticado;
  };
}

// Traduz o papel do backend (PT-BR) para o role do dominio; admin/administrador viram ADMIN.
const mapPapelToRole = (papel: BackendPapel): User['role'] => {
  if (papel === 'ALUNO') return 'STUDENT';
  if (papel === 'PROFESSOR') return 'PROFESSOR';
  return 'ADMIN';
};

// Traduz o status do backend para o status do dominio (apenas ATIVO e considerado ativo).
const mapStatusToUserStatus = (status: BackendStatus): User['status'] => (
  status === 'ATIVO' ? 'ACTIVE' : 'INACTIVE'
);

// Converte o periodo (string) em numero, ou null quando ausente/invalido.
const mapPeriodo = (periodo?: string | null): number | null => {
  if (!periodo) return null;

  const parsedPeriodo = Number(periodo);
  return Number.isNaN(parsedPeriodo) ? null : parsedPeriodo;
};

/**
 * Mapeia o usuario cru do backend para o tipo User do dominio, normalizando
 * nomes de campos, papel, status, periodo e defaults (ex.: visivel = true).
 * @param usuario usuario cru retornado pela API
 */
const mapUsuarioAutenticado = (usuario: BackendUsuarioAutenticado): User => ({
  id: usuario.id,
  name: usuario.nome,
  nickname: usuario.nickname ?? null,
  email: usuario.email,
  role: mapPapelToRole(usuario.papel),
  status: mapStatusToUserStatus(usuario.status),
  authProvider: 'LOCAL',
  institution: usuario.instituicao ?? null,
  course: usuario.curso ?? null,
  period: mapPeriodo(usuario.periodo),
  birthDate: usuario.dataNascimento ?? null,
  createdAt: usuario.createdAt ?? null,
  visivel: usuario.visivel ?? true,
});

/**
 * Extrai a mensagem de erro de uma resposta do backend, tentando os varios
 * formatos possiveis (erro.mensagem / mensagem / message).
 * @param err erro capturado
 * @returns mensagem do backend ou null
 */
const extractErrorMessage = (err: unknown): string | null => {
  if (!axios.isAxiosError(err) || !err.response) return null;

  const responseData = err.response.data as {
    message?: string;
    mensagem?: string;
    erro?: { mensagem?: string };
  };

  return responseData.erro?.mensagem ?? responseData.mensagem ?? responseData.message ?? null;
};

/**
 * Realiza o login com email e senha e devolve os tokens. Em modo mock, delega ao
 * mock. Mapeia 401 (credenciais) e 403 (conta desativada) em mensagens proprias.
 * @param email email do usuario
 * @param password senha
 * @throws Error com mensagem amigavel em qualquer falha
 */
export const loginWithCredencials = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  if (USE_MOCKS) {
    return loginWithMockCredencials(email, password);
  }

  try {
    const { data } = await httpClient.post<BackendLoginResponse>('/autenticacao/login', {
      email,
      senha: password,
    });

    return {
      accessToken: data.dados.accessToken,
      refreshToken: data.dados.refreshToken,
    };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (!err.response) {
        throw new Error('Nao foi possivel conectar ao servidor. Tente novamente.');
      }

      const message = extractErrorMessage(err);

      if (err.response.status === 401) {
        throw new Error(message ?? 'Email ou senha invalidos');
      }

      if (err.response.status === 403) {
        throw new Error(message ?? 'Conta desativada. Entre em contato com o administrador.');
      }
    }

    throw new Error('Erro ao entrar. Tente novamente.');
  }
};

/**
 * Busca o usuario autenticado (rota "usuario-atual") e o mapeia para o dominio.
 * 401/403 viram "sessao expirada". Em modo mock, delega ao mock.
 * @throws Error com mensagem amigavel em caso de falha
 */
export const getAuthenticatedUser = async (): Promise<User> => {
  if (USE_MOCKS) {
    return getAuthenticatedUserMock();
  }

  try {
    const { data } = await httpClient.get<BackendMeResponse>('/autenticacao/usuario-atual');

    return mapUsuarioAutenticado(data.dados.usuario);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (!err.response) {
        throw new Error('Nao foi possivel conectar ao servidor. Tente novamente.');
      }

      const message = extractErrorMessage(err);

      if (err.response.status === 401 || err.response.status === 403) {
        throw new Error(message ?? 'Sessao expirada. Faca login novamente.');
      }
    }

    throw new Error('Nao foi possivel carregar o usuario autenticado.');
  }
};

/**
 * Encerra a sessao no backend invalidando o refresh token. No-op em modo mock.
 * @param refreshToken token de refresh a invalidar
 */
export const logoutSession = async (refreshToken: string): Promise<void> => {
  if (USE_MOCKS) {
    return;
  }

  await httpClient.post('/autenticacao/sair', {
    refreshToken,
  });
};
