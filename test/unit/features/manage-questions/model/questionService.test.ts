/// <reference types="jest" />

const getMock = jest.fn();
const postMock = jest.fn();
const putMock = jest.fn();
const deleteMock = jest.fn();

const loadService = async (useMocks: boolean) => {
  jest.resetModules();
  getMock.mockReset();
  postMock.mockReset();
  putMock.mockReset();
  deleteMock.mockReset();

  jest.doMock('../../../../../src/shared/config/env', () => ({
    USE_MOCKS: useMocks,
  }));

  jest.doMock('../../../../../src/shared/api/httpClient', () => ({
    httpClient: {
      get: getMock,
      post: postMock,
      put: putMock,
      delete: deleteMock,
    },
  }));

  return import('../../../../../src/features/manage-questions/model/questionService');
};

const formValues = {
  topic: 'Tórax',
  tags: 'aorta, mediastino',
  type: 'Múltipla escolha' as const,
  difficulty: 'Médio' as const,
  origemQuestao: 'ELABORADA_POR_PROFESSOR' as const,
  statement: 'Qual estrutura forma a parede anterior do mediastino superior?',
  explanation: 'O manúbrio se relaciona com os grandes vasos.',
  image: null,
  taxonomiaBloom: 'LEMBRAR' as const,
  regiaoAnatomica: 'Tórax',
  alternatives: [
    { id: 'a', label: 'A', text: 'Esterno', isCorrect: false },
    { id: 'b', label: 'B', text: 'Manúbrio do esterno', isCorrect: true },
    { id: 'c', label: 'C', text: 'Clavícula', isCorrect: false },
    { id: 'd', label: 'D', text: 'Escápula', isCorrect: false },
    { id: 'e', label: 'E', text: 'Primeira costela', isCorrect: false },
  ],
};

const apiQuestion = {
  id: 'question-1',
  tema: { id: 'tema-1', nome: 'Tórax' },
  tipo: 'MULTIPLA_ESCOLHA',
  dificuldade: 'MEDIA',
  imagem: 'https://exemplo.com/torax.png',
  enunciado: 'Pergunta anatômica',
  alternativaCorreta: 'A',
  saibaMais: 'Explicação pedagógica',
  taxonomiaBloom: 'ANALISAR',
  origemQuestao: 'PROVA_ANTERIOR',
  regiaoAnatomica: 'Tórax',
  alternativas: { A: 'Resposta', B: 'Distrator' },
  status: 'ATIVO',
  criadoPorId: 'professor-api',
  criadoEm: '2025-03-31T10:00:00.000Z',
  atualizadoEm: '2025-03-31T10:00:00.000Z',
  excluidoEm: null,
};

