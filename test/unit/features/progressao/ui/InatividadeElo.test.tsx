import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import {
  diasAtePrazo,
  formatarDataPrazo,
  obterFaixaEloPorNomeOuCodigo,
  resolverDadosEloProgresso,
} from '../../../../../src/features/progressao/eloUtils';
import { useNotificacoesEloStore } from '../../../../../src/features/progressao/model/useNotificacoesEloStore';
import {
  buscarNotificacoesElo,
  marcarNotificacaoEloLida,
} from '../../../../../src/features/progressao/progressaoService';
import type {
  NotificacaoElo,
  ProgressoNivel,
} from '../../../../../src/features/progressao/types';
import { AvisoInatividadeBanner } from '../../../../../src/features/progressao/ui/AvisoInatividadeBanner';
import { MinhaProgressaoElo } from '../../../../../src/features/progressao/ui/MinhaProgressaoElo';
import { NotificacaoEloModal } from '../../../../../src/features/progressao/ui/NotificacaoEloModal';
import { NotificacoesEloBootstrap } from '../../../../../src/features/progressao/ui/NotificacoesEloBootstrap';

const navegar = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => navegar,
}));

jest.mock('../../../../../src/features/progressao/progressaoService', () => ({
  buscarNotificacoesElo: jest.fn(),
  marcarNotificacaoEloLida: jest.fn(),
  buscarHistoricoXp: jest.fn(),
}));

const papelAtual = { role: 'STUDENT' as string | undefined };

jest.mock('../../../../../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { role: papelAtual.role } }),
}));

const buscarMock = buscarNotificacoesElo as jest.Mock;
const marcarMock = marcarNotificacaoEloLida as jest.Mock;

const r1 = obterFaixaEloPorNomeOuCodigo('R1');
const r3 = obterFaixaEloPorNomeOuCodigo('R3');

// Progresso de um aluno rebaixado de R3 para R1: XP total intacto, XP de elo no topo do R1.
const rebaixado = (over: Partial<ProgressoNivel> = {}): ProgressoNivel => ({
  xpTotal: 7000,
  xpElo: 5999,
  nivel: 12,
  proximoNivel: 13,
  xpNoNivel: 400,
  xpNecessarioNoNivel: 1200,
  xpFaltante: 800,
  percentual: 33,
  eloAtual: r1,
  maiorElo: r3,
  estadoElo: 'REBAIXADO',
  diasInatividade: 9,
  prazoRebaixamentoEm: '2026-11-09T00:00:00.000Z',
  ...over,
});

const aviso = (over: Partial<NotificacaoElo> = {}): NotificacaoElo => ({
  id: 'aviso-1',
  data: '2026-10-26T12:00:00.000Z',
  tipo: 'ELO_EM_RISCO',
  titulo: 'Seu elo está em risco',
  mensagem: 'O elo R3 será rebaixado se você continuar sem concluir quizzes.',
  eloRelacionado: 'R3',
  prazoRebaixamentoEm: '2026-11-09T00:00:00.000Z',
  lida: false,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  papelAtual.role = 'STUDENT';
  useNotificacoesEloStore.getState().limparFila();
});

