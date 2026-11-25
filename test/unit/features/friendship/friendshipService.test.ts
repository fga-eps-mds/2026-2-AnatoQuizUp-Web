import { httpClient } from '../../../../src/shared/api/httpClient';
import {
  aceitarConvite,
  alterarVisibilidade,
  buscarColegas,
  buscarPerfilPublico,
  desfazerAmizade,
  enviarSolicitacao,
  listarAmigos,
  listarConvitesEnviados,
  listarConvitesRecebidos,
  recusarConvite,
} from '../../../../src/features/friendship/friendshipService';

jest.mock('../../../../src/shared/api/httpClient', () => ({
  httpClient: {
    delete: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../../../../src/features/manage-questions/model/questionService', () => ({
  extractErrorMessage: jest.fn(() => 'Erro simulado pelo mock'),
}));

const respostaPaginada = {
  dados: [
    {
      id: 'amizade-1',
      criadoEm: '2026-06-01T00:00:00.000Z',
      atualizadoEm: '2026-06-01T00:00:00.000Z',
      excluidoEm: null,
      usuarioOrigemId: 'usuario-1',
      usuarioDestinoId: 'usuario-2',
      statusAmizade: 'PENDENTE',
      amigo: {
        id: 'usuario-2',
        nome: 'Maria Souza',
        nickname: 'maria',
        curso: 'Medicina',
        semestre: '5',
      },
    },
  ],
  metadados: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  },
};

