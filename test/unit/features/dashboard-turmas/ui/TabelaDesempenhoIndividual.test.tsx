import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabelaDesempenhoIndividual } from '../../../../../src/features/dashboard-turmas/ui/TabelaDesempenhoIndividual';
import { buscarDesempenhoIndividual, buscarEvolucaoTemasAluno, buscarHistoricoAluno } from '../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi';
import { buscarUsuariosPorIds } from '../../../../../src/entities/usuarios/api/usuarioApi';

jest.mock('../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi', () => ({
  buscarDesempenhoIndividual: jest.fn(),
  buscarHistoricoAluno: jest.fn().mockResolvedValue([]),
  buscarEvolucaoTemasAluno: jest.fn(),
}));

jest.mock('../../../../../src/entities/usuarios/api/usuarioApi', () => ({
  buscarUsuariosPorIds: jest.fn(),
}));

const mockBuscarIndividual = buscarDesempenhoIndividual as jest.Mock;
const mockBuscarUsuarios = buscarUsuariosPorIds as jest.Mock;

const alunoUsuario = {
  id: 'aluno-1',
  nome: 'João Silva',
  email: 'joao.silva@aluno.unb.br',
  nickname: null,
  perfil: 'ALUNO' as const,
  status: 'ATIVO' as const,
  instituicao: 'UnB',
  curso: 'Medicina',
  semestre: '2026.1',
};

const alunoStats = {
  alunoId: 'aluno-1',
  totalRespondidas: 48,
  totalAcertos: 41,
  taxaAcerto: 85,
  ultimaAtividade: null,
  desempenhoPorTema: [
    { nome: 'Tórax', totalRespondidas: 20, taxaAcerto: 90, status: 'Tranquilo' as const },
  ],
};

