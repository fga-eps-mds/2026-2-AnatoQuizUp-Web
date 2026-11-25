import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TurmaDetalhesPage } from '../../../../../src/pages/TurmaDetalhes/ui/TurmaDetalhesPage'; 
import { buscarTurmaPorId, atualizarTurma } from '../../../../../src/entities/turmas/api/turmaApi';
import {
  buscarDashboardMacro,
  buscarDesempenhoPorListas,
  buscarDesempenhoIndividual,
} from '../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi';
import {
  atualizarVinculoListaTurma,
  listarVinculosDaTurma,
} from '../../../../../src/entities/lista/api/listaApi';

jest.mock('../../../../../src/entities/turmas/api/turmaApi', () => ({
  buscarTurmaPorId: jest.fn(),
  atualizarTurma: jest.fn(),
}));

jest.mock('../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi', () => ({
  buscarDashboardMacro: jest.fn(),
  buscarDesempenhoPorListas: jest.fn(),
  buscarDesempenhoIndividual: jest.fn(),
}));

jest.mock('../../../../../src/entities/lista/api/listaApi', () => ({
  atualizarVinculoListaTurma: jest.fn(),
  listarVinculosDaTurma: jest.fn(),
}));

jest.mock('../../../../../src/entities/usuarios/api/usuarioApi', () => ({
  buscarUsuariosPorIds: jest.fn(),
}));

