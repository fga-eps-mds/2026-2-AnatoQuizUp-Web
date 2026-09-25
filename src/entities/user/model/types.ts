// Tipos de dominio do usuario autenticado (modelo + contrato de autenticacao).
// Resido em ingles por decisao historica (entities/user); o restante e PT-BR.

// Papel do usuario na plataforma.
export type Role = 'STUDENT' | 'PROFESSOR' | 'ADMIN';
// Situacao da conta (ativa ou inativa).
export type UserStatus = 'ACTIVE' | 'INACTIVE';
// Provedor de autenticacao (credenciais locais ou Microsoft).
export type AuthProviderType = 'LOCAL' | 'MICROSOFT';

// Modelo do usuario autenticado usado em toda a aplicacao.
export interface User {
  id: string;
  name: string;
  nickname?: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  authProvider: AuthProviderType;
  microsoftId?: string | null;
  institution?: string | null;
  course?: string | null;
  period?: number | null;
  birthDate?: string | null;
  createdAt?: string | null;
  visivel?: boolean;
}

// Contrato do contexto de autenticacao exposto pelo AuthProvider.
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  recarregarUsuario: () => Promise<void>;
}
