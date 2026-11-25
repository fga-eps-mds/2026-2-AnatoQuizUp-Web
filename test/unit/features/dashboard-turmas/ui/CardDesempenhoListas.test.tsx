import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  buscarDesempenhoPorListas,
  buscarDesempenhoListaIndividual,
  buscarTopErrosLista,
} from '../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi';
import { buscarUsuariosPorIds } from '../../../../../src/entities/usuarios/api/usuarioApi';
import { CardDesempenhoListas } from '../../../../../src/features/dashboard-turmas/ui/CardDesempenhoListas';
import type { UsuarioResumo } from '../../../../../src/entities/usuarios/model/types';

jest.mock('../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi', () => ({
  buscarDesempenhoPorListas: jest.fn(),
  buscarDesempenhoListaIndividual: jest.fn(),
  buscarTopErrosLista: jest.fn(),
}));

jest.mock('../../../../../src/entities/usuarios/api/usuarioApi', () => ({
  buscarUsuariosPorIds: jest.fn(),
}));

const mockedBuscarDesempenhoPorListas = jest.mocked(buscarDesempenhoPorListas);
const mockedBuscarDesempenhoListaIndividual = jest.mocked(buscarDesempenhoListaIndividual);
const mockedBuscarUsuariosPorIds = jest.mocked(buscarUsuariosPorIds);
const mockedBuscarTopErrosLista = jest.mocked(buscarTopErrosLista);

