import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { buscarHistoricoXp } from '../../../../../src/features/progressao/progressaoService';
import type {
  HistoricoXpItem,
  ProgressoNivel,
  ResultadoTentativa,
} from '../../../../../src/features/progressao/types';
import { BarraNivel } from '../../../../../src/features/progressao/ui/BarraNivel';
import { HistoricoXp } from '../../../../../src/features/progressao/ui/HistoricoXp';
import { RecompensaQuiz } from '../../../../../src/features/progressao/ui/RecompensaQuiz';

jest.mock('../../../../../src/features/progressao/progressaoService', () => ({
  buscarHistoricoXp: jest.fn(),
}));

const historicoMock = buscarHistoricoXp as jest.Mock;

const progresso = (over: Partial<ProgressoNivel> = {}): ProgressoNivel => ({
  xpTotal: 150,
  nivel: 2,
  proximoNivel: 3,
  xpNoNivel: 50,
  xpNecessarioNoNivel: 200,
  xpFaltante: 150,
  percentual: 25,
  ...over,
});

const resultado = (over: Partial<ResultadoTentativa> = {}): ResultadoTentativa => ({
  tentativaId: 't1',
  tema: 'Abdome Agudo',
  dificuldade: 'FACIL',
  totalQuestoes: 4,
  totalAcertos: 3,
  jaConcluida: false,
  recompensa: { xpBase: 20, bonusDesempenho: 15, bonusPowerUp: 0, xpTotalRecebido: 35 },
  progresso: progresso(),
  subiuDeNivel: false,
  nivelAnterior: 2,
  ...over,
});

