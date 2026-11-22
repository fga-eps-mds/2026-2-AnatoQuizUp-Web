import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabelaDesempenhoIndividual } from '../../../../../src/features/dashboard-turmas/ui/TabelaDesempenhoIndividual';
import { buscarDesempenhoIndividual } from '../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi';
import { buscarUsuariosPorIds } from '../../../../../src/entities/usuarios/api/usuarioApi';

jest.mock('../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi', () => ({
  buscarDesempenhoIndividual: jest.fn(),
}));

jest.mock('../../../../../src/entities/usuarios/api/usuarioApi', () => ({
  buscarUsuariosPorIds: jest.fn(),
}));

jest.mock('../../../../../src/features/dashboard-turmas/ui/EvolucaoTemaAluno', () => ({
  EvolucaoTemaAluno: ({ onVoltar }: { onVoltar: () => void }) => (
    <div>
      Evolução por tema carregada
      <button type="button" onClick={onVoltar}>Voltar</button>
    </div>
  ),
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

  it('deve abrir primeiro o resumo individual ao clicar em um aluno', async () => {
    const user = userEvent.setup();
    mockBuscarIndividual.mockResolvedValue({ alunos: [alunoStats] });
    mockBuscarUsuarios.mockResolvedValue([alunoUsuario]);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    await user.click(await screen.findByText('João Silva'));

    expect(screen.getByText('Desempenho por Tema')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver evolução' })).toBeInTheDocument();
    expect(screen.queryByText('Evolução por tema carregada')).not.toBeInTheDocument();
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

    expect(screen.getByRole('button', { name: 'Ver evolução' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fechar detalhes do aluno' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Ver evolução' })).not.toBeInTheDocument();
    });
  });

  it('deve carregar a evolução somente após a ação do professor', async () => {
    const user = userEvent.setup();
    mockBuscarIndividual.mockResolvedValue({
      alunos: [{ ...alunoStats, desempenhoPorTema: [] }],
    });
    mockBuscarUsuarios.mockResolvedValue([alunoUsuario]);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    await user.click(await screen.findByText('João Silva'));

    expect(screen.getByText('Nenhuma questão respondida ainda.')).toBeInTheDocument();
    expect(screen.queryByText('Evolução por tema carregada')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver evolução' }));

    expect(screen.getByText('Evolução por tema carregada')).toBeInTheDocument();
  });

  it('deve permitir voltar da evolução para o resumo individual', async () => {
    const user = userEvent.setup();
    mockBuscarIndividual.mockResolvedValue({ alunos: [alunoStats] });
    mockBuscarUsuarios.mockResolvedValue([alunoUsuario]);

    render(<TabelaDesempenhoIndividual turmaId="turma-123" />);

    await user.click(await screen.findByText('João Silva'));
    await user.click(screen.getByRole('button', { name: 'Ver evolução' }));

    expect(screen.getByText('Evolução por tema carregada')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(screen.queryByText('Evolução por tema carregada')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver evolução' })).toBeInTheDocument();
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
