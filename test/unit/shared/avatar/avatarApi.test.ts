import { httpClient } from '../../../../src/shared/api/httpClient';
import { buscarAparenciaRemota, salvarAparenciaRemota } from '../../../../src/shared/avatar/avatarApi';
import type { AparenciaAvatar } from '../../../../src/shared/avatar/aparencia';

jest.mock('../../../../src/shared/api/httpClient', () => ({
  httpClient: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

const httpClientMock = httpClient as unknown as { get: jest.Mock; put: jest.Mock };

const aparencia: AparenciaAvatar = {
  corCerebro: 'roxo',
  cabelo: 'cacheado',
  acessorio: 'oculos',
  luva: null,
  calcado: 'tenis-esportivo',
};

describe('avatarApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buscarAparenciaRemota', () => {
    it('busca o proprio avatar quando proprio=true', async () => {
      httpClientMock.get.mockResolvedValue({ data: { dados: aparencia } });

      const resultado = await buscarAparenciaRemota('usuario-1', true);

      expect(httpClientMock.get).toHaveBeenCalledWith('/usuarios/meu-avatar');
      expect(resultado).toBe(aparencia);
    });

    it('busca o avatar de outro usuario pelo id, por padrao', async () => {
      httpClientMock.get.mockResolvedValue({ data: { dados: aparencia } });

      await buscarAparenciaRemota('usuario-2');

      expect(httpClientMock.get).toHaveBeenCalledWith('/usuarios/usuario-2/avatar');
    });

    it('escapa o id do usuario na rota', async () => {
      httpClientMock.get.mockResolvedValue({ data: { dados: aparencia } });

      await buscarAparenciaRemota('usuario com espaço');

      expect(httpClientMock.get).toHaveBeenCalledWith('/usuarios/usuario%20com%20espa%C3%A7o/avatar');
    });
  });

  describe('salvarAparenciaRemota', () => {
    it('salva a aparencia do proprio avatar', async () => {
      httpClientMock.put.mockResolvedValue({ data: { dados: aparencia } });

      const resultado = await salvarAparenciaRemota(aparencia);

      expect(httpClientMock.put).toHaveBeenCalledWith('/usuarios/meu-avatar', aparencia);
      expect(resultado).toBe(aparencia);
    });
  });
});
