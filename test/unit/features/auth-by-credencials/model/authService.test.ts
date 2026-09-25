const postMock = jest.fn();
const getMock = jest.fn();

const loadService = async (useMocks: boolean) => {
  jest.resetModules();
  postMock.mockReset();
  getMock.mockReset();

  jest.doMock('../../../../../src/shared/api/httpClient', () => ({
    httpClient: {
      post: postMock,
      get: getMock,
    },
  }));

  jest.doMock('../../../../../src/shared/config/env', () => ({
    USE_MOCKS: useMocks,
  }));

  return import('../../../../../src/features/auth-by-credencials/model/authService');
};

describe('loginWithCredencials', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the mock student without calling the API when mocks are enabled', async () => {
    const { loginWithCredencials } = await loadService(true);

    const result = await loginWithCredencials('aluno@unb.br', 'any-password');

    expect(postMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
  });

  it('returns the mock professor without calling the API when mocks are enabled', async () => {
    const { getAuthenticatedUser, loginWithCredencials } = await loadService(true);

    const result = await loginWithCredencials('professor@unb.br', 'any-password');
    const user = await getAuthenticatedUser();

    expect(postMock).not.toHaveBeenCalled();
    expect(getMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      accessToken: 'mock-professor-access-token',
      refreshToken: 'mock-professor-refresh-token',
    });
    expect(user).toMatchObject({
      email: 'professor@unb.br',
      role: 'PROFESSOR',
      status: 'ACTIVE',
      authProvider: 'LOCAL',
    });
  });

  it('throws the disabled account message before calling the API when mocks are enabled', async () => {
    const { loginWithCredencials } = await loadService(true);

    await expect(loginWithCredencials('desativado@unb.br', 'secret')).rejects.toThrow(
      'Conta desativada. Entre em contato com o administrador.',
    );
    expect(postMock).not.toHaveBeenCalled();
  });

  it('returns tokens from backend login response when mocks are disabled', async () => {
    const { loginWithCredencials } = await loadService(false);
    postMock.mockResolvedValueOnce({
      data: {
        dados: {
          accessToken: 'api-access',
          refreshToken: 'api-refresh',
        },
      },
    });

    const result = await loginWithCredencials('professor@unb.br', 'secret');

    expect(postMock).toHaveBeenCalledWith('/autenticacao/login', {
      email: 'professor@unb.br',
      senha: 'secret',
    });
    expect(result).toEqual({
      accessToken: 'api-access',
      refreshToken: 'api-refresh',
    });
  });

  it('returns the mock authenticated user without calling the API when mocks are enabled', async () => {
    const { getAuthenticatedUser } = await loadService(true);

    const result = await getAuthenticatedUser();

    expect(getMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      email: 'aluno@unb.br',
      nickname: 'joaojose',
      role: 'STUDENT',
      status: 'ACTIVE',
      authProvider: 'LOCAL',
    });
  });

  it('does not call the API on logout when mocks are enabled', async () => {
    const { logoutSession } = await loadService(true);

    await expect(logoutSession('refresh-token')).resolves.toBeUndefined();

    expect(postMock).not.toHaveBeenCalled();
  });

  it('calls backend logout with refresh token when mocks are disabled', async () => {
    const { logoutSession } = await loadService(false);
    postMock.mockResolvedValueOnce({});

    await expect(logoutSession('refresh-token')).resolves.toBeUndefined();

    expect(postMock).toHaveBeenCalledWith('/autenticacao/sair', {
      refreshToken: 'refresh-token',
    });
  });

  it('maps the authenticated backend user to the auth user shape when mocks are disabled', async () => {
    const { getAuthenticatedUser } = await loadService(false);
    getMock.mockResolvedValueOnce({
      data: {
        dados: {
          usuario: {
            id: 'user-1',
            nome: 'Professor UnB',
            nickname: 'prof.anato',
            email: 'professor@unb.br',
            papel: 'PROFESSOR',
            status: 'ATIVO',
            instituicao: 'Universidade de Brasilia',
            curso: 'Medicina',
            periodo: '3',
          },
        },
      },
    });

    const result = await getAuthenticatedUser();

    expect(getMock).toHaveBeenCalledWith('/autenticacao/usuario-atual');
    expect(result).toEqual({
      id: 'user-1',
      name: 'Professor UnB',
      nickname: 'prof.anato',
      email: 'professor@unb.br',
      role: 'PROFESSOR',
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      institution: 'Universidade de Brasilia',
      course: 'Medicina',
      period: 3,
      birthDate: null,
      createdAt: null,
      visivel: true,
    });
  });

  it.each([
    ['ALUNO', 'STUDENT'],
    ['ADMIN', 'ADMIN'],
    ['ADMINISTRADOR', 'ADMIN'],
  ])('maps backend role %s to frontend role %s', async (papel, role) => {
    const { getAuthenticatedUser } = await loadService(false);
    getMock.mockResolvedValueOnce({
      data: {
        dados: {
          usuario: {
            id: 'user-1',
            nome: 'Usuario Teste',
            email: 'usuario@unb.br',
            papel,
            status: 'ATIVO',
            instituicao: null,
            curso: null,
            periodo: null,
          },
        },
      },
    });

    const result = await getAuthenticatedUser();

    expect(result).toMatchObject({
      role,
      status: 'ACTIVE',
      nickname: null,
      institution: null,
      course: null,
      period: null,
    });
  });

  it('maps blocked backend status and invalid period to inactive user with null period', async () => {
    const { getAuthenticatedUser } = await loadService(false);
    getMock.mockResolvedValueOnce({
      data: {
        dados: {
          usuario: {
            id: 'user-1',
            nome: 'Aluno Pendente',
            email: 'aluno@unb.br',
            papel: 'ALUNO',
            status: 'PENDENTE',
            periodo: 'periodo-invalido',
          },
        },
      },
    });

    const result = await getAuthenticatedUser();

    expect(result).toMatchObject({
      role: 'STUDENT',
      status: 'INACTIVE',
      institution: null,
      course: null,
      period: null,
    });
  });

  it('throws a friendly message when the backend is unreachable', async () => {
    const { loginWithCredencials } = await loadService(false);
    postMock.mockRejectedValueOnce({ isAxiosError: true });

    await expect(loginWithCredencials('professor@unb.br', 'secret')).rejects.toThrow(
      'Nao foi possivel conectar ao servidor. Tente novamente.',
    );
  });

  it('throws the backend message for invalid credentials', async () => {
    const { loginWithCredencials } = await loadService(false);
    postMock.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
        data: { erro: { mensagem: 'Credenciais invalidas' } },
      },
    });

    await expect(loginWithCredencials('professor@unb.br', 'wrong')).rejects.toThrow(
      'Credenciais invalidas',
    );
  });

  it('throws the backend message when login is blocked by user status', async () => {
    const { loginWithCredencials } = await loadService(false);
    postMock.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          erro: {
            mensagem: 'Conta desativada. Entre em contato com o administrador.',
          },
        },
      },
    });

    await expect(loginWithCredencials('professor@unb.br', 'secret')).rejects.toThrow(
      'Conta desativada. Entre em contato com o administrador.',
    );
  });

  it('throws a generic message for unexpected errors', async () => {
    const { loginWithCredencials } = await loadService(false);
    postMock.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 500,
        data: {},
      },
    });

    await expect(loginWithCredencials('professor@unb.br', 'secret')).rejects.toThrow(
      'Erro ao entrar. Tente novamente.',
    );
  });

  it('throws a generic message for non axios login errors', async () => {
    const { loginWithCredencials } = await loadService(false);
    postMock.mockRejectedValueOnce(new Error('erro inesperado'));

    await expect(loginWithCredencials('professor@unb.br', 'secret')).rejects.toThrow(
      'Erro ao entrar. Tente novamente.',
    );
  });

  it('throws a friendly message when authenticated user endpoint is unreachable', async () => {
    const { getAuthenticatedUser } = await loadService(false);
    getMock.mockRejectedValueOnce({ isAxiosError: true });

    await expect(getAuthenticatedUser()).rejects.toThrow(
      'Nao foi possivel conectar ao servidor. Tente novamente.',
    );
  });

  it('throws the backend message when authenticated session is invalid', async () => {
    const { getAuthenticatedUser } = await loadService(false);
    getMock.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
        data: { erro: { mensagem: 'Sessao expirada' } },
      },
    });

    await expect(getAuthenticatedUser()).rejects.toThrow('Sessao expirada');
  });

  it('throws a fallback session message when authenticated session has no backend message', async () => {
    const { getAuthenticatedUser } = await loadService(false);
    getMock.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 403,
        data: {},
      },
    });

    await expect(getAuthenticatedUser()).rejects.toThrow(
      'Sessao expirada. Faca login novamente.',
    );
  });

  it('throws a generic message for unexpected authenticated user errors', async () => {
    const { getAuthenticatedUser } = await loadService(false);
    getMock.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 500,
        data: {},
      },
    });

    await expect(getAuthenticatedUser()).rejects.toThrow(
      'Nao foi possivel carregar o usuario autenticado.',
    );
  });

  it('extrai "mensagem" direta do corpo da resposta (linha 69)', async () => {
    const { loginWithCredencials } = await loadService(false);
    postMock.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
        data: { mensagem: 'Mensagem flat vinda da API' },
      },
    });

    await expect(loginWithCredencials('email@unb.br', 'senha')).rejects.toThrow('Mensagem flat vinda da API');
  });

  it('extrai "message" direta do corpo da resposta (linha 69)', async () => {
    const { loginWithCredencials } = await loadService(false);
    postMock.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
        data: { message: 'Message flat vinda da API' },
      },
    });

    await expect(loginWithCredencials('email@unb.br', 'senha')).rejects.toThrow('Message flat vinda da API');
  });

  it('usa fallback de 401 quando a API não retorna uma mensagem extraível (linha 107)', async () => {
    const { loginWithCredencials } = await loadService(false);
    postMock.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
        data: {}, 
      },
    });

    await expect(loginWithCredencials('email@unb.br', 'senha')).rejects.toThrow('Email ou senha invalidos');
  });

  it('usa fallback de 403 quando a API não retorna uma mensagem extraível (linha 111)', async () => {
    const { loginWithCredencials } = await loadService(false);
    postMock.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 403,
        data: {}, 
      },
    });

    await expect(loginWithCredencials('email@unb.br', 'senha')).rejects.toThrow('Conta desativada. Entre em contato com o administrador.');
  });

  it('lança erro genérico quando getAuthenticatedUser falha com um erro que não é do Axios (linha 129)', async () => {
    const { getAuthenticatedUser } = await loadService(false);
    getMock.mockRejectedValueOnce(new Error('Erro puro do JS/Navegador'));

    await expect(getAuthenticatedUser()).rejects.toThrow('Nao foi possivel carregar o usuario autenticado.');
  });
});


