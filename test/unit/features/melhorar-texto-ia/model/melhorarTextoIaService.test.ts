import { httpClient } from '../../../../../src/shared/api/httpClient';
import { melhorarTextoIa } from '../../../../../src/features/melhorar-texto-ia/model/melhorarTextoIaService';

jest.mock('../../../../../src/shared/api/httpClient', () => ({
  httpClient: {
    post: jest.fn(),
  },
}));

const httpClientMock = httpClient as unknown as { post: jest.Mock };

describe('melhorarTextoIaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envia campo, texto e contexto, e devolve o texto melhorado', async () => {
    httpClientMock.post.mockResolvedValue({ data: { textoMelhorado: 'Texto reescrito pela IA.' } });

    const resultado = await melhorarTextoIa('titulo', 'texto original', {
      titulo: 'texto original',
      especialidade: 'Cardiologia',
      diagnosticoEsperado: 'Infarto',
    });

    expect(httpClientMock.post).toHaveBeenCalledWith('/ia/osce/melhorar-texto', {
      campo: 'titulo',
      texto: 'texto original',
      contexto: { titulo: 'texto original', especialidade: 'Cardiologia', diagnosticoEsperado: 'Infarto' },
    });
    expect(resultado).toBe('Texto reescrito pela IA.');
  });

  it('funciona sem contexto', async () => {
    httpClientMock.post.mockResolvedValue({ data: { textoMelhorado: 'Reescrito.' } });

    await melhorarTextoIa('local', 'UPA');

    expect(httpClientMock.post).toHaveBeenCalledWith('/ia/osce/melhorar-texto', {
      campo: 'local',
      texto: 'UPA',
      contexto: undefined,
    });
  });

  it('relanca o erro traduzido quando a chamada falha (ex.: 502 da IA)', async () => {
    httpClientMock.post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { erro: { mensagem: 'Serviço de IA indisponível.' } } },
    });

    await expect(melhorarTextoIa('titulo', 'texto')).rejects.toThrow('Serviço de IA indisponível.');
  });

  it('relanca mensagem generica quando a chamada falha sem response (rede)', async () => {
    httpClientMock.post.mockRejectedValue(new Error('network error'));

    await expect(melhorarTextoIa('titulo', 'texto')).rejects.toThrow(
      'Não foi possível conectar ao servidor. Tente novamente.',
    );
  });
});
