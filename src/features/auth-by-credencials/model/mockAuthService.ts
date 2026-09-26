// Servico de autenticacao falso (mock) usado em desenvolvimento/testes sem backend.
import type { User } from '../../../entities/user/model/types';
import type { LoginResponse } from './authService';

// E-mails de teste que disparam comportamentos especificos no mock.
const STUDENT_EMAIL = 'aluno@unb.br';
const AVATAR_DEMO_EMAIL = 'avatar@anatoquizup.local';
const AVATAR_DEMO_PASSWORD = 'Avatar2026!';
const PROFESSOR_EMAIL = 'professor@unb.br';
const DISABLED_EMAIL = 'desativado@unb.br';

// Usuario aluno fixo retornado pelo mock.
const STUDENT_USER: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Joao Jose',
  nickname: 'joaojose',
  email: STUDENT_EMAIL,
  role: 'STUDENT',
  status: 'ACTIVE',
  authProvider: 'LOCAL',
  course: 'Medicina',
  institution: 'Universidade de Brasilia',
  period: 3,
};

// Usuario professor fixo retornado pelo mock.
const AVATAR_DEMO_USER: User = {
  id: 'avatar-demo-local',
  name: 'Aluno Avatar',
  nickname: 'avatar-demo',
  email: AVATAR_DEMO_EMAIL,
  role: 'STUDENT',
  status: 'ACTIVE',
  authProvider: 'LOCAL',
  course: 'Medicina',
  institution: 'Instituição de exemplo',
  period: 1,
};

const PROFESSOR_USER: User = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Professor UnB',
  nickname: null,
  email: PROFESSOR_EMAIL,
  role: 'PROFESSOR',
  status: 'ACTIVE',
  authProvider: 'LOCAL',
  course: null,
  institution: 'Universidade de Brasilia',
  period: null,
};

const STUDENT_TOKENS: LoginResponse = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

const AVATAR_DEMO_TOKENS: LoginResponse = {
  accessToken: 'mock-avatar-demo-access-token',
  refreshToken: 'mock-avatar-demo-refresh-token',
};

const PROFESSOR_TOKENS: LoginResponse = {
  accessToken: 'mock-professor-access-token',
  refreshToken: 'mock-professor-refresh-token',
};

// Usuario "logado" atual no mock; mutavel para simular edicoes de perfil.
let authenticatedMockUser: User = STUDENT_USER;

/** Atualiza nome/nickname do usuario mock (simula edicao de dados pessoais). */
export const atualizarUsuarioAutenticadoMock = (
  dados: Partial<Pick<User, 'name' | 'nickname'>>,
) => {
  authenticatedMockUser = {
    ...authenticatedMockUser,
    ...dados,
  };
};

/** Le o access token do localStorage com protecao contra ambientes sem storage. */
const getStoredAccessToken = (): string | null => {
  try {
    return globalThis.localStorage?.getItem('access_token') ?? null;
  } catch {
    return null;
  }
};

/**
 * Login simulado: ignora a senha e decide o resultado pelo e-mail de teste informado
 * (aluno, professor, conta desativada ou credenciais invalidas).
 */
export const loginWithMockCredencials = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === AVATAR_DEMO_EMAIL) {
    if (password !== AVATAR_DEMO_PASSWORD) throw new Error('Email ou senha invalidos');
    authenticatedMockUser = AVATAR_DEMO_USER;
    return AVATAR_DEMO_TOKENS;
  }

  if (normalizedEmail === DISABLED_EMAIL) {
    throw new Error('Conta desativada. Entre em contato com o administrador.');
  }

  if (normalizedEmail === STUDENT_EMAIL) {
    authenticatedMockUser = STUDENT_USER;
    return STUDENT_TOKENS;
  }

  if (normalizedEmail === PROFESSOR_EMAIL) {
    authenticatedMockUser = PROFESSOR_USER;
    return PROFESSOR_TOKENS;
  }

  throw new Error('Email ou senha invalidos');
};

/** Retorna o usuario mock correspondente ao token salvo (professor/aluno). */
export const getAuthenticatedUserMock = async (): Promise<User> => {
  const storedAccessToken = getStoredAccessToken();

  if (storedAccessToken === AVATAR_DEMO_TOKENS.accessToken) {
    return authenticatedMockUser.id === AVATAR_DEMO_USER.id ? authenticatedMockUser : AVATAR_DEMO_USER;
  }

  if (storedAccessToken === PROFESSOR_TOKENS.accessToken) {
    return authenticatedMockUser.role === 'PROFESSOR' ? authenticatedMockUser : PROFESSOR_USER;
  }

  if (storedAccessToken === STUDENT_TOKENS.accessToken) {
    return authenticatedMockUser.role === 'STUDENT' ? authenticatedMockUser : STUDENT_USER;
  }

  return authenticatedMockUser;
};