describe('eloUtils - inatividade', () => {
  it('separa XP de elo do XP total e não força o elo para cima', () => {
    const dados = resolverDadosEloProgresso(rebaixado());

    expect(dados.xpTotal).toBe(7000);
    expect(dados.xpElo).toBe(5999);
    // Elo atual rebaixado, maior elo preservado.
    expect(dados.eloAtual.codigo).toBe('R1');
    expect(dados.maiorElo.codigo).toBe('R3');
    // A barra de faixa passa a medir o XP de elo: falta 1 XP para voltar ao R3.
    expect(dados.proximoElo?.codigo).toBe('R3');
    expect(dados.xpFaltanteProximoElo).toBe(1);
    expect(dados.estadoElo).toBe('REBAIXADO');
    expect(dados.diasInatividade).toBe(9);
  });

  it('usa o XP total como XP de elo quando o backend não envia o saldo', () => {
    const dados = resolverDadosEloProgresso({
      xpTotal: 1940,
      nivel: 6,
      proximoNivel: 7,
      xpNoNivel: 0,
      xpNecessarioNoNivel: 100,
      xpFaltante: 100,
      percentual: 0,
    });

    expect(dados.xpElo).toBe(1940);
    expect(dados.eloAtual.codigo).toBe('INTERNO');
    expect(dados.estadoElo).toBe('ATIVO');
  });

  it('mantém as faixas já conquistadas como conquistadas após o rebaixamento', () => {
    const dados = resolverDadosEloProgresso(rebaixado({ todosOsElos: undefined }));
    const porCodigo = new Map(dados.todosOsElos.map((f) => [f.codigo, f]));

    // R1 é o elo atual; R3 já foi conquistado e perdido, então não pode vir "bloqueado".
    expect(porCodigo.get('R1')?.status).toBe('ELO_ATUAL');
    expect(porCodigo.get('R3')?.status).toBe('PROXIMO_ELO');
    expect(porCodigo.get('R3')?.conquistado).toBe(true);
    expect(porCodigo.get('INTERNO')?.conquistado).toBe(true);
    expect(porCodigo.get('R6')?.conquistado).toBe(false);
  });

  it('nunca exibe o maior elo abaixo do elo atual', () => {
    const dados = resolverDadosEloProgresso(rebaixado({ eloAtual: r3, maiorElo: r1 }));

    expect(dados.maiorElo.codigo).toBe('R3');
  });

  it('calcula dias restantes e formata o prazo, tolerando valores ausentes ou inválidos', () => {
    const agora = new Date('2026-10-26T12:00:00.000Z');

    expect(diasAtePrazo('2026-10-29T12:00:00.000Z', agora)).toBe(3);
    // Prazo vencido nunca fica negativo.
    expect(diasAtePrazo('2026-10-20T12:00:00.000Z', agora)).toBe(0);
    expect(diasAtePrazo(null, agora)).toBeNull();
    expect(diasAtePrazo('nao-e-data', agora)).toBeNull();

    expect(formatarDataPrazo('2026-11-09T00:00:00.000Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(formatarDataPrazo(null)).toBeNull();
    expect(formatarDataPrazo('nao-e-data')).toBeNull();
  });
});

describe('AvisoInatividadeBanner', () => {
  it('não renderiza nada para quem está ativo e em dia', () => {
    const { container } = render(
      <AvisoInatividadeBanner
        estadoElo="ATIVO"
        diasInatividade={0}
        diasParaAviso={7}
        prazoRebaixamentoEm={null}
        eloAtual={r3}
        maiorElo={r3}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('exibe o aviso preventivo com a instrução de como manter o elo', () => {
    render(
      <AvisoInatividadeBanner
        estadoElo="ATIVO"
        diasInatividade={7}
        diasParaAviso={7}
        prazoRebaixamentoEm="2026-11-04T00:00:00.000Z"
        eloAtual={r3}
        maiorElo={r3}
      />,
    );

    expect(screen.getByText('ATENÇÃO AO SEU ELO')).toBeInTheDocument();
    expect(screen.getByText(/há 7 dias sem concluir um quiz/)).toBeInTheDocument();
    expect(screen.getByText(/manter o elo R3 ativo/)).toBeInTheDocument();
  });

  it('não avisa antes do limiar configurado, mesmo com dias de inatividade', () => {
    const { container, rerender } = render(
      <AvisoInatividadeBanner
        estadoElo="ATIVO"
        diasInatividade={1}
        diasParaAviso={7}
        prazoRebaixamentoEm="2026-11-04T00:00:00.000Z"
        eloAtual={r3}
        maiorElo={r3}
      />,
    );

    expect(container).toBeEmptyDOMElement();

    // Com o limiar esticado pelo administrador, 7 dias também não avisam.
    rerender(
      <AvisoInatividadeBanner
        estadoElo="ATIVO"
        diasInatividade={7}
        diasParaAviso={20}
        prazoRebaixamentoEm="2026-11-04T00:00:00.000Z"
        eloAtual={r3}
        maiorElo={r3}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('exibe o estado em risco com o prazo e os dias restantes', () => {
    render(
      <AvisoInatividadeBanner
        estadoElo="EM_RISCO"
        diasInatividade={8}
        diasParaAviso={7}
        prazoRebaixamentoEm="2026-11-09T00:00:00.000Z"
        eloAtual={r3}
        maiorElo={r3}
      />,
    );

    expect(screen.getByText('ELO EM RISCO')).toBeInTheDocument();
    expect(screen.getByText(/Prazo para agir:/)).toBeInTheDocument();
    expect(screen.getByText(/dia\(s\) restante\(s\)/)).toBeInTheDocument();
  });

  it('no rebaixamento informa o maior elo preservado e aciona o botão de quiz', () => {
    const onFazerQuiz = jest.fn();

    render(
      <AvisoInatividadeBanner
        estadoElo="REBAIXADO"
        diasInatividade={9}
        diasParaAviso={7}
        prazoRebaixamentoEm="2026-11-23T00:00:00.000Z"
        eloAtual={r1}
        maiorElo={r3}
        onFazerQuiz={onFazerQuiz}
      />,
    );

    expect(screen.getByText('ELO REBAIXADO')).toBeInTheDocument();
    expect(screen.getByText(/maior elo conquistado \(R3\) foram preservados/)).toBeInTheDocument();
    expect(screen.getByText('Maior elo preservado: R3')).toBeInTheDocument();
    expect(screen.getByText(/Próximo rebaixamento em/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fazer um quiz' }));
    expect(onFazerQuiz).toHaveBeenCalledTimes(1);
  });
});

describe('MinhaProgressaoElo com rebaixamento', () => {
  it('separa os cards de XP de elo e XP total e mostra o estado real', () => {
    render(<MinhaProgressaoElo nomeUsuario="Helena Costa" progresso={rebaixado()} />);

    expect(screen.getByText('Estado: rebaixado')).toBeInTheDocument();
    expect(screen.getByText(/Rebaixamento previsto:/)).toBeInTheDocument();
    // XP de elo (5.999) e XP total (7.000) agora divergem.
    expect(screen.getByText('5.999 XP')).toBeInTheDocument();
    expect(screen.getByText('7.000 XP')).toBeInTheDocument();
    expect(screen.getByText('Preservado após o rebaixamento')).toBeInTheDocument();
    expect(screen.getByText('R1 → R3')).toBeInTheDocument();
    // A copia explicativa reflete a nova regra.
    expect(screen.getByText(/coloca o elo em risco/)).toBeInTheDocument();
  });

  it('mantém o estado ativo e sem aviso quando o aluno está em dia', () => {
    render(
      <MinhaProgressaoElo
        nomeUsuario="Helena Costa"
        progresso={rebaixado({
          estadoElo: 'ATIVO',
          diasInatividade: 0,
          prazoRebaixamentoEm: null,
          eloAtual: r3,
          maiorElo: r3,
          xpElo: 7000,
        })}
      />,
    );

    expect(screen.getByText('Estado: ativo')).toBeInTheDocument();
    expect(screen.queryByText(/Rebaixamento previsto:/)).not.toBeInTheDocument();
    expect(screen.queryByText('ELO EM RISCO')).not.toBeInTheDocument();
  });
});

describe('useNotificacoesEloStore', () => {
  it('exibe um aviso por vez e ignora duplicados', () => {
    const store = useNotificacoesEloStore.getState();

    act(() => store.adicionarNotificacoes([aviso(), aviso({ id: 'aviso-2' })]));

    expect(useNotificacoesEloStore.getState().notificacaoAtual?.id).toBe('aviso-1');
    expect(useNotificacoesEloStore.getState().fila).toHaveLength(1);

    // Recarregar a mesma lista não enfileira de novo.
    act(() =>
      useNotificacoesEloStore
        .getState()
        .adicionarNotificacoes([aviso(), aviso({ id: 'aviso-2' })]),
    );
    expect(useNotificacoesEloStore.getState().fila).toHaveLength(1);

    act(() => useNotificacoesEloStore.getState().avancarFila());
    expect(useNotificacoesEloStore.getState().notificacaoAtual?.id).toBe('aviso-2');

    act(() => useNotificacoesEloStore.getState().avancarFila());
    expect(useNotificacoesEloStore.getState().notificacaoAtual).toBeNull();
  });

  it('acrescenta ao fim da fila quando já há um aviso em exibição', () => {
    act(() => useNotificacoesEloStore.getState().adicionarNotificacoes([aviso()]));
    act(() =>
      useNotificacoesEloStore
        .getState()
        .adicionarNotificacoes([aviso({ id: 'aviso-3' }), aviso({ id: 'aviso-4' })]),
    );

    expect(useNotificacoesEloStore.getState().notificacaoAtual?.id).toBe('aviso-1');
    expect(useNotificacoesEloStore.getState().fila.map((a) => a.id)).toEqual([
      'aviso-3',
      'aviso-4',
    ]);
  });

  it('ignora listas vazias e limpa a fila', () => {
    act(() => useNotificacoesEloStore.getState().adicionarNotificacoes([]));
    expect(useNotificacoesEloStore.getState().notificacaoAtual).toBeNull();

    act(() => useNotificacoesEloStore.getState().adicionarNotificacoes([aviso()]));
    act(() => useNotificacoesEloStore.getState().limparFila());
    expect(useNotificacoesEloStore.getState().notificacaoAtual).toBeNull();
    expect(useNotificacoesEloStore.getState().fila).toHaveLength(0);
  });
});

describe('NotificacaoEloModal', () => {
  const renderizar = () =>
    render(
      <MemoryRouter>
        <NotificacaoEloModal />
      </MemoryRouter>,
    );

  it('não renderiza nada sem aviso na fila', () => {
    const { container } = renderizar();
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe o aviso de risco com prazo e marca como lido ao fechar', async () => {
    marcarMock.mockResolvedValue(undefined);
    act(() => useNotificacoesEloStore.getState().adicionarNotificacoes([aviso()]));

    renderizar();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('ELO EM RISCO')).toBeInTheDocument();
    expect(screen.getByText(/Prazo:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));

    expect(marcarMock).toHaveBeenCalledWith('aviso-1');
    await waitFor(() =>
      expect(useNotificacoesEloStore.getState().notificacaoAtual).toBeNull(),
    );
  });

  it('avança a fila mesmo quando marcar como lido falha', async () => {
    marcarMock.mockRejectedValue(new Error('rede'));
    act(() => useNotificacoesEloStore.getState().adicionarNotificacoes([aviso()]));

    renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));

    await waitFor(() =>
      expect(useNotificacoesEloStore.getState().notificacaoAtual).toBeNull(),
    );
  });

  it('no aviso de recuperação celebra e apenas continua', async () => {
    marcarMock.mockResolvedValue(undefined);
    act(() =>
      useNotificacoesEloStore.getState().adicionarNotificacoes([
        aviso({
          id: 'aviso-recuperado',
          tipo: 'ELO_RECUPERADO',
          titulo: 'Elo recuperado',
          mensagem: 'Você voltou a acumular XP de elo e recuperou o elo R3.',
        }),
      ]),
    );

    renderizar();

    expect(screen.getByText('ELO RECUPERADO')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Elo recuperado' })).toBeInTheDocument();
    // Sem prazo de rebaixamento na recuperação.
    expect(screen.queryByText(/^Prazo:/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await waitFor(() =>
      expect(useNotificacoesEloStore.getState().notificacaoAtual).toBeNull(),
    );
    expect(navegar).not.toHaveBeenCalled();
  });

  it('navega para o quiz e para a progressão', async () => {
    marcarMock.mockResolvedValue(undefined);
    act(() => useNotificacoesEloStore.getState().adicionarNotificacoes([aviso()]));

    renderizar();

    fireEvent.click(screen.getByRole('button', { name: 'Fazer um quiz' }));

    expect(navegar).toHaveBeenCalledWith('/aluno/quiz/escolha');
    // Fecha ao navegar: o modal fica no layout, ficaria por cima da tela de destino.
    expect(marcarMock).toHaveBeenCalledWith('aviso-1');
    await waitFor(() =>
      expect(useNotificacoesEloStore.getState().notificacaoAtual).toBeNull(),
    );
  });

  it('fecha o aviso ao ir para a progressão', async () => {
    marcarMock.mockResolvedValue(undefined);
    act(() => useNotificacoesEloStore.getState().adicionarNotificacoes([aviso()]));

    renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Ver progressão' }));

    expect(navegar).toHaveBeenCalledWith('/aluno/ranking');
    await waitFor(() =>
      expect(useNotificacoesEloStore.getState().notificacaoAtual).toBeNull(),
    );
  });

  it('usa o ícone genérico quando o aviso não tem elo relacionado', () => {
    act(() =>
      useNotificacoesEloStore
        .getState()
        .adicionarNotificacoes([aviso({ eloRelacionado: null, prazoRebaixamentoEm: null })]),
    );

    renderizar();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(/^Prazo:/)).not.toBeInTheDocument();
  });
});

describe('NotificacoesEloBootstrap', () => {
  it('carrega e enfileira os avisos não lidos do aluno', async () => {
    buscarMock.mockResolvedValue([aviso()]);

    render(<NotificacoesEloBootstrap />);

    await waitFor(() =>
      expect(useNotificacoesEloStore.getState().notificacaoAtual?.id).toBe('aviso-1'),
    );
    expect(buscarMock).toHaveBeenCalledWith(true);
  });

  it('não busca avisos para quem não é aluno', async () => {
    papelAtual.role = 'PROFESSOR';

    render(<NotificacoesEloBootstrap />);

    await waitFor(() => expect(buscarMock).not.toHaveBeenCalled());
    expect(useNotificacoesEloStore.getState().notificacaoAtual).toBeNull();
  });

  it('ignora falhas na busca sem quebrar a navegação', async () => {
    buscarMock.mockRejectedValue(new Error('rede'));

    render(<NotificacoesEloBootstrap />);

    await waitFor(() => expect(buscarMock).toHaveBeenCalled());
    expect(useNotificacoesEloStore.getState().notificacaoAtual).toBeNull();
  });
});
