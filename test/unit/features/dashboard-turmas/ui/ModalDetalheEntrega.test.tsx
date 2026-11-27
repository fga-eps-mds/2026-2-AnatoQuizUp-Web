import { fireEvent, render, screen } from '@testing-library/react';
import { buscarDetalheEntrega } from '../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi';
import { ModalDetalheEntrega } from '../../../../../src/features/dashboard-turmas/ui/ModalDetalheEntrega';

jest.mock('../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi', () => ({
  buscarDetalheEntrega: jest.fn(),
}));

const buscarDetalheEntregaMock = jest.mocked(buscarDetalheEntrega);

describe('ModalDetalheEntrega', () => {
  beforeEach(() => {
    buscarDetalheEntregaMock.mockReset();
  });

  it('apresenta o resumo e o resultado individual de cada questão', async () => {
    buscarDetalheEntregaMock.mockResolvedValue({
      lista: {
        id: 'lista-turma-1',
        nome: 'Lista de Neuroanatomia',
        publicadaEm: '2026-11-19T12:00:00.000Z',
      },
      alunoId: 'aluno-1',
      resumo: {
        totalQuestoes: 3,
        acertos: 1,
        erros: 1,
        naoRespondidas: 1,
        taxaAcerto: 33,
      },
      questoes: [
        {
          ordem: 1,
          questaoId: 'questao-1',
          enunciado: 'Questão respondida corretamente',
          respostaAluno: { alternativa: 'A', texto: 'Resposta correta' },
          resultado: 'ACERTO',
          gabarito: null,
        },
        {
          ordem: 2,
          questaoId: 'questao-2',
          enunciado: 'Questão respondida incorretamente',
          respostaAluno: { alternativa: 'B', texto: 'Resposta incorreta' },
          resultado: 'ERRO',
          gabarito: { alternativa: 'C', texto: 'Alternativa correta' },
        },
        {
          ordem: 3,
          questaoId: 'questao-3',
          enunciado: 'Questão sem resposta',
          respostaAluno: null,
          resultado: 'NAO_RESPONDIDA',
          gabarito: null,
        },
      ],
    });

    const onBack = jest.fn();
    render(
      <ModalDetalheEntrega
        turmaId="turma-1"
        listaId="lista-turma-1"
        alunoId="aluno-1"
        rotuloVoltar="Voltar à evolução"
        onBack={onBack}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Lista de Neuroanatomia' })).toBeInTheDocument();
    expect(screen.getByText('Publicada em 19/11/2026')).toBeInTheDocument();
    expect(screen.getByText('1 acerto · 1 erro · 1 sem resposta · 33% de acerto')).toBeInTheDocument();
    expect(screen.getByText('Acertou')).toBeInTheDocument();
    expect(screen.getByText('Errou')).toBeInTheDocument();
    expect(screen.getAllByText('Não respondida')).toHaveLength(2);
    expect(screen.getByText('C. Alternativa correta')).toBeInTheDocument();
    expect(screen.getAllByText('Gabarito:')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Voltar à evolução' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('informa quando a entrega não pode ser carregada', async () => {
    buscarDetalheEntregaMock.mockRejectedValue(new Error('Falha na consulta'));

    render(
      <ModalDetalheEntrega
        turmaId="turma-1"
        listaId="lista-turma-1"
        alunoId="aluno-1"
        rotuloVoltar="Voltar ao histórico"
        onBack={jest.fn()}
      />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar esta entrega.');
  });
});
