import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import {
  calcularFaixaEloPorXp,
  FAIXAS_ELO_PADRAO,
  montarJornadaElosLocal,
  obterFaixaEloPorNomeOuCodigo,
  resolverDadosEloProgresso,
} from '../../../../../src/features/progressao/eloUtils';
import { buscarHistoricoXp } from '../../../../../src/features/progressao/progressaoService';
import type {
  HistoricoXpItem,
  ProgressoNivel,
  ResultadoTentativa,
} from '../../../../../src/features/progressao/types';
import { BarraNivel } from '../../../../../src/features/progressao/ui/BarraNivel';
import { EloConquistadoBanner } from '../../../../../src/features/progressao/ui/EloConquistadoBanner';
import { EloIcon } from '../../../../../src/features/progressao/ui/EloIcon';
import { HistoricoXp } from '../../../../../src/features/progressao/ui/HistoricoXp';
import { MinhaProgressaoElo } from '../../../../../src/features/progressao/ui/MinhaProgressaoElo';
import { RecompensaQuiz } from '../../../../../src/features/progressao/ui/RecompensaQuiz';
import { TodosOsElosGrid } from '../../../../../src/features/progressao/ui/TodosOsElosGrid';

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

describe('eloUtils', () => {
  it('calcula a faixa de elo para todos os limites das 7 faixas', () => {
    expect(calcularFaixaEloPorXp(-10).codigo).toBe('CURIOSO');
    expect(calcularFaixaEloPorXp(0).codigo).toBe('CURIOSO');
    expect(calcularFaixaEloPorXp(499).codigo).toBe('CURIOSO');
    expect(calcularFaixaEloPorXp(500).codigo).toBe('ACADEMICO');
    expect(calcularFaixaEloPorXp(1499).codigo).toBe('ACADEMICO');
    expect(calcularFaixaEloPorXp(1500).codigo).toBe('INTERNO');
    expect(calcularFaixaEloPorXp(2999).codigo).toBe('INTERNO');
    expect(calcularFaixaEloPorXp(3000).codigo).toBe('R1');
    expect(calcularFaixaEloPorXp(5999).codigo).toBe('R1');
    expect(calcularFaixaEloPorXp(6000).codigo).toBe('R3');
    expect(calcularFaixaEloPorXp(9999).codigo).toBe('R3');
    expect(calcularFaixaEloPorXp(10000).codigo).toBe('R6');
    expect(calcularFaixaEloPorXp(14999).codigo).toBe('R6');
    expect(calcularFaixaEloPorXp(15000).codigo).toBe('STAFF_DO_SERVICO');
    expect(calcularFaixaEloPorXp(30000).codigo).toBe('STAFF_DO_SERVICO');
  });

  it('busca faixa por codigo ou nome e preserva maior elo na jornada', () => {
    expect(obterFaixaEloPorNomeOuCodigo(null).codigo).toBe('CURIOSO');
    expect(obterFaixaEloPorNomeOuCodigo('inexistente').codigo).toBe('CURIOSO');
    expect(obterFaixaEloPorNomeOuCodigo('R3').nome).toBe('R3');
    expect(obterFaixaEloPorNomeOuCodigo('Staff do serviço').codigo).toBe('STAFF_DO_SERVICO');

    const r3 = obterFaixaEloPorNomeOuCodigo('R3');
    const r6 = obterFaixaEloPorNomeOuCodigo('R6');
    const jornada = montarJornadaElosLocal(800, r3, r6, 0);
    expect(jornada.find((e) => e.codigo === 'R3')?.status).toBe('ELO_ATUAL');
    expect(jornada.find((e) => e.codigo === 'R6')?.status).toBe('PROXIMO_ELO');
  });

  it('resolve dados de elo com progresso nulo, parcial e no elo maximo', () => {
    const vazio = resolverDadosEloProgresso(null);
    expect(vazio.eloAtual.codigo).toBe('CURIOSO');
    expect(vazio.proximoElo?.codigo).toBe('ACADEMICO');
    expect(vazio.xpFaltanteProximoElo).toBe(500);

    const maximo = resolverDadosEloProgresso(progresso({ xpTotal: 16000 }));
    expect(maximo.eloAtual.codigo).toBe('STAFF_DO_SERVICO');
    expect(maximo.proximoElo).toBeNull();
    expect(maximo.xpFaltanteProximoElo).toBe(0);
    expect(maximo.percentualElo).toBe(100);
  });
});