describe('mockAuthService internal branches (USE_MOCKS = true)', () => {
  it('throws error when mock login receives an unknown email', async () => {
    const { loginWithCredencials } = await loadService(true);
    
    await expect(loginWithCredencials('email_inexistente@unb.br', 'senha')).rejects.toThrow(
      'Email ou senha invalidos'
    );
  });

  it('returns STUDENT_USER when storage has student token explicitly', async () => {
    const { getAuthenticatedUser } = await loadService(true);
    
    localStorage.setItem('access_token', 'mock-access-token');
    
    const user = await getAuthenticatedUser();
    expect(user.role).toBe('STUDENT');
    expect(user.email).toBe('aluno@unb.br');
  });

  it('returns authenticatedMockUser fallback when token is invalid or missing', async () => {
    const { loginWithCredencials, getAuthenticatedUser } = await loadService(true);
    
    await loginWithCredencials('professor@unb.br', 'any');
    
    localStorage.setItem('access_token', 'token-completamente-invalido');
    
    const user = await getAuthenticatedUser();
    expect(user.role).toBe('PROFESSOR');
  });

  it('returns null from getStoredAccessToken when localStorage throws (covering catch block)', async () => {
    const { getAuthenticatedUser } = await loadService(true);
    
    const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    
    Object.defineProperty(globalThis, 'localStorage', {
      get: () => { throw new Error('Acesso Negado'); },
      configurable: true,
    });

    const user = await getAuthenticatedUser();
    expect(user).toBeDefined();

    if (originalLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
    }
  });
});