describe('TabelaDesempenhoIndividual', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve exibir estado de carregamento enquanto busca os dados', () => {
    mockBuscarIndividual.mockReturnValue(new Promise(() => {}));

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    expect(screen.getByText('Carregando desempenho individual...')).toBeInTheDocument();
  });

  it('deve exibir mensagem quando não há alunos na turma', async () => {
    mockBuscarIndividual.mockResolvedValue({ alunos: [] });
    mockBuscarUsuarios.mockResolvedValue([]);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    expect(await screen.findByText('Nenhum aluno encontrado na turma.')).toBeInTheDocument();
  });

  it('deve renderizar a tabela com dados do aluno', async () => {
    mockBuscarIndividual.mockResolvedValue({ alunos: [alunoStats] });
    mockBuscarUsuarios.mockResolvedValue([alunoUsuario]);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    expect(await screen.findByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('joao.silva@aluno.unb.br')).toBeInTheDocument();
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('deve chamar as APIs corretas ao montar', async () => {
    mockBuscarIndividual.mockResolvedValue({ alunos: [alunoStats] });
    mockBuscarUsuarios.mockResolvedValue([alunoUsuario]);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    await screen.findByText('João Silva');

    expect(mockBuscarIndividual).toHaveBeenCalledWith('turma-123');
    expect(mockBuscarUsuarios).toHaveBeenCalledWith(['aluno-1']);
  });

  it('deve abrir o modal ao clicar em um aluno', async () => {
    const user = userEvent.setup();
    mockBuscarIndividual.mockResolvedValue({ alunos: [alunoStats] });
    mockBuscarUsuarios.mockResolvedValue([alunoUsuario]);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    await user.click(await screen.findByText('João Silva'));

    expect(screen.getByText('Desempenho por Tema')).toBeInTheDocument();
    expect(screen.getByText('Tórax')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('alterna Histórico e Evolução por tema para o mesmo aluno no mesmo modal', async () => {
    const user = userEvent.setup();
    mockBuscarIndividual.mockResolvedValue({ alunos: [alunoStats] });
    mockBuscarUsuarios.mockResolvedValue([alunoUsuario]);
    jest.mocked(buscarEvolucaoTemasAluno).mockResolvedValue({ alunoId: 'aluno-1', temas: [] });

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);
    await user.click(await screen.findByText('João Silva'));
    expect(await screen.findByText('Nenhuma lista publicada no período.')).toBeInTheDocument();
    expect(buscarHistoricoAluno).toHaveBeenCalledWith('turma-123', 'aluno-1', expect.any(Object));

    await user.click(screen.getByRole('button', { name: 'Evolução por tema' }));
    expect(await screen.findByText('Nenhuma lista com temas foi encontrada no período.')).toBeInTheDocument();
    expect(buscarEvolucaoTemasAluno).toHaveBeenCalledWith('turma-123', 'aluno-1', expect.any(Object));
    expect(screen.getByText('Desempenho por Tema')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Histórico' }));
    expect(await screen.findByText('Nenhuma lista publicada no período.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Histórico' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('deve exibir os cards de resumo no modal', async () => {
    const user = userEvent.setup();
    mockBuscarIndividual.mockResolvedValue({ alunos: [alunoStats] });
    mockBuscarUsuarios.mockResolvedValue([alunoUsuario]);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    await user.click(await screen.findByText('João Silva'));

    expect(screen.getByText('41')).toBeInTheDocument();
    expect(screen.getAllByText('85%')).toHaveLength(2);
  });

  it('deve fechar o modal ao clicar no botão de fechar', async () => {
    const user = userEvent.setup();
    mockBuscarIndividual.mockResolvedValue({ alunos: [alunoStats] });
    mockBuscarUsuarios.mockResolvedValue([alunoUsuario]);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    await user.click(await screen.findByText('João Silva'));

    expect(screen.getByText('Desempenho por Tema')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fechar detalhes do aluno' }));

    await waitFor(() => {
      expect(screen.queryByText('Desempenho por Tema')).not.toBeInTheDocument();
    });
  });

  it('deve exibir mensagem quando o aluno não tem temas respondidos no modal', async () => {
    const user = userEvent.setup();
    mockBuscarIndividual.mockResolvedValue({
      alunos: [{ ...alunoStats, desempenhoPorTema: [] }],
    });
    mockBuscarUsuarios.mockResolvedValue([alunoUsuario]);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    await user.click(await screen.findByText('João Silva'));

    expect(screen.getByText('Nenhuma questão respondida ainda.')).toBeInTheDocument();
  });

  it('deve formatar a última atividade como "Hoje", "Ontem", data antiga e traço', async () => {
    const agora = new Date();
    const ontem = new Date(agora);
    ontem.setDate(agora.getDate() - 1);

    mockBuscarIndividual.mockResolvedValue({
      alunos: [
        { ...alunoStats, alunoId: 'a-hoje', ultimaAtividade: agora.toISOString() },
        { ...alunoStats, alunoId: 'a-ontem', ultimaAtividade: ontem.toISOString() },
        { ...alunoStats, alunoId: 'a-antigo', ultimaAtividade: '2020-01-15T10:00:00.000Z' },
        { ...alunoStats, alunoId: 'a-sem', ultimaAtividade: null },
      ],
    });
    mockBuscarUsuarios.mockResolvedValue([]);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    expect(await screen.findByText(/^Hoje,/)).toBeInTheDocument();
    expect(screen.getByText(/^Ontem,/)).toBeInTheDocument();
    expect(screen.getByText('15/01/2020')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('deve aplicar as faixas de cor para taxas alta, média e baixa', async () => {
    mockBuscarIndividual.mockResolvedValue({
      alunos: [
        { ...alunoStats, alunoId: 'a-alta', taxaAcerto: 85 },
        { ...alunoStats, alunoId: 'a-media', taxaAcerto: 50 },
        { ...alunoStats, alunoId: 'a-baixa', taxaAcerto: 20 },
      ],
    });
    mockBuscarUsuarios.mockResolvedValue([]);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    expect(await screen.findByText('85%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('deve exibir "Aluno desconhecido" quando o usuário não é encontrado', async () => {
    mockBuscarIndividual.mockResolvedValue({ alunos: [{ ...alunoStats, alunoId: 'sem-usuario' }] });
    mockBuscarUsuarios.mockResolvedValue([]);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    expect(await screen.findByText('Aluno desconhecido')).toBeInTheDocument();
    expect(screen.getByText('sem-usuario')).toBeInTheDocument();
  });

  it('deve logar erro no console quando a busca falha', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const erro = new Error('Falha de rede');
    mockBuscarIndividual.mockRejectedValue(erro);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao carregar desempenho individual:', erro);
    });

    expect(await screen.findByText('Nenhum aluno encontrado na turma.')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
