import { resolucaoListaApi } from '../../../../../src/entities/resolucaoLista/api/resolucaoListaApi';
import { httpClient } from '../../../../../src/shared/api/httpClient';

jest.mock('../../../../../src/shared/api/httpClient', () => ({
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
}));

describe('resolucaoListaApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listar - deve fazer GET para /listasAluno', async () => {
    const mockDados = [{ id: '1', nome: 'Lista 1' }];
    (httpClient.get as jest.Mock).mockResolvedValue({ data: { dados: mockDados } });

    const resultado = await resolucaoListaApi.listar('turma-123', 'PENDENTE', 'Anatomia');

    expect(httpClient.get).toHaveBeenCalledWith('/listasAluno', {
      params: { turmaId: 'turma-123', status: 'PENDENTE', busca: 'Anatomia' },
    });
    expect(resultado).toEqual(mockDados);
  });

  it('buscarDetalhes - deve fazer GET para /listasAluno/:id', async () => {
    const mockDados = { id: '1', nome: 'Lista 1' };
    (httpClient.get as jest.Mock).mockResolvedValue({ data: { dados: mockDados } });

    const resultado = await resolucaoListaApi.buscarDetalhes('123');

    expect(httpClient.get).toHaveBeenCalledWith('/listasAluno/123');
    expect(resultado).toEqual(mockDados);
  });

  it('autosave - deve fazer POST para /listasAluno/:id/autosave', async () => {
    (httpClient.post as jest.Mock).mockResolvedValue({ data: { mensagem: 'OK' } });

    const resultado = await resolucaoListaApi.autosave('lista-1', 'q-1', 'A');

    expect(httpClient.post).toHaveBeenCalledWith('/listasAluno/lista-1/autosave', {
      questaoId: 'q-1',
      alternativaMarcada: 'A',
    });
    expect(resultado).toEqual({ mensagem: 'OK' });
  });

  it('submeter - deve fazer POST para /listasAluno/:id/submeter', async () => {
    (httpClient.post as jest.Mock).mockResolvedValue({ data: { mensagem: 'Submetido' } });

    const resultado = await resolucaoListaApi.submeter('lista-1');

    expect(httpClient.post).toHaveBeenCalledWith('/listasAluno/lista-1/submeter');
    expect(resultado).toEqual({ mensagem: 'Submetido' });
  });

  it('baixarPdfAluno - deve fazer GET para /listasAluno/:id/pdf e devolver o base64', async () => {
    (httpClient.get as jest.Mock).mockResolvedValue({ data: { base64: 'JVBERi0x' } });

    const resultado = await resolucaoListaApi.baixarPdfAluno('lista-1');

    expect(httpClient.get).toHaveBeenCalledWith('/listasAluno/lista-1/pdf');
    expect(resultado).toBe('JVBERi0x');
  });
});