describe('EloIcon', () => {
  it('renderiza os icones de todos os 7 elos', () => {
    FAIXAS_ELO_PADRAO.forEach((faixa) => {
      const { container, unmount } = render(<EloIcon elo={faixa.codigo} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      unmount();
    });
  });
});

describe('BarraNivel', () => {
  it('mostra nivel, elo atual, XP dentro do nivel e quanto falta para o proximo nivel e elo', () => {
    render(<BarraNivel progresso={progresso()} />);

    expect(screen.getByText('Nível 2')).toBeInTheDocument();
    expect(screen.getByText('Curioso')).toBeInTheDocument();
    expect(screen.getByText('50 / 200 XP')).toBeInTheDocument();
    expect(screen.getByText('Faltam 150 XP para o nível 3')).toBeInTheDocument();
    expect(screen.getByText('Faltam 350 XP para Acadêmico')).toBeInTheDocument();
    const barra = screen.getByRole('progressbar', { name: 'Progresso para o nível 3' });
    expect(barra).toHaveAttribute('aria-valuenow', '25');
  });

  it('limita o percentual entre 0 e 100 e mostra elo maximo em Staff do servico', () => {
    const { rerender } = render(<BarraNivel progresso={progresso({ percentual: 180 })} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

    rerender(<BarraNivel progresso={progresso({ percentual: -5, xpTotal: 15500 })} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('Staff do serviço')).toBeInTheDocument();
    expect(screen.getByText('Elo máximo alcançado')).toBeInTheDocument();
  });
});

describe('EloConquistadoBanner, TodosOsElosGrid e MinhaProgressaoElo', () => {
  it('renderiza a conquista de um elo intermediario com XP excedente mantido', () => {
    const onContinuar = jest.fn();
    const onVerJornada = jest.fn();
    const academico = obterFaixaEloPorNomeOuCodigo('ACADEMICO');

    render(
      <EloConquistadoBanner
        novoElo={academico}
        xpRecebido={40}
        xpExcedente={30}
        progresso={progresso({ xpTotal: 530, eloAtual: academico })}
        onContinuar={onContinuar}
        onVerJornada={onVerJornada}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Novo elo conquistado' })).toBeInTheDocument();
    expect(screen.getByText(/Os 30 XP excedentes foram mantidos/)).toBeInTheDocument();
    expect(screen.getByText('Interno')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Progresso para o elo Interno' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver jornada' }));
    expect(onContinuar).toHaveBeenCalledTimes(1);
    expect(onVerJornada).toHaveBeenCalledTimes(1);
  });

  it('renderiza o caso especial do ultimo elo Staff do servico sem proximo marco', () => {
    const staff = obterFaixaEloPorNomeOuCodigo('STAFF_DO_SERVICO');

    render(
      <EloConquistadoBanner
        novoElo={staff}
        xpRecebido={250}
        xpExcedente={200}
        progresso={progresso({ xpTotal: 15200, eloAtual: staff, proximoElo: null })}
        onContinuar={jest.fn()}
        onVerJornada={jest.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Elo máximo alcançado' })).toBeInTheDocument();
    expect(screen.getByText('Não há')).toBeInTheDocument();
    expect(screen.getByText('Sem limite')).toBeInTheDocument();
    expect(screen.getByText('SEM PRÓXIMO ELO')).toBeInTheDocument();
  });

  it('renderiza TodosOsElosGrid com todas as 7 faixas e seus status', () => {
    render(<TodosOsElosGrid progresso={progresso({ xpTotal: 1940 })} />);

    expect(screen.getAllByText('CONQUISTADO')).toHaveLength(2);
    expect(screen.getByText('ELO ATUAL')).toBeInTheDocument();
    expect(screen.getByText('PRÓXIMO ELO')).toBeInTheDocument();
    expect(screen.getByText('ELO MÁXIMO')).toBeInTheDocument();
    expect(screen.getByText('Como funciona a evolução?')).toBeInTheDocument();
  });

  it('renderiza MinhaProgressaoElo no estado intermediario e no elo maximo', () => {
    const onVerTodos = jest.fn();
    const { rerender } = render(
      <MinhaProgressaoElo
        nomeUsuario="Helena Costa"
        totalAcertos={96}
        progresso={progresso({ xpTotal: 1940, nivel: 6 })}
        onVerTodosOsElos={onVerTodos}
      />,
    );

    expect(screen.getByText('Helena Costa')).toBeInTheDocument();
    expect(screen.getByText('Interno → R1')).toBeInTheDocument();
    expect(screen.getByText('Faltam 1.060 XP')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver todos os elos' }));
    expect(onVerTodos).toHaveBeenCalledTimes(1);

    rerender(
      <MinhaProgressaoElo
        nomeUsuario="Helena Costa"
        totalAcertos={250}
        progresso={progresso({ xpTotal: 15400, nivel: 18 })}
      />,
    );

    expect(screen.getByText('Elo máximo alcançado')).toBeInTheDocument();
    expect(screen.getByText('Sem próximo elo')).toBeInTheDocument();
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

  it('celebra o novo nivel e o novo elo quando o aluno evolui e permite fechar a celebracao com Continuar', () => {
    const academico = obterFaixaEloPorNomeOuCodigo('ACADEMICO')!;
    const onJogarDeNovo = jest.fn();
    render(
      <RecompensaQuiz
        resultado={resultado({
          subiuDeNivel: true,
          nivelAnterior: 2,
          subiuDeElo: true,
          novoElo: academico,
          xpExcedenteElo: 10,
          progresso: progresso({ xpTotal: 510, nivel: 3, proximoNivel: 4, eloAtual: academico }),
        })}
        onJogarDeNovo={onJogarDeNovo}
        onVoltar={jest.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Novo elo conquistado' })).toBeInTheDocument();
    expect(screen.getByText(/Parabéns! Você alcançou o nível 3/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver jornada' }));
    expect(screen.getByRole('region', { name: 'Todos os elos' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(
      screen.queryByRole('heading', { name: 'Novo elo conquistado' }),
    ).not.toBeInTheDocument();
    expect(onJogarDeNovo).not.toHaveBeenCalled();
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