jest.mock('../../../../../src/features/manage-turmas/ui/ModalVincularLista', () => ({
  ModalVincularLista: ({ isOpen, turma, onClose, onAfterChange, onFeedback }: {
    isOpen: boolean;
    turma: { nome: string } | null;
    onClose: () => void;
    onAfterChange: () => void;
    onFeedback: (message: string, type: 'success' | 'error') => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Modal de vincular lista">
        <span>Modal aberto para {turma?.nome}</span>
        <button type="button" onClick={onAfterChange}>Simular alteracao listas</button>
        <button type="button" onClick={() => onFeedback('Lista vinculada com sucesso.', 'success')}>Simular feedback</button>
        <button type="button" onClick={onClose}>Fechar modal</button>
      </div>
    ) : null,
}));

jest.mock('../../../../../src/features/manage-turmas/ui/AbaAlunos', () => ({
  AbaAlunos: ({ turmaId }: { turmaId: string }) => (
    <div data-testid="aba-alunos">Aba alunos da turma {turmaId}</div>
  ),
}));

jest.mock('../../../../../src/features/manage-turmas/ui/ModalTurma', () => ({
  ModalTurma: ({ isOpen, mode, turma, onClose, onSubmit }: {
    isOpen: boolean;
    mode: string;
    turma: { nome: string } | null;
    onClose: () => void;
    onSubmit: (data: { nome: string }) => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Modal de turma">
        <span>Modo {mode} para {turma?.nome}</span>
        <button type="button" onClick={() => onSubmit({ nome: 'Atualizado' })}>Salvar turma</button>
        <button type="button" onClick={onClose}>Fechar modal turma</button>
      </div>
    ) : null,
}));

const mockTurma = {
  id: 'turma-123',
  nome: 'Turma A',
  ano: 2026,
  semestre: '1',
  quantidadeAlunos: 15,
  status: 'ATIVA',
};

const mockDashboard = {
  totalAlunos: 15,
  totalQuestoesRespondidas: 50,
  taxaMediaAcertos: 75,
  desempenhoPorTema: [],
};

const renderWithRouter = () => {
  return render(
    <MemoryRouter initialEntries={['/turmas/turma-123']}>
      <Routes>
        <Route path="/turmas/:id" element={<TurmaDetalhesPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('TurmaDetalhesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (buscarDesempenhoIndividual as jest.Mock).mockResolvedValue({ alunos: [] });
    (buscarDesempenhoPorListas as jest.Mock).mockResolvedValue([]);
    (atualizarVinculoListaTurma as jest.Mock).mockResolvedValue({
      id: 'vinculo-1',
      listaQuestaoId: 'lista-1',
      nome: 'Simulado de Anatomia',
      quantidadeQuestoes: 12,
      prazo: '2026-06-10T23:59:00.000Z',
      gabaritoLiberado: true,
    });
    (listarVinculosDaTurma as jest.Mock).mockResolvedValue([]);
  });

  it('deve exibir o estado de carregamento inicialmente', () => {
    (buscarTurmaPorId as jest.Mock).mockImplementation(() => new Promise(() => {}));
    (buscarDashboardMacro as jest.Mock).mockImplementation(() => new Promise(() => {}));

    renderWithRouter();
    expect(screen.getByText('Carregando detalhes da turma...')).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro se a turma não for encontrada', async () => {
    (buscarTurmaPorId as jest.Mock).mockResolvedValue(null);
    (buscarDashboardMacro as jest.Mock).mockResolvedValue(null);

    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('Turma não encontrada.')).toBeInTheDocument();
    });
  });

  it('deve renderizar os dados da turma e o dashboard com sucesso', async () => {
    (buscarTurmaPorId as jest.Mock).mockResolvedValue(mockTurma);
    (buscarDashboardMacro as jest.Mock).mockResolvedValue(mockDashboard);

    renderWithRouter();
    expect(await screen.findByRole('heading', { name: 'Turma A' })).toBeInTheDocument();
    expect(screen.getByText('2026.1')).toBeInTheDocument();
    expect(screen.getByText('Ativa')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument(); 
  });

  it('mantém o desempenho individual disponível mesmo sem respostas de quiz', async () => {
    jest.mocked(buscarTurmaPorId).mockResolvedValue(mockTurma as Awaited<ReturnType<typeof buscarTurmaPorId>>);
    jest.mocked(buscarDashboardMacro).mockResolvedValue({ ...mockDashboard, totalQuestoesRespondidas: 0 });

    renderWithRouter();

    expect(await screen.findByRole('heading', { name: 'Desempenho Individual' })).toBeInTheDocument();
    expect(buscarDesempenhoIndividual).toHaveBeenCalledWith('turma-123');
  });

  it('deve exibir o card de desempenho por lista no dashboard', async () => {
    (buscarTurmaPorId as jest.Mock).mockResolvedValue(mockTurma);
    (buscarDashboardMacro as jest.Mock).mockResolvedValue(mockDashboard);
    (buscarDesempenhoPorListas as jest.Mock).mockResolvedValue([{
        listaTurmaId: 'lista-turma-1', nomeLista: 'Simulado de Anatomia', totalAlunos: 18,
        totalSubmeteram: 11, totalPendentes: 7, taxaMediaAcerto: 73.4, prazo: '2099-06-10T23:59:00.000Z',
    }]);

    renderWithRouter();
    expect(await screen.findByRole('heading', { name: 'Turma A' })).toBeInTheDocument();
    expect(await screen.findByText('Simulado de Anatomia')).toBeInTheDocument();
    expect(buscarDesempenhoPorListas).toHaveBeenCalledWith('turma-123');
  });

  it('deve alternar entre as abas e esconder o dashboard', async () => {
    (buscarTurmaPorId as jest.Mock).mockResolvedValue(mockTurma);
    (buscarDashboardMacro as jest.Mock).mockResolvedValue(mockDashboard);

    renderWithRouter();
    await screen.findByRole('heading', { name: 'Turma A' });

    fireEvent.click(screen.getByRole('button', { name: /Alunos/i }));

    expect(screen.queryByText('Desempenho Individual')).not.toBeInTheDocument();
    expect(screen.getByTestId('aba-alunos')).toHaveTextContent('Aba alunos da turma turma-123');
  });

  it('deve listar as listas publicadas da turma na aba Listas e alternar gabarito com sucesso', async () => {
    (buscarTurmaPorId as jest.Mock).mockResolvedValue(mockTurma);
    (buscarDashboardMacro as jest.Mock).mockResolvedValue(mockDashboard);
    (listarVinculosDaTurma as jest.Mock).mockResolvedValue([
      { id: 'vinculo-1', listaQuestaoId: 'lista-1', nome: 'Simulado', quantidadeQuestoes: 12, prazo: null, gabaritoLiberado: false },
    ]);
    (atualizarVinculoListaTurma as jest.Mock).mockResolvedValue({
      id: 'vinculo-1', listaQuestaoId: 'lista-1', nome: 'Simulado', quantidadeQuestoes: 12, prazo: null, gabaritoLiberado: true,
    });

    renderWithRouter();
    await screen.findByRole('heading', { name: 'Turma A' });

    fireEvent.click(screen.getByRole('button', { name: /^Listas$/i }));
    
    // Testa liberação do gabarito
    const btnGabarito = await screen.findByRole('button', { name: /Gabarito oculto/i });
    fireEvent.click(btnGabarito);

    expect(atualizarVinculoListaTurma).toHaveBeenCalledWith('lista-1', 'turma-123', { gabaritoLiberado: true });
    expect(await screen.findByRole('button', { name: /Gabarito liberado/i })).toBeInTheDocument();
    expect(screen.getByText('Gabarito liberado para a turma.')).toBeInTheDocument();
  });

  it('deve exibir empty state quando nao houver listas publicadas e abrir o modal de vinculo', async () => {
    (buscarTurmaPorId as jest.Mock).mockResolvedValue(mockTurma);
    (buscarDashboardMacro as jest.Mock).mockResolvedValue(mockDashboard);
    (listarVinculosDaTurma as jest.Mock).mockResolvedValue([]);

    renderWithRouter();
    await screen.findByRole('heading', { name: 'Turma A' });

    fireEvent.click(screen.getByRole('button', { name: /^Listas$/i }));

    expect(await screen.findByText('Nenhuma lista publicada nesta turma.')).toBeInTheDocument();

    // Testa abertura do modal de vinculo
    fireEvent.click(screen.getByRole('button', { name: /Vincular lista/i }));
    expect(screen.getByRole('dialog', { name: 'Modal de vincular lista' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Simular alteracao listas/i }));
    await waitFor(() => { expect(listarVinculosDaTurma).toHaveBeenCalledTimes(2); });
  });

  it('deve abrir o modal de edicao de turma, salvar com sucesso e fechar (cobertura do handleSalvarTurma)', async () => {
    (buscarTurmaPorId as jest.Mock).mockResolvedValue(mockTurma);
    (buscarDashboardMacro as jest.Mock).mockResolvedValue(mockDashboard);
    (atualizarTurma as jest.Mock).mockResolvedValue({ ...mockTurma, nome: 'Turma Atualizada' });

    renderWithRouter();
    await screen.findByRole('heading', { name: 'Turma A' });

    // Abrir modal
    fireEvent.click(screen.getByRole('button', { name: /Editar turma/i }));
    expect(screen.getByRole('dialog', { name: 'Modal de turma' })).toBeInTheDocument();

    // Clicar em salvar dentro do mock
    fireEvent.click(screen.getByRole('button', { name: /Salvar turma/i }));

    await waitFor(() => {
      expect(atualizarTurma).toHaveBeenCalledWith('turma-123', { nome: 'Atualizado' });
      expect(screen.getByText('Turma atualizada com sucesso.')).toBeInTheDocument();
    });

    // Testar fechar modal
    fireEvent.click(screen.getByRole('button', { name: /Editar turma/i }));
    fireEvent.click(screen.getByRole('button', { name: /Fechar modal turma/i }));
    expect(screen.queryByRole('dialog', { name: 'Modal de turma' })).not.toBeInTheDocument();
  });

  it('deve exibir toast de erro ao falhar na edicao da turma (cobertura do catch do handleSalvarTurma)', async () => {
    (buscarTurmaPorId as jest.Mock).mockResolvedValue(mockTurma);
    (buscarDashboardMacro as jest.Mock).mockResolvedValue(mockDashboard);
    (atualizarTurma as jest.Mock).mockRejectedValue(new Error('Falha API'));

    renderWithRouter();
    await screen.findByRole('heading', { name: 'Turma A' });

    fireEvent.click(screen.getByRole('button', { name: /Editar turma/i }));
    fireEvent.click(screen.getByRole('button', { name: /Salvar turma/i }));

    await waitFor(() => {
      expect(screen.getByText('Não foi possível editar a turma.')).toBeInTheDocument();
    });
  });

  it('deve exibir erro ao falhar na alteracao do gabarito (cobertura do catch do handleAlternarGabarito)', async () => {
    (buscarTurmaPorId as jest.Mock).mockResolvedValue(mockTurma);
    (buscarDashboardMacro as jest.Mock).mockResolvedValue(mockDashboard);
    (listarVinculosDaTurma as jest.Mock).mockResolvedValue([
      { id: 'v1', listaQuestaoId: 'l1', nome: 'L1', quantidadeQuestoes: 1, prazo: null, gabaritoLiberado: false },
    ]);
    (atualizarVinculoListaTurma as jest.Mock).mockRejectedValue(new Error('Erro Gabarito'));

    renderWithRouter();
    await screen.findByRole('heading', { name: 'Turma A' });

    fireEvent.click(screen.getByRole('button', { name: /^Listas$/i }));
    
    const btnGabarito = await screen.findByRole('button', { name: /Gabarito oculto/i });
    fireEvent.click(btnGabarito);

    await waitFor(() => {
      expect(screen.getByText('Não foi possível atualizar o gabarito.')).toBeInTheDocument();
    });
  });

  it('deve exibir erro nas listas e permitir TENTAR NOVAMENTE (cobertura do catch listarVinculosDaTurma)', async () => {
    (buscarTurmaPorId as jest.Mock).mockResolvedValue(mockTurma);
    (buscarDashboardMacro as jest.Mock).mockResolvedValue(mockDashboard);
    (listarVinculosDaTurma as jest.Mock).mockRejectedValueOnce(new Error('Falha Listar'));

    renderWithRouter();
    await screen.findByRole('heading', { name: 'Turma A' });

    fireEvent.click(screen.getByRole('button', { name: /^Listas$/i }));

    // Espera a mensagem de erro renderizar e conter o botão "Tentar novamente"
    const btnTentar = await screen.findByRole('button', { name: /Tentar novamente/i });
    expect(screen.getByText('Não foi possível carregar as listas publicadas.')).toBeInTheDocument();

    // Na segunda vez, mockamos sucesso
    (listarVinculosDaTurma as jest.Mock).mockResolvedValueOnce([]);
    fireEvent.click(btnTentar);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma lista publicada nesta turma.')).toBeInTheDocument();
    });
  });

  it('deve esconder o toast automaticamente apos 3.5 segundos (cobertura do useEffect timeout)', async () => {
    jest.useFakeTimers();
    (buscarTurmaPorId as jest.Mock).mockResolvedValue(mockTurma);
    (buscarDashboardMacro as jest.Mock).mockResolvedValue(mockDashboard);
    (atualizarTurma as jest.Mock).mockResolvedValue(mockTurma);

    renderWithRouter();
    
    await screen.findByRole('heading', { name: 'Turma A' });

    fireEvent.click(screen.getByRole('button', { name: /Editar turma/i }));
    fireEvent.click(screen.getByRole('button', { name: /Salvar turma/i }));

    await waitFor(() => {
      expect(screen.getByText('Turma atualizada com sucesso.')).toBeInTheDocument();
    });

    jest.advanceTimersByTime(3500);

    await waitFor(() => {
      expect(screen.queryByText('Turma atualizada com sucesso.')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('deve formatar o prazo corretamente e lidar com datas invalidas ou nulas na listagem de listas', async () => {
    (buscarTurmaPorId as jest.Mock).mockResolvedValue(mockTurma);
    (buscarDashboardMacro as jest.Mock).mockResolvedValue(mockDashboard);
    
    (listarVinculosDaTurma as jest.Mock).mockResolvedValue([
      { id: 'v1', nome: 'Lista Sem Prazo', quantidadeQuestoes: 1, prazo: null, gabaritoLiberado: false },
      { id: 'v2', nome: 'Lista Valida', quantidadeQuestoes: 1, prazo: '2026-06-10T23:59:00.000Z', gabaritoLiberado: false },
      { id: 'v3', nome: 'Lista Invalida', quantidadeQuestoes: 1, prazo: 'data-invalida', gabaritoLiberado: false },
    ]);

    renderWithRouter();
    await screen.findByRole('heading', { name: 'Turma A' });

    fireEvent.click(screen.getByRole('button', { name: /^Listas$/i }));

    expect(await screen.findByText('Sem prazo')).toBeInTheDocument();
    expect(screen.getByText(/10\/06\/2026, \d{2}:\d{2}/)).toBeInTheDocument();
    expect(screen.getByText('data-invalida')).toBeInTheDocument();
  });

  it('não deve fechar o modal de edicao de turma se isSavingTurma for true (cobertura handleFecharModalTurma)', async () => {
    let resolverApi!: (value: unknown) => void;
    const promisePendente = new Promise((resolve) => { resolverApi = resolve; });
    
    (buscarTurmaPorId as jest.Mock).mockResolvedValue(mockTurma);
    (buscarDashboardMacro as jest.Mock).mockResolvedValue(mockDashboard);
    (atualizarTurma as jest.Mock).mockReturnValue(promisePendente);

    renderWithRouter();
    await screen.findByRole('heading', { name: 'Turma A' });

    fireEvent.click(screen.getByRole('button', { name: /Editar turma/i }));
    
    fireEvent.click(screen.getByRole('button', { name: /Salvar turma/i }));

    fireEvent.click(screen.getByRole('button', { name: /Fechar modal turma/i }));

    expect(screen.getByRole('dialog', { name: 'Modal de turma' })).toBeInTheDocument();

    resolverApi({ ...mockTurma, nome: 'Turma Atualizada' });
    
    await waitFor(() => {
      expect(screen.getByText('Turma atualizada com sucesso.')).toBeInTheDocument();
    });
  });

  it('deve logar erro no console se falhar a busca inicial de dados (cobertura do catch fetchData)', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const erroSimulado = new Error('Falha total na API');
    
    (buscarTurmaPorId as jest.Mock).mockRejectedValue(erroSimulado);

    renderWithRouter();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao buscar dados:', erroSimulado);
    });

    consoleSpy.mockRestore();
  });
});