describe('BarraNivel', () => {
  it('mostra nivel, XP dentro do nivel e quanto falta para o proximo', () => {
    render(<BarraNivel progresso={progresso()} />);

    expect(screen.getByText('Nível 2')).toBeInTheDocument();
    expect(screen.getByText('50 / 200 XP')).toBeInTheDocument();
    expect(screen.getByText('Faltam 150 XP para o nível 3')).toBeInTheDocument();
    const barra = screen.getByRole('progressbar', { name: 'Progresso para o nível 3' });
    expect(barra).toHaveAttribute('aria-valuenow', '25');
  });

  it('limita o percentual entre 0 e 100', () => {
    const { rerender } = render(<BarraNivel progresso={progresso({ percentual: 180 })} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

    rerender(<BarraNivel progresso={progresso({ percentual: -5 })} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});

describe('RecompensaQuiz', () => {
  it('detalha XP base, bonus, total recebido, XP acumulado e nivel atual', () => {
    render(<RecompensaQuiz resultado={resultado()} onJogarDeNovo={jest.fn()} onVoltar={jest.fn()} />);

    expect(screen.getByRole('heading', { name: 'Quiz concluído!' })).toBeInTheDocument();
    expect(screen.getByText('Abdome Agudo · FACIL')).toBeInTheDocument();
    expect(screen.getByText('Você acertou 3 de 4 questões (75%)')).toBeInTheDocument();
    expect(screen.getByText('XP base')).toBeInTheDocument();
    expect(screen.getByText('+20 XP')).toBeInTheDocument();
    expect(screen.getByText('Bônus por desempenho')).toBeInTheDocument();
    expect(screen.getByText('+15 XP')).toBeInTheDocument();
    expect(screen.getByText('+35 XP')).toBeInTheDocument();
    expect(screen.getByText('150 XP')).toBeInTheDocument();
    expect(screen.getByText('Nível 2')).toBeInTheDocument();
    expect(screen.getByText('Faltam 150 XP para o nível 3')).toBeInTheDocument();
    // Sem power-up e sem subida de nivel, esses blocos nao aparecem.
    expect(screen.queryByText('Bônus de power-up')).not.toBeInTheDocument();
    expect(screen.queryByText(/Parabéns/)).not.toBeInTheDocument();
  });

  it('mostra o bonus de power-up quando existe', () => {
    render(
      <RecompensaQuiz
        resultado={resultado({
          recompensa: { xpBase: 20, bonusDesempenho: 15, bonusPowerUp: 10, xpTotalRecebido: 45 },
        })}
        onJogarDeNovo={jest.fn()}
        onVoltar={jest.fn()}
      />,
    );

    expect(screen.getByText('Bônus de power-up')).toBeInTheDocument();
    expect(screen.getByText('+10 XP')).toBeInTheDocument();
  });

  it('celebra o novo nivel quando o aluno sobe de nivel', () => {
    render(
      <RecompensaQuiz
        resultado={resultado({
          subiuDeNivel: true,
          nivelAnterior: 2,
          progresso: progresso({ nivel: 3, proximoNivel: 4 }),
        })}
        onJogarDeNovo={jest.fn()}
        onVoltar={jest.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Parabéns! Você alcançou o nível 3');
    expect(screen.getByRole('status')).toHaveTextContent('Você saiu do nível 2');
  });

  it('avisa quando a rodada ja tinha sido concluida e trata rodada sem filtros', () => {
    render(
      <RecompensaQuiz
        resultado={resultado({
          jaConcluida: true,
          tema: null,
          dificuldade: null,
          totalQuestoes: 0,
          totalAcertos: 0,
        })}
        onJogarDeNovo={jest.fn()}
        onVoltar={jest.fn()}
      />,
    );

    expect(screen.getByText(/O XP não é concedido novamente/)).toBeInTheDocument();
    expect(screen.getByText('Quiz')).toBeInTheDocument();
    expect(screen.getByText('Você acertou 0 de 0 questões (0%)')).toBeInTheDocument();
  });

  it('dispara as acoes de jogar de novo e de voltar', () => {
    const onJogarDeNovo = jest.fn();
    const onVoltar = jest.fn();
    render(<RecompensaQuiz resultado={resultado()} onJogarDeNovo={onJogarDeNovo} onVoltar={onVoltar} />);

    fireEvent.click(screen.getByRole('button', { name: /Jogar de novo/i }));
    fireEvent.click(screen.getByRole('button', { name: /Escolher outro quiz/i }));

    expect(onJogarDeNovo).toHaveBeenCalledTimes(1);
    expect(onVoltar).toHaveBeenCalledTimes(1);
  });
});

describe('HistoricoXp', () => {
  const item = (over: Partial<HistoricoXpItem> = {}): HistoricoXpItem => ({
    id: 'xp-1',
    data: '2026-10-09T15:00:00.000Z',
    origem: 'QUIZ_CONCLUIDO',
    quiz: {
      tentativaId: 't1',
      tema: 'Abdome Agudo',
      dificuldade: 'FACIL',
      totalQuestoes: 4,
      totalAcertos: 3,
    },
    xpBase: 20,
    bonusDesempenho: 15,
    bonusPowerUp: 0,
    valor: 35,
    ...over,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista data, origem, quiz relacionado e valor', async () => {
    historicoMock.mockResolvedValue({
      dados: [
        item(),
        item({ id: 'xp-2', quiz: null, valor: 1200, data: 'data-invalida' }),
        item({
          id: 'xp-3',
          valor: 10,
          quiz: { tentativaId: 't3', tema: null, dificuldade: null, totalQuestoes: 2, totalAcertos: 1 },
        }),
      ],
      metadados: { page: 1, limit: 10, total: 3, totalPages: 1 },
    });

    render(<HistoricoXp />);

    expect(screen.getByText('Carregando seu XP...')).toBeInTheDocument();
    expect(await screen.findByText('Abdome Agudo · FACIL (3/4 acertos)')).toBeInTheDocument();
    expect(screen.getAllByText('Quiz concluído')).toHaveLength(3);
    expect(screen.getByText('Quiz (1/2 acertos)')).toBeInTheDocument();
    expect(screen.getByText(/\+\s*35 XP/)).toBeInTheDocument();
    expect(screen.getByText(/\+\s*1\.200 XP/)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Valor' })).toBeInTheDocument();
    expect(historicoMock).toHaveBeenCalledWith({ page: 1, limit: 10 });
    // Pagina unica: sem controles de paginacao.
    expect(screen.queryByRole('button', { name: 'Próxima página' })).not.toBeInTheDocument();
  });

  it('mostra o estado vazio quando ainda nao ha XP', async () => {
    historicoMock.mockResolvedValue({
      dados: [],
      metadados: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    render(<HistoricoXp />);

    expect(await screen.findByText('Nenhum XP recebido ainda')).toBeInTheDocument();
  });

  it('mostra a mensagem de erro quando a busca falha', async () => {
    historicoMock.mockRejectedValueOnce(new Error('Falhou'));
    const { unmount } = render(<HistoricoXp />);
    expect(await screen.findByText('Falhou')).toBeInTheDocument();
    unmount();

    historicoMock.mockRejectedValueOnce('erro sem tipo');
    render(<HistoricoXp />);
    expect(await screen.findByText('Erro ao carregar o histórico de XP.')).toBeInTheDocument();
  });

  it('pagina o historico', async () => {
    historicoMock.mockResolvedValue({
      dados: [item()],
      metadados: { page: 1, limit: 10, total: 25, totalPages: 3 },
    });

    render(<HistoricoXp />);

    expect(await screen.findByText('1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
    await waitFor(() => expect(historicoMock).toHaveBeenLastCalledWith({ page: 2, limit: 10 }));
    expect(await screen.findByText('2 de 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    await waitFor(() => expect(historicoMock).toHaveBeenLastCalledWith({ page: 1, limit: 10 }));
  });

  it('ignora a resposta que chega depois de desmontar', async () => {
    let resolver: (valor: unknown) => void = () => {};
    historicoMock.mockReturnValue(new Promise((resolve) => { resolver = resolve; }));

    const { unmount } = render(<HistoricoXp />);
    unmount();
    resolver({ dados: [], metadados: { page: 1, limit: 10, total: 0, totalPages: 0 } });

    await waitFor(() => expect(historicoMock).toHaveBeenCalledTimes(1));
  });
});