describe('CardDesempenhoListas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve carregar e exibir desempenho por lista', async () => {
    mockedBuscarDesempenhoPorListas.mockResolvedValue([
      {
        listaTurmaId: 'lista-turma-1',
        nomeLista: 'Simulado de Anatomia',
        totalAlunos: 18,
        totalSubmeteram: 11,
        totalPendentes: 7,
        taxaMediaAcerto: 73.4,
        prazo: '2099-06-10T23:59:00.000Z',
      },
    ]);

    render(<CardDesempenhoListas turmaId="turma-123" />);

    expect(screen.getByText('Carregando desempenho por lista...')).toBeInTheDocument();

    const lista = await screen.findByText('Simulado de Anatomia');
    const item = lista.closest('li');

    expect(mockedBuscarDesempenhoPorListas).toHaveBeenCalledWith('turma-123');
    expect(screen.getByText('1 lista(s) publicada(s)')).toBeInTheDocument();
    expect(item).not.toBeNull();
    expect(within(item!).getByText('11')).toBeInTheDocument();
    expect(within(item!).getByText('7')).toBeInTheDocument();
    expect(within(item!).getByText('73,4%')).toBeInTheDocument();
  });

  it('deve exibir lista publicada sem submissoes com taxa vazia', async () => {
    mockedBuscarDesempenhoPorListas.mockResolvedValue([
      {
        listaTurmaId: 'lista-turma-1',
        nomeLista: 'Lista sem respostas',
        totalAlunos: 18,
        totalSubmeteram: 0,
        totalPendentes: 18,
        taxaMediaAcerto: 0,
        prazo: null,
      },
    ]);

    render(<CardDesempenhoListas turmaId="turma-123" />);

    const lista = await screen.findByText('Lista sem respostas');
    const item = lista.closest('li');

    expect(item).not.toBeNull();
    expect(within(item!).getByText('0')).toBeInTheDocument();
    expect(within(item!).getByText('18')).toBeInTheDocument();
    expect(within(item!).getByText('-')).toBeInTheDocument();
    expect(within(item!).getByText('Sem prazo')).toBeInTheDocument();
  });

  it('deve destacar prazo expirado', async () => {
    mockedBuscarDesempenhoPorListas.mockResolvedValue([
      {
        listaTurmaId: 'lista-turma-1',
        nomeLista: 'Lista expirada',
        totalAlunos: 10,
        totalSubmeteram: 4,
        totalPendentes: 6,
        taxaMediaAcerto: 50,
        prazo: '2000-01-01T00:00:00.000Z',
      },
    ]);

    render(<CardDesempenhoListas turmaId="turma-123" />);

    expect(await screen.findByText('Prazo expirado')).toBeInTheDocument();
  });

  it('deve lidar com prazo invalido e total de alunos zerado', async () => {
    mockedBuscarDesempenhoPorListas.mockResolvedValue([
      {
        listaTurmaId: 'lista-turma-1',
        nomeLista: 'Lista com prazo invalido',
        totalAlunos: 0,
        totalSubmeteram: 1,
        totalPendentes: 0,
        taxaMediaAcerto: 100,
        prazo: 'data invalida',
      },
    ]);

    render(<CardDesempenhoListas turmaId="turma-123" />);

    const lista = await screen.findByText('Lista com prazo invalido');
    const item = lista.closest('li');

    expect(item).not.toBeNull();
    expect(within(item!).getByText('data invalida')).toBeInTheDocument();
    expect(within(item!).getByText('100%')).toBeInTheDocument();
  });

  it('deve exibir empty state quando nao houver listas publicadas', async () => {
    mockedBuscarDesempenhoPorListas.mockResolvedValue([]);

    render(<CardDesempenhoListas turmaId="turma-123" />);

    expect(await screen.findByText('Nenhuma lista publicada nesta turma.')).toBeInTheDocument();
  });

  it('deve exibir erro e tentar carregar novamente', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedBuscarDesempenhoPorListas
      .mockRejectedValueOnce(new Error('Falha ao carregar'))
      .mockResolvedValueOnce([]);

    render(<CardDesempenhoListas turmaId="turma-123" />);

    expect(
      await screen.findByText('Nao foi possivel carregar o desempenho por lista.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Tentar novamente/i }));

    expect(await screen.findByText('Nenhuma lista publicada nesta turma.')).toBeInTheDocument();
    expect(mockedBuscarDesempenhoPorListas).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  });

  it('deve abrir o modal de desempenho individual ao clicar no botão', async () => {
    mockedBuscarDesempenhoPorListas.mockResolvedValue([
      {
        listaTurmaId: 'lista-turma-1',
        nomeLista: 'Simulado de Anatomia',
        totalAlunos: 1,
        totalSubmeteram: 1,
        totalPendentes: 0,
        taxaMediaAcerto: 100,
        prazo: null,
      },
    ]);

    mockedBuscarDesempenhoListaIndividual.mockResolvedValue({
      listaTurmaId: 'lista-turma-1',
      nomeLista: 'Simulado de Anatomia',
      totalQuestoes: 10,
      desempenhoAlunos: [
        { 
          alunoId: 'aluno-1', 
          status: 'SUBMETIDA', 
          totalAcertos: 10, 
          taxaAcerto: 100, 
          submissaoEm: '2026-06-14T10:00:00.000Z', 
          mensagem: 'Respondida' 
        }
      ]
    });

    mockedBuscarUsuariosPorIds.mockResolvedValue([
      { 
        id: 'aluno-1', 
        nome: 'Pedro Cabeceira',
        email: 'pedro@teste.com' 
      } as UsuarioResumo
    ]);

    render(<CardDesempenhoListas turmaId="turma-123" />);

    const btnModal = await screen.findByRole('button', { name: /Ver desempenho dos alunos/i });
    fireEvent.click(btnModal);

    await waitFor(() => {
      expect(screen.getByText('Pedro Cabeceira')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('deve abrir o modal de questoes com mais erros com os dados da lista', async () => {
    mockedBuscarDesempenhoPorListas.mockResolvedValue([
      {
        listaTurmaId: 'lista-turma-1',
        nomeLista: 'Simulado de Anatomia',
        totalAlunos: 18,
        totalSubmeteram: 11,
        totalPendentes: 7,
        taxaMediaAcerto: 73.4,
        prazo: null,
      },
    ]);
    mockedBuscarTopErrosLista.mockResolvedValue({
      listaTurmaId: 'lista-turma-1',
      nomeLista: 'Simulado de Anatomia',
      totalAlunosResponderam: 11,
      questoes: [],
    });

    render(<CardDesempenhoListas turmaId="turma-123" />);

    const botao = await screen.findByRole('button', { name: 'Ver questões com mais erros' });
    expect(botao.querySelector('svg')).toHaveAttribute('width', '14');
    expect(botao.querySelector('svg')).toHaveAttribute('height', '14');
    fireEvent.click(botao);

    expect(screen.getByRole('heading', { name: 'Questões com mais erros' })).toBeInTheDocument();
    expect(screen.getAllByText('Simulado de Anatomia')).toHaveLength(2);
    await waitFor(() => {
      expect(mockedBuscarTopErrosLista).toHaveBeenCalledWith(
        'turma-123',
        'lista-turma-1',
      );
    });
    expect(
      await screen.findByText('Nenhuma questão recebeu respostas erradas nesta lista.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(screen.queryByRole('heading', { name: 'Questões com mais erros' })).not.toBeInTheDocument();
  });

  it('nao exibe campo de busca quando nao ha listas publicadas na turma', async () => {
    mockedBuscarDesempenhoPorListas.mockResolvedValue([]);

    render(<CardDesempenhoListas turmaId="turma-123" />);

    expect(await screen.findByText('Nenhuma lista publicada nesta turma.')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Buscar lista por nome')).not.toBeInTheDocument();
  });

  it('filtra listas por nome parcial ignorando maiusculas, minusculas e acentos e atualiza o contador', async () => {
    const user = userEvent.setup();
    mockedBuscarDesempenhoPorListas.mockResolvedValue([
      {
        listaTurmaId: 'lista-1',
        nomeLista: 'A ser manipulada',
        totalAlunos: 3,
        totalSubmeteram: 0,
        totalPendentes: 3,
        taxaMediaAcerto: 0,
        prazo: null,
      },
      {
        listaTurmaId: 'lista-2',
        nomeLista: 'Aquecimento Geral (Nível Fácil)',
        totalAlunos: 3,
        totalSubmeteram: 1,
        totalPendentes: 2,
        taxaMediaAcerto: 80,
        prazo: null,
      },
      {
        listaTurmaId: 'lista-3',
        nomeLista: 'Simulado de Neuroanatomia - 2026.1',
        totalAlunos: 3,
        totalSubmeteram: 3,
        totalPendentes: 0,
        taxaMediaAcerto: 73,
        prazo: '2000-01-01T00:00:00.000Z',
      },
    ]);

    render(<CardDesempenhoListas turmaId="turma-123" />);

    const campoBusca = await screen.findByPlaceholderText('Buscar lista por nome');
    expect(screen.getByText('3 lista(s) publicada(s)')).toBeInTheDocument();

    // Busca sem acento e minuscula por "nivel facil".
    await user.type(campoBusca, 'nivel facil');

    expect(screen.getByText('1 de 3 lista(s) publicada(s)')).toBeInTheDocument();
    expect(screen.getByText('Aquecimento Geral (Nível Fácil)')).toBeInTheDocument();
    expect(screen.queryByText('A ser manipulada')).not.toBeInTheDocument();
    expect(screen.queryByText('Simulado de Neuroanatomia - 2026.1')).not.toBeInTheDocument();

    // Limpa pelo botao X dentro do input e restaura todas as listas.
    await user.click(screen.getByRole('button', { name: 'Limpar busca' }));

    expect(campoBusca).toHaveValue('');
    expect(screen.getByText('3 lista(s) publicada(s)')).toBeInTheDocument();
    expect(screen.getByText('A ser manipulada')).toBeInTheDocument();
    expect(screen.getByText('Simulado de Neuroanatomia - 2026.1')).toBeInTheDocument();
  });

  it('exibe mensagem informativa quando nao encontra resultados e permite limpar a busca', async () => {
    const user = userEvent.setup();
    mockedBuscarDesempenhoPorListas.mockResolvedValue([
      {
        listaTurmaId: 'lista-1',
        nomeLista: 'Simulado de Neuroanatomia - 2026.1',
        totalAlunos: 3,
        totalSubmeteram: 3,
        totalPendentes: 0,
        taxaMediaAcerto: 73,
        prazo: null,
      },
      {
        listaTurmaId: 'lista-2',
        nomeLista: 'Aquecimento Geral (Nível Fácil)',
        totalAlunos: 3,
        totalSubmeteram: 0,
        totalPendentes: 3,
        taxaMediaAcerto: 0,
        prazo: null,
      },
    ]);

    render(<CardDesempenhoListas turmaId="turma-123" />);

    const campoBusca = await screen.findByPlaceholderText('Buscar lista por nome');
    await user.type(campoBusca, 'Cardiologia');

    expect(screen.getByText('0 de 2 lista(s) publicada(s)')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma lista encontrada.')).toBeInTheDocument();
    expect(
      screen.getByText(/Não encontramos listas correspondentes a/i),
    ).toBeInTheDocument();

    // Botao "Limpar busca" do estado vazio restaura todas as listas.
    const botoesLimpar = screen.getAllByRole('button', { name: 'Limpar busca' });
    await user.click(botoesLimpar[botoesLimpar.length - 1]);

    expect(campoBusca).toHaveValue('');
    expect(screen.getByText('2 lista(s) publicada(s)')).toBeInTheDocument();
    expect(screen.getByText('Simulado de Neuroanatomia - 2026.1')).toBeInTheDocument();
    expect(screen.getByText('Aquecimento Geral (Nível Fácil)')).toBeInTheDocument();
  });

  it('preserva dados e acoes de desempenho dos alunos e top erros no cartao filtrado', async () => {
    const user = userEvent.setup();
    mockedBuscarDesempenhoPorListas.mockResolvedValue([
      {
        listaTurmaId: 'lista-1',
        nomeLista: 'A ser manipulada',
        totalAlunos: 3,
        totalSubmeteram: 0,
        totalPendentes: 3,
        taxaMediaAcerto: 0,
        prazo: null,
      },
      {
        listaTurmaId: 'lista-3',
        nomeLista: 'Simulado de Neuroanatomia - 2026.1',
        totalAlunos: 3,
        totalSubmeteram: 3,
        totalPendentes: 0,
        taxaMediaAcerto: 73,
        prazo: '2000-01-01T00:00:00.000Z',
      },
    ]);

    mockedBuscarDesempenhoListaIndividual.mockResolvedValue({
      listaTurmaId: 'lista-3',
      nomeLista: 'Simulado de Neuroanatomia - 2026.1',
      totalQuestoes: 10,
      desempenhoAlunos: [
        {
          alunoId: 'aluno-1',
          status: 'SUBMETIDA',
          totalAcertos: 8,
          taxaAcerto: 80,
          submissaoEm: '2026-06-14T10:00:00.000Z',
          mensagem: 'Respondida',
        },
      ],
    });
    mockedBuscarUsuariosPorIds.mockResolvedValue([
      { id: 'aluno-1', nome: 'João Silva', email: 'joao@seed.com' } as UsuarioResumo,
    ]);
    mockedBuscarTopErrosLista.mockResolvedValue({
      listaTurmaId: 'lista-3',
      nomeLista: 'Simulado de Neuroanatomia - 2026.1',
      totalAlunosResponderam: 3,
      questoes: [],
    });

    render(<CardDesempenhoListas turmaId="turma-123" />);

    const campoBusca = await screen.findByPlaceholderText('Buscar lista por nome');
    await user.type(campoBusca, 'NEUROANATOMIA');

    expect(screen.getByText('1 de 2 lista(s) publicada(s)')).toBeInTheDocument();
    const titulo = screen.getByText('Simulado de Neuroanatomia - 2026.1');
    const card = titulo.closest('li');
    expect(card).not.toBeNull();
    expect(within(card!).getByText('Prazo expirado')).toBeInTheDocument();
    expect(within(card!).getByText('100%')).toBeInTheDocument();
    expect(within(card!).getByText('73%')).toBeInTheDocument();

    // Acao 1: Ver desempenho dos alunos
    await user.click(within(card!).getByRole('button', { name: /Ver desempenho dos alunos/i }));
    expect(await screen.findByText('João Silva')).toBeInTheDocument();
    expect(mockedBuscarDesempenhoListaIndividual).toHaveBeenCalledWith('turma-123', 'lista-3');

    // Acao 2: Ver questoes com mais erros
    await user.click(within(card!).getByRole('button', { name: 'Ver questões com mais erros' }));
    expect(screen.getByRole('heading', { name: 'Questões com mais erros' })).toBeInTheDocument();
    await waitFor(() => {
      expect(mockedBuscarTopErrosLista).toHaveBeenCalledWith('turma-123', 'lista-3');
    });
  });
});