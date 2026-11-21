import { httpClient } from '../../../../src/shared/api/httpClient';
import {
  buscarPerfilSocial,
  listarAmigosSociais,
} from '../../../../src/features/social-profile/socialProfileService';
import type {
  PerfilSocial,
  RespostaAmigosSociais,
} from '../../../../src/features/social-profile/types';

jest.mock('../../../../src/shared/api/httpClient', () => ({
  httpClient: {
    get: jest.fn(),
  },
}));

jest.mock('../../../../src/features/manage-questions/model/questionService', () => ({
  extractErrorMessage: jest.fn(() => 'Erro simulado pelo mock'),
}));

const httpClientMock = httpClient as unknown as { get: jest.Mock };

describe('socialProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarAmigosSociais', () => {
    it('lista os perfis sociais dos amigos, repassando os parametros de busca', async () => {
      const resposta: RespostaAmigosSociais = {
        dados: [],
        metadados: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      httpClientMock.get.mockResolvedValue({ data: resposta });

      const resultado = await listarAmigosSociais({ nome: 'Maria', page: 2 });

      expect(httpClientMock.get).toHaveBeenCalledWith('/amizade/amigos/perfis', {
        params: { nome: 'Maria', page: 2 },
      });
      expect(resultado).toBe(resposta);
    });

    it('funciona sem parametros', async () => {
      const resposta: RespostaAmigosSociais = {
        dados: [],
        metadados: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      httpClientMock.get.mockResolvedValue({ data: resposta });

      await listarAmigosSociais();

      expect(httpClientMock.get).toHaveBeenCalledWith('/amizade/amigos/perfis', {
        params: undefined,
      });
    });

    it('relanca o erro traduzido quando a chamada falha', async () => {
      httpClientMock.get.mockRejectedValue(new Error('rede fora'));

      await expect(listarAmigosSociais()).rejects.toThrow('Erro simulado pelo mock');
    });
  });

  describe('buscarPerfilSocial', () => {
    it('busca o perfil social publico de um usuario', async () => {
      const perfil: PerfilSocial = {
        usuario: {
          id: 'usuario-1',
          nome: 'Maria Souza',
          nickname: null,
          curso: null,
          semestre: null,
        },
        cosmeticos: [],
        conquistasDestacadas: [],
      };
      httpClientMock.get.mockResolvedValue({ data: { mensagem: 'ok', dados: perfil } });

      const resultado = await buscarPerfilSocial('usuario-1');

      expect(httpClientMock.get).toHaveBeenCalledWith('/perfis/usuario-1/social');
      expect(resultado).toBe(perfil);
    });

    it('relanca o erro traduzido quando a chamada falha', async () => {
      httpClientMock.get.mockRejectedValue(new Error('404'));

      await expect(buscarPerfilSocial('usuario-1')).rejects.toThrow('Erro simulado pelo mock');
    });
  });
});
