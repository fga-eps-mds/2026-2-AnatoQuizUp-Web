import { httpClient } from '../../../../../src/shared/api/httpClient';
import {
  atualizarCasoOsce,
  buscarCasoOscePorId,
  criarCasoOsce,
  excluirCasoOsce,
  listarCasosOsce,
} from '../../../../../src/features/manage-casos-osce/model/casoOsceService';
import type { CasoOsce } from '../../../../../src/features/manage-casos-osce/model/types';

jest.mock('../../../../../src/shared/api/httpClient', () => ({
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const httpClientMock = httpClient as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

const caso: CasoOsce = {
  id: 'caso-1',
  titulo: 'Dor abdominal',
  especialidade: 'Cirurgia',
  dificuldade: 'MEDIA',
  diagnosticoEsperado: 'Apendicite',
  local: 'UPA',
  papelEstudante: 'Médico(a)',
  idadePaciente: 20,
  sexoPaciente: 'Feminino',
  queixaPaciente: 'Dor abdominal',
  perfilPaciente: null,
  historiaSintomas: null,
  exameFisico: null,
  status: 'RASCUNHO',
  exames: [],
  criadoEm: '2026-11-01T00:00:00.000Z',
};

describe('casoOsceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarCasosOsce', () => {
    it('lista os casos cadastrados', async () => {
      httpClientMock.get.mockResolvedValue({ data: { dados: [caso] } });

      const resultado = await listarCasosOsce();

      expect(httpClientMock.get).toHaveBeenCalledWith('/casos-osce');
      expect(resultado).toEqual([caso]);
    });

    it('relanca o erro traduzido quando a chamada falha', async () => {
      httpClientMock.get.mockRejectedValue(new Error('rede fora'));

      await expect(listarCasosOsce()).rejects.toThrow(
        'Não foi possível conectar ao servidor. Tente novamente.',
      );
    });
  });

  describe('buscarCasoOscePorId', () => {
    it('busca um caso pelo id', async () => {
      httpClientMock.get.mockResolvedValue({ data: { mensagem: 'ok', dados: caso } });

      const resultado = await buscarCasoOscePorId('caso-1');

      expect(httpClientMock.get).toHaveBeenCalledWith('/casos-osce/caso-1');
      expect(resultado).toBe(caso);
    });

    it('relanca o erro traduzido vindo do backend', async () => {
      httpClientMock.get.mockRejectedValue({
        isAxiosError: true,
        response: { data: { erro: { mensagem: 'Caso não encontrado' } } },
      });

      await expect(buscarCasoOscePorId('caso-x')).rejects.toThrow('Caso não encontrado');
    });
  });

  describe('criarCasoOsce', () => {
    it('cria um caso (rascunho) com o payload do passo 1', async () => {
      httpClientMock.post.mockResolvedValue({ data: { mensagem: 'ok', dados: caso } });

      const resultado = await criarCasoOsce({ titulo: 'Dor abdominal' });

      expect(httpClientMock.post).toHaveBeenCalledWith('/casos-osce', { titulo: 'Dor abdominal' });
      expect(resultado).toBe(caso);
    });

    it('relanca a mensagem generica quando o backend nao devolve mensagem conhecida', async () => {
      httpClientMock.post.mockRejectedValue({ isAxiosError: true, response: { data: {} } });

      await expect(criarCasoOsce({})).rejects.toThrow('Não foi possível salvar o caso OSCE.');
    });
  });

  describe('atualizarCasoOsce', () => {
    it('atualiza (merge parcial) os campos do passo atual via PATCH', async () => {
      httpClientMock.patch.mockResolvedValue({ data: { mensagem: 'ok', dados: caso } });

      const resultado = await atualizarCasoOsce('caso-1', { local: 'UPA' });

      expect(httpClientMock.patch).toHaveBeenCalledWith('/casos-osce/caso-1', { local: 'UPA' });
      expect(resultado).toBe(caso);
    });

    it('relanca o erro traduzido quando a chamada falha', async () => {
      httpClientMock.patch.mockRejectedValue(new Error('timeout'));

      await expect(atualizarCasoOsce('caso-1', {})).rejects.toThrow(
        'Não foi possível conectar ao servidor. Tente novamente.',
      );
    });
  });

  describe('excluirCasoOsce', () => {
    it('exclui o caso via DELETE (soft delete, tentativas preservadas)', async () => {
      httpClientMock.delete.mockResolvedValue({});

      await excluirCasoOsce('caso-1');

      expect(httpClientMock.delete).toHaveBeenCalledWith('/casos-osce/caso-1');
    });

    it('relanca a mensagem do backend quando o caso nao existe (404)', async () => {
      httpClientMock.delete.mockRejectedValue({
        isAxiosError: true,
        response: { data: { erro: { mensagem: 'Caso OSCE não encontrado.' } } },
      });

      await expect(excluirCasoOsce('caso-x')).rejects.toThrow('Caso OSCE não encontrado.');
    });

    it('usa um fallback especifico de exclusao quando o backend nao devolve mensagem conhecida', async () => {
      httpClientMock.delete.mockRejectedValue({ isAxiosError: true, response: { data: {} } });

      await expect(excluirCasoOsce('caso-1')).rejects.toThrow('Não foi possível excluir o caso OSCE.');
    });
  });
});
