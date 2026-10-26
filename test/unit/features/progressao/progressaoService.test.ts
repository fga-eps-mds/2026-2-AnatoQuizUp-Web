import {
  buscarHistoricoElo,
  buscarHistoricoXp,
  buscarNotificacoesElo,
  buscarProgressoXp,
  concluirTentativaQuiz,
  iniciarTentativaQuiz,
  marcarNotificacaoEloLida,
} from '../../../../src/features/progressao/progressaoService';
import { httpClient } from '../../../../src/shared/api/httpClient';

jest.mock('../../../../src/shared/api/httpClient', () => ({
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../../../../src/features/manage-questions/model/questionService', () => ({
  extractErrorMessage: jest.fn(() => 'Erro simulado pelo mock'),
}));

const get = httpClient.get as jest.Mock;
const post = httpClient.post as jest.Mock;

describe('progressaoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inicia a rodada enviando tema e dificuldade', async () => {
    const tentativa = { tentativaId: 't1', totalQuestoes: 4, questoes: [] };
    post.mockResolvedValue({ data: tentativa });

    const resultado = await iniciarTentativaQuiz({ tema: 'Neuro', dificuldade: 'FACIL' });

    expect(post).toHaveBeenCalledWith('/quiz/tentativas', { tema: 'Neuro', dificuldade: 'FACIL' });
    expect(resultado).toEqual(tentativa);
  });

  it('omite filtros vazios ao iniciar a rodada', async () => {
    post.mockResolvedValue({ data: { tentativaId: 't1', totalQuestoes: 1, questoes: [] } });

    await iniciarTentativaQuiz({});

    expect(post).toHaveBeenCalledWith('/quiz/tentativas', {});
  });

  it('conclui a rodada pelo id', async () => {
    const resultado = { tentativaId: 't1', jaConcluida: false };
    post.mockResolvedValue({ data: resultado });

    await expect(concluirTentativaQuiz('t1')).resolves.toEqual(resultado);
    expect(post).toHaveBeenCalledWith('/quiz/tentativas/t1/concluir');
  });

  it('busca o progresso de nivel', async () => {
    const progresso = { xpTotal: 150, nivel: 2 };
    get.mockResolvedValue({ data: progresso });

    await expect(buscarProgressoXp()).resolves.toEqual(progresso);
    expect(get).toHaveBeenCalledWith('/quiz/progresso');
  });

  it('busca o historico de XP com paginacao', async () => {
    const historico = { dados: [], metadados: { page: 2, limit: 10, total: 0, totalPages: 0 } };
    get.mockResolvedValue({ data: historico });

    await expect(buscarHistoricoXp({ page: 2, limit: 10 })).resolves.toEqual(historico);
    expect(get).toHaveBeenCalledWith('/quiz/xp/historico', { params: { page: 2, limit: 10 } });

    await buscarHistoricoXp();
    expect(get).toHaveBeenLastCalledWith('/quiz/xp/historico', { params: {} });
  });

  it('converte falhas em Error com a mensagem extraida', async () => {
    post.mockRejectedValue(new Error('rede'));
    get.mockRejectedValue(new Error('rede'));

    await expect(iniciarTentativaQuiz({})).rejects.toThrow('Erro simulado pelo mock');
    await expect(concluirTentativaQuiz('t1')).rejects.toThrow('Erro simulado pelo mock');
    await expect(buscarProgressoXp()).rejects.toThrow('Erro simulado pelo mock');
    await expect(buscarHistoricoXp()).rejects.toThrow('Erro simulado pelo mock');
  });

  it('busca o historico de elo paginado', async () => {
    const historico = { dados: [], metadados: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    get.mockResolvedValue({ data: historico });

    const resultado = await buscarHistoricoElo({ page: 2, limit: 5 });

    expect(get).toHaveBeenCalledWith('/quiz/progressao/elo/historico', {
      params: { page: 2, limit: 5 },
    });
    expect(resultado).toEqual(historico);
  });

  it('busca as notificacoes de elo com e sem o filtro de nao lidas', async () => {
    get.mockResolvedValue({ data: [] });

    await buscarNotificacoesElo(true);
    expect(get).toHaveBeenCalledWith('/quiz/progressao/notificacoes', {
      params: { apenasNaoLidas: 'true' },
    });

    await buscarNotificacoesElo();
    expect(get).toHaveBeenLastCalledWith('/quiz/progressao/notificacoes', { params: {} });
  });

  it('marca a notificacao de elo como lida', async () => {
    post.mockResolvedValue({ data: null });

    await marcarNotificacaoEloLida('aviso-1');

    expect(post).toHaveBeenCalledWith('/quiz/progressao/notificacoes/aviso-1/lida');
  });

  it('converte falhas das rotas de elo em Error com a mensagem extraida', async () => {
    get.mockRejectedValue(new Error('rede'));
    post.mockRejectedValue(new Error('rede'));

    await expect(buscarHistoricoElo()).rejects.toThrow('Erro simulado pelo mock');
    await expect(buscarNotificacoesElo()).rejects.toThrow('Erro simulado pelo mock');
    await expect(marcarNotificacaoEloLida('aviso-1')).rejects.toThrow('Erro simulado pelo mock');
  });
});
