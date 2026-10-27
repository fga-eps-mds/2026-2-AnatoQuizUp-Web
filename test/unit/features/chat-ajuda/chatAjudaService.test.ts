jest.mock('../../../../src/shared/api/httpClient', () => ({
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../../../../src/features/manage-questions/model/questionService', () => ({
  extractErrorMessage: jest.fn(() => 'Erro simulado pelo mock'),
}));

import { buscarDicaAjuda, enviarPerguntaAjuda } from '../../../../src/features/chat-ajuda/chatAjudaService';
import { httpClient } from '../../../../src/shared/api/httpClient';

const httpClientMock = httpClient as unknown as { get: jest.Mock; post: jest.Mock };

describe('chatAjudaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buscarDicaAjuda', () => {
    it('retorna a dica quando a chamada tem sucesso', async () => {
      httpClientMock.get.mockResolvedValue({ data: { dica: 'Revise o tema Cranio.' } });

      const resultado = await buscarDicaAjuda();

      expect(httpClientMock.get).toHaveBeenCalledWith('/ia/dica');
      expect(resultado).toBe('Revise o tema Cranio.');
    });

    it('relanca o erro traduzido quando a chamada falha', async () => {
      httpClientMock.get.mockRejectedValue(new Error('falhou'));

      await expect(buscarDicaAjuda()).rejects.toThrow('Erro simulado pelo mock');
    });
  });

  describe('enviarPerguntaAjuda', () => {
    it('envia a pergunta com o contexto e retorna a resposta', async () => {
      httpClientMock.post.mockResolvedValue({ data: { resposta: 'O femur e o osso mais longo.' } });

      const resultado = await enviarPerguntaAjuda('Por que o femur e tao grande?', {
        tema: 'Sistema Esquelético',
        dificuldade: 'Fácil',
        enunciado: 'Qual e o osso mais longo?',
      });

      expect(httpClientMock.post).toHaveBeenCalledWith('/ia/perguntar', {
        pergunta: 'Por que o femur e tao grande?',
        tema: 'Sistema Esquelético',
        dificuldade: 'Fácil',
        enunciado: 'Qual e o osso mais longo?',
      });
      expect(resultado).toBe('O femur e o osso mais longo.');
    });

    it('envia a pergunta sem contexto quando ele nao e informado', async () => {
      httpClientMock.post.mockResolvedValue({ data: { resposta: 'Resposta simples.' } });

      await enviarPerguntaAjuda('Pergunta qualquer');

      expect(httpClientMock.post).toHaveBeenCalledWith('/ia/perguntar', { pergunta: 'Pergunta qualquer' });
    });

    it('relanca o erro traduzido quando a chamada falha', async () => {
      httpClientMock.post.mockRejectedValue(new Error('falhou'));

      await expect(enviarPerguntaAjuda('Pergunta qualquer')).rejects.toThrow('Erro simulado pelo mock');
    });
  });
});
