jest.mock('@/shared/config/env', () => ({
  env: { VITE_API_URL: 'http://localhost' },
}));

import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HistoricoPage } from '../../../../../src/pages/historicoAluno/ui/HistoricoPage';
import * as historicoService from '../../../../../src/features/historico-quiz/historicoQuizService';
import * as randomQuizService from '../../../../../src/features/random-quiz/randomQuizService';

jest.mock('../../../../../src/features/historico-quiz/historicoQuizService');
jest.mock('../../../../../src/features/progressao/ui/HistoricoXp', () => ({
  HistoricoXp: () => <div data-testid="historico-xp">Historico de XP</div>,
}));
jest.mock('../../../../../src/features/random-quiz/randomQuizService');

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('HistoricoPage', () => {
  const itemHistoricoBase = {
    id: '1',
    criadoEm: '2026-05-23T15:00:00.000Z',
    respostaMarcada: 'E',
    questaoId: 'q1',
    tentativas: 4,
    distribuicao: { A: 0, B: 0, C: 2, D: 0, E: 2 },
    questao: {
      tema: { id: 't1', nome: 'Tórax' },
      enunciado: 'Questão Teste 1',
      tipoQuestao: 'MULTIPLA_ESCOLHA',
      respostaCorreta: 'E',
      dificuldade: 'MEDIA',
      saibaMais: 'Explicação teste',
      alternativas: { alternativaC: 'C Errada', alternativaE: 'E Certa' },
    },
  };

  const mockResponse = {
    dados: [itemHistoricoBase],
    metadados: { page: 1, limit: 50, total: 1, totalPages: 1 },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (randomQuizService.buscarQuantidadeDeQuestoesPorTema as jest.Mock).mockResolvedValue([
      { nome: 'Neuroanatomia' },
      { nome: 'Tórax' },
    ]);
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it('deve renderizar o histórico agrupado por sessão e navegar para os detalhes', async () => {
    (historicoService.buscarHistoricoQuiz as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <HistoricoPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Carregando seu histórico...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Histórico de Prática')).toBeInTheDocument();
      expect(screen.getByText('23/05/2026')).toBeInTheDocument();
      expect(screen.getByText('MEDIA')).toBeInTheDocument();
      expect(screen.getByText('1 questões')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Tórax')).toHaveLength(2);

    fireEvent.click(screen.getByText('23/05/2026'));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/aluno/historico/detalhes',
      expect.objectContaining({
        state: expect.objectContaining({
          sessao: expect.objectContaining({
            tema: 'Tórax',
            dificuldade: 'MEDIA',
          }),
        }),
      }),
    );
  });

  it('deve agrupar duas respostas na mesma sessão', async () => {
    (historicoService.buscarHistoricoQuiz as jest.Mock).mockResolvedValue({
      dados: [
        itemHistoricoBase,
        {
          ...itemHistoricoBase,
          id: '2',
          questaoId: 'q2',
          criadoEm: '2026-05-23T16:00:00.000Z',
        },
      ],
      metadados: { page: 1, limit: 50, total: 2, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <HistoricoPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('2 questões')).toBeInTheDocument();
    });
  });

  it('deve testar os filtros de tema', async () => {
    (historicoService.buscarHistoricoQuiz as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <HistoricoPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('Tórax').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Neuroanatomia' }));

    await waitFor(() => {
      expect(historicoService.buscarHistoricoQuiz).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        tema: 'Neuroanatomia',
      });
    });
  });

  it('deve testar o filtro de todos os temas', async () => {
    (historicoService.buscarHistoricoQuiz as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <HistoricoPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('23/05/2026')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Todos os Temas' }));

    expect(screen.getByRole('button', { name: 'Todos os Temas' })).toBeInTheDocument();
  });

  it('deve exibir tela vazia quando não houver histórico', async () => {
    (historicoService.buscarHistoricoQuiz as jest.Mock).mockResolvedValue({
      dados: [],
      metadados: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });

    render(
      <MemoryRouter>
        <HistoricoPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
      expect(screen.getByText('Você não tem histórico para este filtro.')).toBeInTheDocument();
    });
  });

  it('deve cobrir o catch de erro da busca do histórico', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (historicoService.buscarHistoricoQuiz as jest.Mock).mockRejectedValue(new Error('Erro interno'));

    render(
      <MemoryRouter>
        <HistoricoPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao buscar histórico:',
        expect.any(Error),
      );
    });
  });

  it('deve cobrir o catch de erro ao carregar filtros', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (randomQuizService.buscarQuantidadeDeQuestoesPorTema as jest.Mock).mockRejectedValue(
      new Error('Erro nos filtros'),
    );

    (historicoService.buscarHistoricoQuiz as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <HistoricoPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao carregar filtros',
        expect.any(Error),
      );
    });
  });

  it('deve paginar para próxima página e voltar para a página anterior', async () => {
    const respostaPagina1 = {
      dados: [itemHistoricoBase],
      metadados: { page: 1, limit: 50, total: 2, totalPages: 2 },
    };

    const respostaPagina2 = {
      dados: [
        {
          ...itemHistoricoBase,
          id: '2',
          criadoEm: '2026-05-24T15:00:00.000Z',
        },
      ],
      metadados: { page: 2, limit: 50, total: 2, totalPages: 2 },
    };

    (historicoService.buscarHistoricoQuiz as jest.Mock)
      .mockResolvedValueOnce(respostaPagina1)
      .mockResolvedValueOnce(respostaPagina2)
      .mockResolvedValueOnce(respostaPagina1);

    render(
      <MemoryRouter>
        <HistoricoPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('23/05/2026')).toBeInTheDocument();
    });

    let botoes = screen.getAllByRole('button');
    const botaoProximaPagina = botoes[botoes.length - 1];

    fireEvent.click(botaoProximaPagina);

    await waitFor(() => {
      expect(historicoService.buscarHistoricoQuiz).toHaveBeenCalledWith({
        page: 2,
        limit: 50,
        tema: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('24/05/2026')).toBeInTheDocument();
    });

    botoes = screen.getAllByRole('button');
    const botaoPaginaAnterior = botoes[botoes.length - 3];

    fireEvent.click(botaoPaginaAnterior);

    await waitFor(() => {
      expect(historicoService.buscarHistoricoQuiz).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        tema: undefined,
      });
    });
  });

  it('deve paginar mantendo o tema selecionado', async () => {
    const respostaInicial = {
      dados: [itemHistoricoBase],
      metadados: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };

    const respostaTemaPagina1 = {
      dados: [
        {
          ...itemHistoricoBase,
          id: '2',
          questao: {
            ...itemHistoricoBase.questao,
            tema: { id: 't2', nome: 'Neuroanatomia' },
          },
        },
      ],
      metadados: { page: 1, limit: 50, total: 2, totalPages: 2 },
    };

    const respostaTemaPagina2 = {
      dados: [
        {
          ...itemHistoricoBase,
          id: '3',
          criadoEm: '2026-05-24T15:00:00.000Z',
          questao: {
            ...itemHistoricoBase.questao,
            tema: { id: 't2', nome: 'Neuroanatomia' },
          },
        },
      ],
      metadados: { page: 2, limit: 50, total: 2, totalPages: 2 },
    };

    (historicoService.buscarHistoricoQuiz as jest.Mock)
      .mockResolvedValueOnce(respostaInicial)
      .mockResolvedValueOnce(respostaTemaPagina1)
      .mockResolvedValueOnce(respostaTemaPagina2);

    render(
      <MemoryRouter>
        <HistoricoPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('23/05/2026')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Neuroanatomia' }));

    await waitFor(() => {
      expect(historicoService.buscarHistoricoQuiz).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        tema: 'Neuroanatomia',
      });
    });

    const botoes = screen.getAllByRole('button');
    const botaoProximaPagina = botoes[botoes.length - 1];

    fireEvent.click(botaoProximaPagina);

    await waitFor(() => {
      expect(historicoService.buscarHistoricoQuiz).toHaveBeenCalledWith({
        page: 2,
        limit: 50,
        tema: 'Neuroanatomia',
      });
    });
  });

  it('deve cobrir erro ao paginar o histórico', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const respostaPagina1 = {
      dados: [itemHistoricoBase],
      metadados: { page: 1, limit: 50, total: 2, totalPages: 2 },
    };

    (historicoService.buscarHistoricoQuiz as jest.Mock)
      .mockResolvedValueOnce(respostaPagina1)
      .mockRejectedValueOnce(new Error('Erro ao paginar histórico'));

    render(
      <MemoryRouter>
        <HistoricoPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('23/05/2026')).toBeInTheDocument();
    });

    const botoes = screen.getAllByRole('button');
    const botaoProximaPagina = botoes[botoes.length - 1];

    fireEvent.click(botaoProximaPagina);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao buscar histórico:',
        expect.any(Error),
      );
    });
  });

  it('alterna para a aba de XP recebido e volta para as sessões de prática', async () => {
    (historicoService.buscarHistoricoQuiz as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <HistoricoPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('23/05/2026')).toBeInTheDocument());
    expect(screen.queryByTestId('historico-xp')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sessões de prática' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'XP recebido' }));

    expect(screen.getByTestId('historico-xp')).toBeInTheDocument();
    expect(screen.queryByText('23/05/2026')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'XP recebido' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Sessões de prática' }));

    expect(screen.getByText('23/05/2026')).toBeInTheDocument();
    expect(screen.queryByTestId('historico-xp')).not.toBeInTheDocument();
  });
});
