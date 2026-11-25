import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvolucaoTemaAluno } from '../../../../../src/features/dashboard-turmas/ui/EvolucaoTemaAluno';
import { buscarEvolucaoTemasAluno } from '../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi';

jest.mock('../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi', () => ({
  buscarEvolucaoTemasAluno: jest.fn(),
}));


const mockBuscarEvolucao = buscarEvolucaoTemasAluno as jest.Mock;

describe('EvolucaoTemaAluno', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe resultados, pendencias e variacao do tema selecionado', async () => {
    mockBuscarEvolucao.mockResolvedValue({
      alunoId: 'aluno-1',
      temas: [{
        temaId: 'tema-1',
        nome: 'Osteologia',
        totalResultadosValidos: 2,
        mensagem: null,
        resultados: [
          {
            listaTurmaId: 'lista-1',
            nomeLista: 'Bases de osteologia',
            publicadaEm: '2026-03-12T10:00:00.000Z',
            status: 'SUBMETIDA',
            acertos: 2,
            totalQuestoes: 5,
            taxaAcerto: 40,
            variacaoPp: null,
          },
          {
            listaTurmaId: 'lista-2',
            nomeLista: 'Revisao',
            publicadaEm: '2026-03-19T10:00:00.000Z',
            status: 'NAO_RESPONDEU',
            acertos: null,
            totalQuestoes: 4,
            taxaAcerto: null,
            variacaoPp: null,
          },
          {
            listaTurmaId: 'lista-3',
            nomeLista: 'Osteologia aplicada',
            publicadaEm: '2026-04-09T10:00:00.000Z',
            status: 'SUBMETIDA',
            acertos: 4,
            totalQuestoes: 5,
            taxaAcerto: 80,
            variacaoPp: 40,
          },
        ],
      }],
    });

    render(
      <EvolucaoTemaAluno turmaId="turma-1" alunoId="aluno-1" />,
    );

    expect(await screen.findByText('Osteologia')).toBeInTheDocument();
    expect(screen.getByText('2 de 5')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('4 de 5')).toBeInTheDocument();
    expect(screen.getByText('Variação entre entregas: +40 pontos percentuais')).toBeInTheDocument();
    const linhas = screen.getAllByRole('row');
    expect(linhas[1]).toHaveTextContent('Bases de osteologia');
    expect(linhas[2]).toHaveTextContent('Revisao');
    expect(linhas[3]).toHaveTextContent('Osteologia aplicada');
  });

  it('permite selecionar outro tema e outro semestre', async () => {
    const user = userEvent.setup();
    mockBuscarEvolucao.mockResolvedValue({
      alunoId: 'aluno-1',
      temas: [
        {
          temaId: 'tema-1',
          nome: 'Osteologia',
          totalResultadosValidos: 1,
          mensagem: null,
          resultados: [{
            listaTurmaId: 'lista-1',
            nomeLista: 'Lista de ossos',
            publicadaEm: '2026-03-12T10:00:00.000Z',
            status: 'SUBMETIDA',
            acertos: 3,
            totalQuestoes: 4,
            taxaAcerto: 75,
            variacaoPp: null,
          }],
        },
        {
          temaId: 'tema-2',
          nome: 'Neuroanatomia',
          totalResultadosValidos: 1,
          mensagem: null,
          resultados: [{
            listaTurmaId: 'lista-2',
            nomeLista: 'Lista de neuro',
            publicadaEm: '2026-04-09T10:00:00.000Z',
            status: 'SUBMETIDA',
            acertos: 4,
            totalQuestoes: 5,
            taxaAcerto: 80,
            variacaoPp: null,
          }],
        },
      ],
    });

    render(
      <EvolucaoTemaAluno turmaId="turma-1" alunoId="aluno-1" />,
    );

    await user.click(await screen.findByRole('button', { name: 'Neuroanatomia' }));
    expect(screen.getByText('Lista de neuro')).toBeInTheDocument();
    expect(screen.queryByText('Lista de ossos')).not.toBeInTheDocument();

    const ano = new Date().getFullYear();
    const outroSemestre = new Date().getMonth() < 6 ? 2 : 1;
    await user.click(screen.getByRole('button', { name: `${outroSemestre}º semestre` }));

    await waitFor(() => {
      expect(mockBuscarEvolucao).toHaveBeenLastCalledWith(
        'turma-1',
        'aluno-1',
        outroSemestre === 1
          ? {
              inicio: `${ano}-01-01T00:00:00.000Z`,
              fim: `${ano}-06-30T23:59:59.999Z`,
            }
          : {
              inicio: `${ano}-07-01T00:00:00.000Z`,
              fim: `${ano}-12-31T23:59:59.999Z`,
            },
      );
    });
  });

  it('informa quando existe apenas uma entrega valida', async () => {
    mockBuscarEvolucao.mockResolvedValue({
      alunoId: 'aluno-1',
      temas: [{
        temaId: 'tema-1',
        nome: 'Neuroanatomia',
        totalResultadosValidos: 1,
        mensagem: 'Uma entrega disponível. São necessárias duas para comparar.',
        resultados: [{
          listaTurmaId: 'lista-1',
          nomeLista: 'Neuro aplicada',
          publicadaEm: '2026-03-12T10:00:00.000Z',
          status: 'SUBMETIDA',
          acertos: 3,
          totalQuestoes: 4,
          taxaAcerto: 75,
          variacaoPp: null,
        }],
      }],
    });

    render(
      <EvolucaoTemaAluno turmaId="turma-1" alunoId="aluno-1" />,
    );

    expect(
      await screen.findByText('Uma entrega disponível. São necessárias duas para comparar.'),
    ).toBeInTheDocument();
  });

  it('informa quando nao existem resultados no periodo', async () => {
    mockBuscarEvolucao.mockResolvedValue({
      alunoId: 'aluno-1',
      temas: [],
    });

    render(
      <EvolucaoTemaAluno turmaId="turma-1" alunoId="aluno-1" />,
    );

    expect(
      await screen.findByText('Nenhuma lista com temas foi encontrada no período.'),
    ).toBeInTheDocument();
  });

  it('permite selecionar outro semestre quando o período não tem listas', async () => {
    const user = userEvent.setup();
    const temaComResultado = {
      alunoId: 'aluno-1',
      temas: [{
        temaId: 'tema-1',
        nome: 'Neuroanatomia',
        totalResultadosValidos: 1,
        mensagem: null,
        resultados: [{
          listaTurmaId: 'lista-1',
          nomeLista: 'Neuro aplicada',
          publicadaEm: '2026-03-12T10:00:00.000Z',
          status: 'SUBMETIDA',
          acertos: 3,
          totalQuestoes: 4,
          taxaAcerto: 75,
          variacaoPp: null,
        }],
      }],
    };
    mockBuscarEvolucao
      .mockResolvedValueOnce(temaComResultado)
      .mockResolvedValueOnce({ alunoId: 'aluno-1', temas: [] })
      .mockResolvedValueOnce(temaComResultado);

    render(
      <EvolucaoTemaAluno turmaId="turma-1" alunoId="aluno-1" />,
    );

    expect(await screen.findByText('Neuro aplicada')).toBeInTheDocument();

    const semestreAtual = new Date().getMonth() < 6 ? 1 : 2;
    const outroSemestre = semestreAtual === 1 ? 2 : 1;
    await user.click(screen.getByRole('button', { name: `${outroSemestre}º semestre` }));

    expect(
      await screen.findByText('Nenhuma lista com temas foi encontrada no período.'),
    ).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Voltar' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: `${outroSemestre === 1 ? 2 : 1}º semestre` }));

    expect(await screen.findByText('Neuro aplicada')).toBeInTheDocument();
  });

  it('identifica lista pendente na comparação', async () => {
    mockBuscarEvolucao.mockResolvedValue({
      alunoId: 'aluno-1',
      temas: [{
        temaId: 'tema-1',
        nome: 'Osteologia',
        totalResultadosValidos: 0,
        mensagem: 'Nenhuma entrega concluída para comparação.',
        resultados: [{
          listaTurmaId: 'lista-1',
          nomeLista: 'Lista pendente',
          publicadaEm: '2026-03-12T10:00:00.000Z',
          status: 'EM_ANDAMENTO',
          acertos: null,
          totalQuestoes: 4,
          taxaAcerto: null,
          variacaoPp: null,
        }],
      }],
    });

    render(
      <EvolucaoTemaAluno turmaId="turma-1" alunoId="aluno-1" />,
    );

    expect(await screen.findByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma entrega concluída para comparação.')).toBeInTheDocument();
  });

});
