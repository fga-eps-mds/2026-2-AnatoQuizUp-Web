import { httpClient } from '../../../../../src/shared/api/httpClient';
import {
  atualizarTurma,
  buscarTurmaPorId,
  criarTurma,
  desvincularAlunoTurma,
  excluirTurma,
  listarAlunosDaTurma,
  listarTurmas,
  vincularAlunoTurma,
} from '../../../../../src/entities/turmas/api/turmaApi';

jest.mock('../../../../../src/shared/api/httpClient', () => ({
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('turmaApi', () => {
  const turmaApi = {
    id: 'turma-1',
    codigo: 'ANAT-01',
    nome: 'Anatomia Sistemica',
    semestre: '1',
    ano: 2026,
    descricao: 'Turma de teste',
    status: 'ATIVA' as const,
    criadoEm: '2026-05-16T10:00:00.000Z',
    _count: {
      alunos: 20,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarTurmas', () => {
    it('deve fazer GET para /turmas e normalizar a contagem de alunos', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({
        data: {
          mensagem: 'Turmas listadas com sucesso',
          dados: [turmaApi],
        },
      });

      const resultado = await listarTurmas();

      expect(httpClient.get).toHaveBeenCalledWith('/turmas', { params: undefined });
      expect(resultado).toEqual([
        {
          id: 'turma-1',
          codigo: 'ANAT-01',
          nome: 'Anatomia Sistemica',
          semestre: '1',
          ano: 2026,
          descricao: 'Turma de teste',
          status: 'ATIVA',
          criadoEm: '2026-05-16T10:00:00.000Z',
          quantidadeAlunos: 20,
        },
      ]);
    });

    it('deve repassar os filtros como query params', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({
        data: { mensagem: 'OK', dados: [] },
      });

      await listarTurmas({
        busca: 'Neuro',
        status: 'INATIVA',
        semestre: '2',
        ano: 2025,
      });

      expect(httpClient.get).toHaveBeenCalledWith('/turmas', {
        params: {
          busca: 'Neuro',
          status: 'INATIVA',
          semestre: '2',
          ano: 2025,
        },
      });
    });
  });

  it('deve criar uma turma', async () => {
    const payload = {
      codigo: 'ANAT-01',
      nome: 'Anatomia Sistemica',
      semestre: '1',
      ano: 2026,
      descricao: 'Turma de teste',
      status: 'ATIVA' as const,
    };

    (httpClient.post as jest.Mock).mockResolvedValue({
      data: { mensagem: 'Criada', dados: turmaApi },
    });

    const resultado = await criarTurma(payload);

    expect(httpClient.post).toHaveBeenCalledWith('/turmas', payload);
    expect(resultado.quantidadeAlunos).toBe(20);
  });

  it('deve atualizar uma turma', async () => {
    const payload = { nome: 'Neuroanatomia' };
    (httpClient.patch as jest.Mock).mockResolvedValue({
      data: { mensagem: 'Atualizada', dados: { ...turmaApi, nome: 'Neuroanatomia' } },
    });

    const resultado = await atualizarTurma('turma-1', payload);

    expect(httpClient.patch).toHaveBeenCalledWith('/turmas/turma-1', payload);
    expect(resultado.nome).toBe('Neuroanatomia');
  });

  it('deve excluir uma turma', async () => {
    (httpClient.delete as jest.Mock).mockResolvedValue({});

    await excluirTurma('turma-123');

    expect(httpClient.delete).toHaveBeenCalledWith('/turmas/turma-123');
  });

  it('deve listar vinculos de alunos da turma', async () => {
    const vinculos = [{ id: 'vinculo-1', turmaId: 'turma-1', alunoId: 'aluno-1' }];
    (httpClient.get as jest.Mock).mockResolvedValue({
      data: { mensagem: 'OK', dados: vinculos },
    });

    const resultado = await listarAlunosDaTurma('turma-1');

    expect(httpClient.get).toHaveBeenCalledWith('/turmas/turma-1/alunos');
    expect(resultado).toBe(vinculos);
  });

  it('deve vincular aluno a turma', async () => {
    const vinculo = { id: 'vinculo-1', turmaId: 'turma-1', alunoId: 'aluno-1' };
    (httpClient.post as jest.Mock).mockResolvedValue({
      data: { mensagem: 'OK', dados: vinculo },
    });

    const resultado = await vincularAlunoTurma('turma-1', 'aluno-1');

    expect(httpClient.post).toHaveBeenCalledWith('/turmas/turma-1/alunos', {
      alunoId: 'aluno-1',
    });
    expect(resultado).toBe(vinculo);
  });

  it('deve desvincular aluno da turma', async () => {
    (httpClient.delete as jest.Mock).mockResolvedValue({});

    await desvincularAlunoTurma('turma-1', 'aluno-1');

    expect(httpClient.delete).toHaveBeenCalledWith('/turmas/turma-1/alunos/aluno-1');
  });

  it('deve buscar uma turma por id', async () => {
    (httpClient.get as jest.Mock).mockResolvedValue({
      data: { mensagem: 'OK', dados: turmaApi },
    });

    const resultado = await buscarTurmaPorId('turma-1');

    expect(httpClient.get).toHaveBeenCalledWith('/turmas/turma-1');
    expect(resultado.quantidadeAlunos).toBe(20);
  });

  it('deve normalizar a contagem de alunos para 0 quando a API nao devolve nem quantidadeAlunos nem _count', async () => {
    const turmaSemContagem: Record<string, unknown> = { ...turmaApi };
    delete turmaSemContagem._count;
    (httpClient.get as jest.Mock).mockResolvedValue({
      data: { mensagem: 'OK', dados: turmaSemContagem },
    });

    const resultado = await buscarTurmaPorId('turma-1');

    expect(resultado.quantidadeAlunos).toBe(0);
  });
});