describe('questionService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists active professor questions from the API', async () => {
    const { listProfessorQuestions } = await loadService(false);
    getMock.mockResolvedValueOnce({
      data: {
        dados: [apiQuestion],
        metadados: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });

    await expect(listProfessorQuestions()).resolves.toEqual([
      expect.objectContaining({
        id: 'question-1',
        topic: 'Tórax',
        difficulty: 'Médio',
        createdAt: '31/03/2025',
      }),
    ]);
    expect(getMock).toHaveBeenCalledWith('/questoes');
  });

  it('returns mocked professor questions without calling the API when mocks are enabled', async () => {
    const { listarQuestoesProfessor } = await loadService(true);
    const result = await listarQuestoesProfessor();
    expect(getMock).not.toHaveBeenCalled();
    expect(result.total).toBeGreaterThan(0);
  });

  it('creates a question using FormData', async () => {
    const { createQuestion } = await loadService(false);
    postMock.mockResolvedValueOnce({ data: { dados: apiQuestion } });

    await createQuestion(formValues);

    expect(postMock).toHaveBeenCalledWith(
      '/questoes',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  });

  it('covers image upload and error handling', async () => {
    const { createQuestion, listProfessorQuestions } = await loadService(false);
    const file = new File([''], 'test.png', { type: 'image/png' });
    postMock.mockResolvedValueOnce({ data: { dados: apiQuestion } });
    await createQuestion({ ...formValues, image: file });

    const errorMock = {
      isAxiosError: true,
      response: { data: { mensagem: 'Erro simulado' } }
    };
    getMock.mockRejectedValueOnce(errorMock);
    await expect(listProfessorQuestions()).rejects.toThrow('Erro simulado');
  });

  it('calls the filter, find by id, update and delete endpoints', async () => {
    const {
      atualizarQuestao,
      buscarQuestaoPorFiltro,
      buscarQuestaoPorId,
      deleteQuestion,
      removerQuestao,
      updateQuestion,
    } = await loadService(false);

    getMock.mockResolvedValue({ data: { mensagem: 'ok', dados: apiQuestion } });
    putMock.mockResolvedValue({ data: { mensagem: 'ok', dados: apiQuestion } });
    deleteMock.mockResolvedValue({});

    await buscarQuestaoPorFiltro({ q: 'cardio' });
    await buscarQuestaoPorId('question-1');
    await atualizarQuestao('question-1', {} as unknown as never);
    await updateQuestion('question-1', formValues);
    await removerQuestao('question-1');
    await deleteQuestion('question-2');

    expect(getMock).toHaveBeenNthCalledWith(1, '/questoes/busca', { params: { tema: 'cardio' } });
    expect(putMock).toHaveBeenNthCalledWith(2, '/questoes/question-1', expect.any(FormData), { headers: { 'Content-Type': 'multipart/form-data' } });
  });

  it('lists questions using the backend search endpoint when filters are provided', async () => {
    const { listProfessorQuestions } = await loadService(false);
    getMock.mockResolvedValueOnce({ data: { dados: [apiQuestion] } });
    await listProfessorQuestions({ q: 'Tórax', dificuldade: 'MEDIA' });
    expect(getMock).toHaveBeenCalledWith('/questoes/busca', {
      params: { dificuldade: 'MEDIA', tema: 'Tórax' },
    });
  });

  describe('Mocks Edge Cases', () => {
    it('covers mock filtering and true/false normalization', async () => {
      const { buscarQuestaoPorFiltro, listProfessorQuestions } = await loadService(true);

      await expect(buscarQuestaoPorFiltro({ tema: 'Sistema' })).resolves.toBeDefined();

      const questoes = await listProfessorQuestions();
      expect(questoes).toBeDefined();
    });
  });

  describe('Edge Cases de Normalização (Datas, Tags, Alternativas e Temas)', () => {
    it('normaliza formatos atípicos retornados pelo backend', async () => {
      const { listProfessorQuestions } = await loadService(false);
      getMock.mockResolvedValueOnce({
        data: {
          dados: [
            {
              id: 'weird-1',
              criadoEm: 'data-invalida',
              tags: 'tag1, tag2',
              tipo: 'CERTO_ERRADO',
              dificuldade: 'FÁCIL',
              alternativaCorreta: 'C',
              alternativas: { C: 'Certo', E: 'Errado' }, 
            },
            {
              id: 'weird-2',
              tema: 'Tema em String Plana',
              alternativas: [{ id: '1', texto: 'Alternativa em array', correta: true }],
            },
            {
              id: 'weird-3',
              alternativas: null, 
            },
          ],
        },
      });

      const res = await listProfessorQuestions();

      expect(res[0].createdAt).toBe('data-invalida');
      expect(res[0].tags).toEqual(['tag1', 'tag2']);
      expect(res[0].type).toBe('Verdadeiro/Falso');
      expect(res[0].difficulty).toBe('Fácil');
      expect(res[0].alternatives[0].label).toBe('V');
      expect(res[0].alternatives[1].label).toBe('F');

      expect(res[1].topic).toBe('Tema em String Plana');
      expect(res[1].alternatives[0].text).toBe('Alternativa em array');

      expect(res[2].alternatives).toEqual([]);
    });
  });

  describe('Edge Cases de Formulário e Mapeamento', () => {
    it('ignora alternativas vazias e usa fallback de explicação no buildFormData', async () => {
      const { createQuestion } = await loadService(false);
      postMock.mockResolvedValueOnce({ data: { dados: apiQuestion } });

      const formIncompleto = {
        ...formValues,
        type: 'Verdadeiro/Falso' as const,
        difficulty: 'Difícil' as const,
        explanation: '   ',
        alternatives: [
          { id: 'v', label: 'V', text: 'Opção V', isCorrect: true },
          { id: 'f', label: 'F', text: '   ', isCorrect: false },
        ],
      };

      await createQuestion(formIncompleto);

      const formData = postMock.mock.calls[0][1] as FormData;

      expect(formData.get('tipo')).toBe('CERTO_ERRADO');
      expect(formData.get('dificuldade')).toBe('DIFICIL');
      expect(formData.get('saibaMais')).toBe('Explicação pedagógica não informada.');
      expect(formData.get('alternativaCorreta')).toBe('C');
      expect(formData.get('alternativas[C]')).toBe('Opção V');
      expect(formData.has('alternativas[E]')).toBe(false); // Ignorado por ser vazio
    });

    it('anexa os campos de classificacao no buildFormData quando presentes', async () => {
      const { createQuestion } = await loadService(false);
      postMock.mockResolvedValueOnce({ data: { dados: apiQuestion } });

      await createQuestion({
        ...formValues,
        origemQuestao: 'LIVRO',
        taxonomiaBloom: 'APLICAR',
        regiaoAnatomica: '  Abdome  ',
      });

      const formData = postMock.mock.calls[0][1] as FormData;

      expect(formData.get('origemQuestao')).toBe('LIVRO');
      expect(formData.get('taxonomiaBloom')).toBe('APLICAR');
      expect(formData.get('regiaoAnatomica')).toBe('Abdome'); // trim aplicado
      expect(formData.get('palavrasChave')).toBe('aorta, mediastino');
    });

    it('prioriza palavrasChave do backend sobre tags ao normalizar', async () => {
      const { listProfessorQuestions } = await loadService(false);
      getMock.mockResolvedValueOnce({
        data: {
          dados: [
            { id: 'q1', palavrasChave: ['coração', 'aorta'], tags: 'ignorado', alternativas: null },
          ],
        },
      });

      const res = await listProfessorQuestions();

      expect(res[0].tags).toEqual(['coração', 'aorta']);
    });

    it('normaliza os campos de classificacao retornados pelo backend', async () => {
      const { listProfessorQuestions } = await loadService(false);
      getMock.mockResolvedValueOnce({ data: { dados: [apiQuestion] } });

      const [questao] = await listProfessorQuestions();

      expect(questao.origemQuestao).toBe('PROVA_ANTERIOR');
      expect(questao.taxonomiaBloom).toBe('ANALISAR');
      expect(questao.regiaoAnatomica).toBe('Tórax');
      expect(questao.explanation).toBe('Explicação pedagógica'); // lido de saibaMais
    });
  });

  describe('Edge Cases de USE_MOCKS nas Funções Singulares', () => {
    it('cobre chamadas diretas com MOCKS ativados', async () => {
      const { listarQuestoes, atualizarQuestao, removerQuestao } = await loadService(true);
      
      await expect(listarQuestoes()).resolves.toBeDefined();
      
      await expect(atualizarQuestao('id-fake', {} as never)).rejects.toThrow('Questão não encontrada.');
      await expect(removerQuestao('id-fake')).rejects.toThrow('Questão não encontrada.');
      
      expect(getMock).not.toHaveBeenCalled();
      expect(putMock).not.toHaveBeenCalled();
      expect(deleteMock).not.toHaveBeenCalled();
    });

    it('cobre fallback de fallback vazio em listarQuestoes sem mocks', async () => {
      const { listarQuestoes } = await loadService(false);
      getMock.mockResolvedValueOnce({ data: {} }); // Sem dados e metadados
      
      const res = await listarQuestoes();
      expect(res.dados).toEqual([]);
      expect(res.metadados.page).toBe(1);
    });
  });

  describe('Tratamento de Erros e extractErrorMessage (Catch Blocks)', () => {
    it('repassa erro extraído em updateQuestion', async () => {
      const { updateQuestion } = await loadService(false);
      putMock.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { erro: { mensagem: 'Falha ao atualizar questão' } } },
      });

      await expect(updateQuestion('1', formValues)).rejects.toThrow('Falha ao atualizar questão');
    });

    it('retorna mensagem genérica de rede ao tentar deletar', async () => {
      const { deleteQuestion } = await loadService(false);
      deleteMock.mockRejectedValueOnce(new Error('Erro de execução JS/Rede'));

      await expect(deleteQuestion('1')).rejects.toThrow('Não foi possível conectar ao servidor. Tente novamente.');
    });

    it('retorna mensagem genérica de servidor sem response', async () => {
      const { deleteQuestion } = await loadService(false);
      deleteMock.mockRejectedValueOnce({ isAxiosError: true }); 

      await expect(deleteQuestion('1')).rejects.toThrow('Não foi possível conectar ao servidor. Tente novamente.');
    });

    it('extrai mensagem direta do message', async () => {
      const { deleteQuestion } = await loadService(false);
      deleteMock.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { message: 'Erro internal server error' } },
      });

      await expect(deleteQuestion('1')).rejects.toThrow('Erro internal server error');
    });

    it('usa fallback máximo se o response.data não tiver campos conhecidos', async () => {
      const { deleteQuestion } = await loadService(false);
      deleteMock.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: {} },
      });

      await expect(deleteQuestion('1')).rejects.toThrow('Não foi possível processar a questão.');
    });
  });

  describe('Cobertura adicional de branches', () => {
    it('busca questao por id usando o mock quando USE_MOCKS esta ativo', async () => {
      const { buscarQuestaoPorId } = await loadService(true);

      await expect(buscarQuestaoPorId('id-fake')).rejects.toThrow('Questão não encontrada.');
      expect(getMock).not.toHaveBeenCalled();
    });

    it('mapeia a dificuldade Fácil para a API e Difícil/hard vinda da API', async () => {
      const { createQuestion, listProfessorQuestions } = await loadService(false);
      postMock.mockResolvedValueOnce({ data: { dados: apiQuestion } });

      await createQuestion({ ...formValues, difficulty: 'Fácil' });
      const formData = postMock.mock.calls[0][1] as FormData;
      expect(formData.get('dificuldade')).toBe('FACIL');

      getMock.mockResolvedValueOnce({
        data: { dados: [{ id: 'q-hard', dificuldade: 'hard', alternativas: null }] },
      });
      const [questao] = await listProfessorQuestions();
      expect(questao.difficulty).toBe('Difícil');
    });

    it('usa o campo topic diretamente quando informado pelo backend', async () => {
      const { listProfessorQuestions } = await loadService(false);
      getMock.mockResolvedValueOnce({
        data: { dados: [{ id: 'q-topic', topic: 'Tema vindo de topic', alternativas: null }] },
      });

      const [questao] = await listProfessorQuestions();
      expect(questao.topic).toBe('Tema vindo de topic');
    });

    it('normaliza alternativas indexadas por letra cujo valor e um objeto', async () => {
      const { listProfessorQuestions } = await loadService(false);
      getMock.mockResolvedValueOnce({
        data: {
          dados: [
            {
              id: 'q-obj-alt',
              alternativaCorreta: 'A',
              alternativas: {
                A: { texto: 'Alternativa objeto, sem id', correta: true },
              },
            },
          ],
        },
      });

      const [questao] = await listProfessorQuestions();
      expect(questao.alternatives[0]).toMatchObject({
        label: 'A',
        text: 'Alternativa objeto, sem id',
        isCorrect: true,
      });
    });

    it('usa fallback vazio quando a alternativa nao tem id nem texto conhecido', async () => {
      const { listProfessorQuestions } = await loadService(false);
      getMock.mockResolvedValueOnce({
        data: { dados: [{ id: 'q-alt-vazia', alternativas: [{}] }] },
      });

      const [questao] = await listProfessorQuestions();
      expect(questao.alternatives[0]).toMatchObject({ id: '0', text: '' });
    });

    it('marca a alternativa F como gabarito e envia a letra E (convencao da API)', async () => {
      const { createQuestion } = await loadService(false);
      postMock.mockResolvedValueOnce({ data: { dados: apiQuestion } });

      await createQuestion({
        ...formValues,
        type: 'Verdadeiro/Falso',
        alternatives: [
          { id: 'v', label: 'V', text: 'Opção V', isCorrect: false },
          { id: 'f', label: 'F', text: 'Opção F', isCorrect: true },
        ],
      });

      const formData = postMock.mock.calls[0][1] as FormData;
      expect(formData.get('alternativaCorreta')).toBe('E');
    });

    it('usa string vazia no FormData quando os campos opcionais nao sao informados', async () => {
      const { createQuestion } = await loadService(false);
      postMock.mockResolvedValueOnce({ data: { dados: apiQuestion } });

      await createQuestion({
        ...formValues,
        origemQuestao: '' as never,
        taxonomiaBloom: '' as never,
        regiaoAnatomica: undefined as never,
        tags: undefined as never,
      });

      const formData = postMock.mock.calls[0][1] as FormData;
      expect(formData.get('origemQuestao')).toBe('');
      expect(formData.get('taxonomiaBloom')).toBe('');
      expect(formData.get('regiaoAnatomica')).toBe('');
      expect(formData.get('palavrasChave')).toBe('');
    });

    it('busca o alias "busca" e "termo" como texto de pesquisa', async () => {
      const { listProfessorQuestions } = await loadService(false);
      getMock.mockResolvedValueOnce({ data: { dados: [] } });
      await listProfessorQuestions({ busca: 'pulmão' });
      expect(getMock).toHaveBeenCalledWith('/questoes/busca', { params: { tema: 'pulmão' } });

      getMock.mockResolvedValueOnce({ data: { dados: [] } });
      await listProfessorQuestions({ termo: 'coração' });
      expect(getMock).toHaveBeenCalledWith('/questoes/busca', { params: { tema: 'coração' } });
    });

    it('usa o id gerado como fallback quando a API nao devolve "dados" no create/update', async () => {
      const { createQuestion, updateQuestion } = await loadService(false);
      postMock.mockResolvedValueOnce({ data: {} });
      putMock.mockResolvedValueOnce({ data: {} });

      const criada = await createQuestion(formValues);
      expect(criada.id).toEqual(expect.any(String));

      const atualizada = await updateQuestion('questao-existente', formValues);
      expect(atualizada.id).toBe('questao-existente');
    });
  });
});
