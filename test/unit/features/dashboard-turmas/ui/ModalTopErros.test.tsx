import { act, fireEvent, render, screen } from '@testing-library/react';
import { buscarTopErrosLista } from '../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi';
import { ModalTopErros } from '../../../../../src/features/dashboard-turmas/ui/ModalTopErros';

jest.mock('../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi', () => ({
  buscarTopErrosLista: jest.fn(),
}));

const mockedBuscarTopErrosLista = jest.mocked(buscarTopErrosLista);

describe('ModalTopErros', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar questoes com enunciado, erros, respostas e percentual', async () => {
    mockedBuscarTopErrosLista.mockResolvedValue({
      listaTurmaId: 'lista-turma-1',
      nomeLista: 'Simulado de Anatomia',
      totalAlunosResponderam: 2,
      questoes: [
        {
          questaoId: 'questao-1',
          numeroQuestao: 3,
          enunciado: 'Qual estrutura compõe o sistema nervoso central?',
          tema: 'Neuroanatomia',
          totalErros: 2,
          totalRespostas: 2,
          percentualErro: 100,
        },
      ],
    });

    render(
      <ModalTopErros
        turmaId="turma-123"
        listaId="lista-turma-1"
        nomeLista="Simulado de Anatomia"
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(await screen.findByText(/Qual estrutura compõe o sistema nervoso central/i)).toBeInTheDocument();
    expect(screen.getByText('Questão 3 - Neuroanatomia')).toBeInTheDocument();
    expect(screen.getByText(/2 de 2 alunos erraram · 100%/i)).toBeInTheDocument();
    expect(screen.getByText(/2 alunos responderam · Ordenado por quantidade de erros/i)).toBeInTheDocument();
  });

  it('deve exibir estado de erro quando a API rejeita', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedBuscarTopErrosLista.mockRejectedValue(new Error('Falha da API'));

    render(
      <ModalTopErros
        turmaId="turma-123"
        listaId="lista-turma-1"
        nomeLista="Simulado"
        onClose={jest.fn()}
      />,
    );

    expect(await screen.findByText('Erro ao carregar dados.')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('deve exibir mensagem quando a lista nao possui respostas', async () => {
    mockedBuscarTopErrosLista.mockResolvedValue({
      listaTurmaId: 'lista-turma-1',
      nomeLista: 'Lista sem respostas',
      totalAlunosResponderam: 0,
      questoes: [],
    });

    render(
      <ModalTopErros
        turmaId="turma-123"
        listaId="lista-turma-1"
        nomeLista="Lista sem respostas"
        onClose={jest.fn()}
      />,
    );

    expect(
      await screen.findByText('Nenhuma questão recebeu respostas erradas nesta lista.'),
    ).toBeInTheDocument();
  });

  it('deve renderizar uma questao sem erros', async () => {
    mockedBuscarTopErrosLista.mockResolvedValue({
      listaTurmaId: 'lista-turma-1',
      nomeLista: 'Lista sem erros',
      totalAlunosResponderam: 1,
      questoes: [
        {
          questaoId: 'questao-1',
          numeroQuestao: 1,
          enunciado: 'Questao respondida corretamente',
          tema: 'Anatomia geral',
          totalErros: 0,
          totalRespostas: 1,
          percentualErro: 0,
        },
      ],
    });

    render(
      <ModalTopErros
        turmaId="turma-123"
        listaId="lista-turma-1"
        nomeLista="Lista sem erros"
        onClose={jest.fn()}
      />,
    );

    expect(await screen.findByText('Questao respondida corretamente')).toBeInTheDocument();
    expect(screen.getByText(/0 de 1 alunos erraram · 0%/i)).toBeInTheDocument();
  });

  it('deve chamar onClose ao fechar', async () => {
    mockedBuscarTopErrosLista.mockResolvedValue({
      listaTurmaId: 'lista-turma-1',
      nomeLista: 'Simulado',
      totalAlunosResponderam: 0,
      questoes: [],
    });
    const onClose = jest.fn();

    render(
      <ModalTopErros
        turmaId="turma-123"
        listaId="lista-turma-1"
        nomeLista="Simulado"
        onClose={onClose}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: '✕' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve cancelar a atualizacao quando desmontado antes da resposta', async () => {
    let resolver: ((value: {
      listaTurmaId: string;
      nomeLista: string;
      totalAlunosResponderam: number;
      questoes: [];
    }) => void) | undefined;
    mockedBuscarTopErrosLista.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve;
        }),
    );
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = render(
      <ModalTopErros
        turmaId="turma-123"
        listaId="lista-turma-1"
        nomeLista="Simulado"
        onClose={jest.fn()}
      />,
    );

    unmount();

    await act(async () => {
      resolver?.({
        listaTurmaId: 'lista-turma-1',
        nomeLista: 'Simulado',
        totalAlunosResponderam: 0,
        questoes: [],
      });
      await Promise.resolve();
    });

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
