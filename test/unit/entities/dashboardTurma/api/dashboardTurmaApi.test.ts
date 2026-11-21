import {
  buscarDashboardMacro,
  buscarDesempenhoIndividual,
  buscarDesempenhoPorListas,
  buscarDesempenhoListaIndividual,
  buscarDetalheEntrega,
} from '../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi';
import { httpClient } from '../../../../../src/shared/api/httpClient';

jest.mock('../../../../../src/shared/api/httpClient', () => ({
  httpClient: {
    get: jest.fn(),
  },
}));

describe('dashboardTurmaApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve chamar a API e retornar os dados do macro dashboard', async () => {
    const mockData = { totalAlunos: 10, totalQuestoesRespondidas: 5, taxaMediaAcertos: 50, desempenhoPorTema: [] };

    (httpClient.get as jest.Mock).mockResolvedValue({ data: mockData });

    const result = await buscarDashboardMacro('turma-123');

    expect(httpClient.get).toHaveBeenCalledWith('/turmasDashboard/turma-123/macro');
    expect(result).toEqual(mockData);
  });

  describe('buscarDesempenhoIndividual', () => {
    it('deve fazer GET para /turmasDashboard/:id/individual e retornar os dados', async () => {
      const mockData = {
        alunos: [
          {
            alunoId: 'aluno-1',
            totalRespondidas: 10,
            totalAcertos: 8,
            taxaAcerto: 80,
            ultimaAtividade: '2026-05-30T10:00:00.000Z',
            desempenhoPorTema: [],
          },
        ],
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await buscarDesempenhoIndividual('turma-123');

      expect(httpClient.get).toHaveBeenCalledWith('/turmasDashboard/turma-123/individual');
      expect(result).toEqual(mockData);
    });

    it('deve retornar lista vazia de alunos quando não há dados', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: { alunos: [] } });

      const result = await buscarDesempenhoIndividual('turma-456');

      expect(httpClient.get).toHaveBeenCalledWith('/turmasDashboard/turma-456/individual');
      expect(result.alunos).toHaveLength(0);
    });
  });

  describe('buscarDesempenhoPorListas', () => {
    it('deve fazer GET para /turmasDashboard/:id/listas e retornar os dados', async () => {
      const mockData = [
        {
          listaTurmaId: 'lista-turma-1',
          nomeLista: 'Simulado de Anatomia',
          totalAlunos: 18,
          totalSubmeteram: 11,
          totalPendentes: 7,
          taxaMediaAcerto: 73.4,
          prazo: '2026-06-10T23:59:00.000Z',
        },
      ];

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await buscarDesempenhoPorListas('turma-123');

      expect(httpClient.get).toHaveBeenCalledWith('/turmasDashboard/turma-123/listas');
      expect(result).toEqual(mockData);
    });

    it('deve retornar lista vazia quando nao houver desempenho por lista', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [] });

      const result = await buscarDesempenhoPorListas('turma-456');

      expect(httpClient.get).toHaveBeenCalledWith('/turmasDashboard/turma-456/listas');
      expect(result).toEqual([]);
    });
  });

  it('deve buscar o desempenho individual de uma lista específica', async () => {
    const mockDesempenhoLista = {
      listaTurmaId: 'lista-456',
      nomeLista: 'Simulado de Neuroanatomia',
      totalQuestoes: 10,
      desempenhoAlunos: [
        {
          alunoId: 'aluno-123',
          status: 'SUBMETIDA',
          totalAcertos: 8,
          taxaAcerto: 80,
          submissaoEm: '2026-06-14T10:00:00.000Z',
          mensagem: 'Respondida',
        },
      ],
    };

    (httpClient.get as jest.Mock).mockResolvedValue({
      data: mockDesempenhoLista,
    });

    const resultado = await buscarDesempenhoListaIndividual('turma-123', 'lista-456');

    expect(httpClient.get).toHaveBeenCalledWith('/turmasDashboard/turma-123/listas/lista-456');
    
    expect(resultado).toEqual(mockDesempenhoLista);
  });

  it('deve buscar o detalhe da entrega do aluno selecionado', async () => {
    const mockDetalheEntrega = {
      lista: {
        id: 'lista-turma-1',
        nome: 'Lista de Neuroanatomia',
        publicadaEm: '2026-11-19T12:00:00.000Z',
      },
      alunoId: 'aluno-123',
      resumo: {
        totalQuestoes: 2,
        acertos: 1,
        erros: 0,
        naoRespondidas: 1,
        taxaAcerto: 50,
      },
      questoes: [],
    };

    (httpClient.get as jest.Mock).mockResolvedValue({ data: mockDetalheEntrega });

    const resultado = await buscarDetalheEntrega(
      'turma-123',
      'lista-turma-1',
      'aluno-123',
    );

    expect(httpClient.get).toHaveBeenCalledWith(
      '/turmasDashboard/turma-123/listas/lista-turma-1/alunos/aluno-123/entrega',
    );
    expect(resultado).toEqual(mockDetalheEntrega);
  });
});