describe('friendshipService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve buscar colegas com parametros', async () => {
    const resposta = {
      dados: [respostaPaginada.dados[0].amigo],
      metadados: respostaPaginada.metadados,
    };
    (httpClient.get as jest.Mock).mockResolvedValue({ data: resposta });

    const resultado = await buscarColegas({ nome: 'maria', page: 1, limit: 10 });

    expect(httpClient.get).toHaveBeenCalledWith('/amizade/busca', {
      params: { nome: 'maria', page: 1, limit: 10 },
    });
    expect(resultado).toEqual(resposta);
  });

  it('deve enviar solicitacao de amizade', async () => {
    const resposta = {
      mensagem: 'Solicitação enviada com sucesso',
      solicitacao: {
        id: 'amizade-1',
        usuarioOrigemId: 'usuario-1',
        usuarioDestinoId: 'usuario-2',
        statusAmizade: 'PENDENTE',
        criadoEm: '2026-06-01T00:00:00.000Z',
        atualizadoEm: '2026-06-01T00:00:00.000Z',
        excluidoEm: null,
      },
    };
    (httpClient.post as jest.Mock).mockResolvedValue({ data: resposta });

    const resultado = await enviarSolicitacao('usuario-2');

    expect(httpClient.post).toHaveBeenCalledWith('/amizade', { id: 'usuario-2' });
    expect(resultado).toEqual(resposta);
  });

  it('deve listar convites recebidos', async () => {
    (httpClient.get as jest.Mock).mockResolvedValue({ data: respostaPaginada });

    const resultado = await listarConvitesRecebidos({ page: 1 });

    expect(httpClient.get).toHaveBeenCalledWith('/amizade/convites/recebidos', {
      params: { page: 1 },
    });
    expect(resultado).toEqual(respostaPaginada);
  });

  it('deve listar convites enviados', async () => {
    (httpClient.get as jest.Mock).mockResolvedValue({ data: respostaPaginada });

    const resultado = await listarConvitesEnviados({ limit: 10 });

    expect(httpClient.get).toHaveBeenCalledWith('/amizade/convites/enviados', {
      params: { limit: 10 },
    });
    expect(resultado).toEqual(respostaPaginada);
  });

  it('deve aceitar convite', async () => {
    const resposta = { mensagem: 'Solicitação processada com sucesso' };
    (httpClient.patch as jest.Mock).mockResolvedValue({ data: resposta });

    const resultado = await aceitarConvite('amizade-1');

    expect(httpClient.patch).toHaveBeenCalledWith('/amizade/aceitar', {
      id: 'amizade-1',
    });
    expect(resultado).toEqual(resposta);
  });

  it('deve recusar convite', async () => {
    const resposta = { mensagem: 'Solicitação processada com sucesso' };
    (httpClient.patch as jest.Mock).mockResolvedValue({ data: resposta });

    const resultado = await recusarConvite('amizade-1');

    expect(httpClient.patch).toHaveBeenCalledWith('/amizade/recusar', {
      id: 'amizade-1',
    });
    expect(resultado).toEqual(resposta);
  });

  it('deve listar amigos', async () => {
    (httpClient.get as jest.Mock).mockResolvedValue({ data: respostaPaginada });

    const resultado = await listarAmigos({ nickname: 'maria' });

    expect(httpClient.get).toHaveBeenCalledWith('/amizade', {
      params: { nickname: 'maria' },
    });
    expect(resultado).toEqual(respostaPaginada);
  });

  it('deve desfazer amizade enviando id no body do delete', async () => {
    const resposta = { mensagem: 'Amizade desfeita com sucesso' };
    (httpClient.delete as jest.Mock).mockResolvedValue({ data: resposta });

    const resultado = await desfazerAmizade('amizade-1');

    expect(httpClient.delete).toHaveBeenCalledWith('/amizade', {
      data: { id: 'amizade-1' },
    });
    expect(resultado).toEqual(resposta);
  });

  it('deve alterar visibilidade explicitamente', async () => {
    const resposta = { mensagem: 'Visibilidade alterada com sucesso' };
    (httpClient.patch as jest.Mock).mockResolvedValue({ data: resposta });

    const resultado = await alterarVisibilidade(false);

    expect(httpClient.patch).toHaveBeenCalledWith('/amizade/visibilidade', {
      visivel: false,
    });
    expect(resultado).toEqual(resposta);
  });

  it('deve normalizar erro usando extractErrorMessage', async () => {
    (httpClient.get as jest.Mock).mockRejectedValue(new Error('Falha'));

    await expect(buscarColegas()).rejects.toThrow('Erro simulado pelo mock');
  });

  it('deve normalizar erro usando extractErrorMessage em todas as demais chamadas', async () => {
    (httpClient.get as jest.Mock).mockRejectedValue(new Error('Falha'));
    (httpClient.post as jest.Mock).mockRejectedValue(new Error('Falha'));
    (httpClient.patch as jest.Mock).mockRejectedValue(new Error('Falha'));
    (httpClient.delete as jest.Mock).mockRejectedValue(new Error('Falha'));

    await expect(enviarSolicitacao('usuario-2')).rejects.toThrow('Erro simulado pelo mock');
    await expect(listarConvitesRecebidos()).rejects.toThrow('Erro simulado pelo mock');
    await expect(listarConvitesEnviados()).rejects.toThrow('Erro simulado pelo mock');
    await expect(aceitarConvite('amizade-1')).rejects.toThrow('Erro simulado pelo mock');
    await expect(recusarConvite('amizade-1')).rejects.toThrow('Erro simulado pelo mock');
    await expect(listarAmigos()).rejects.toThrow('Erro simulado pelo mock');
    await expect(desfazerAmizade('amizade-1')).rejects.toThrow('Erro simulado pelo mock');
    await expect(alterarVisibilidade(true)).rejects.toThrow('Erro simulado pelo mock');
  });

  it('deve buscar perfil de amigo e desembrulhar o envelope da API', async () => {
    const perfil = {
      id: 'usuario-2',
      nome: 'Maria Souza',
      nickname: 'maria',
      curso: 'Medicina',
      semestre: '5',
      perfilPrivado: false,
    };
    (httpClient.get as jest.Mock).mockResolvedValue({
      data: {
        mensagem: 'Perfil encontrado',
        dados: perfil,
      },
    });

    await expect(buscarPerfilPublico('usuario-2')).resolves.toEqual(perfil);
    expect(httpClient.get).toHaveBeenCalledWith('/usuarios/usuario-2/perfil');
  });

  it('deve normalizar erro ao buscar perfil de amigo', async () => {
    (httpClient.get as jest.Mock).mockRejectedValue(new Error('Falha'));

    await expect(buscarPerfilPublico('usuario-2')).rejects.toThrow(
      'Erro simulado pelo mock',
    );
  });
});
