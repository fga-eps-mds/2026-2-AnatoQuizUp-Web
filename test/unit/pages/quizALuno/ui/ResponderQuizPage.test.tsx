jest.mock('@/shared/config/env', () => ({
  env: { VITE_API_URL: 'http://localhost' }
}));

import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResponderQuizPage } from '../../../../../src/pages/quizAluno/ui/ResponderQuizPage';
import * as randomQuizService from '../../../../../src/features/random-quiz/randomQuizService';
import * as progressaoService from '../../../../../src/features/progressao/progressaoService';
import { useStudentCoinsStore } from '../../../../../src/features/student-coins/model/useStudentCoinsStore';

jest.mock('../../../../../src/features/random-quiz/randomQuizService');
jest.mock('../../../../../src/features/progressao/progressaoService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const iniciarMock = progressaoService.iniciarTentativaQuiz as jest.Mock;
const concluirMock = progressaoService.concluirTentativaQuiz as jest.Mock;
const responderMock = randomQuizService.responderQuestaoQuiz as jest.Mock;

const feedback = (
  overrides: Partial<{
    correcao: boolean;
    saibaMais: string | null;
    respostaCorreta: 'A' | 'B' | 'C' | 'D' | 'E';
    moedasConcedidas: number;
    saldoMoedas: number;
    moedasJaConcedidas: boolean;
  }> = {},
) => ({
  correcao: true,
  saibaMais: 'Certo!',
  respostaCorreta: 'A' as const,
  moedasConcedidas: 10,
  saldoMoedas: 10,
  moedasJaConcedidas: false,
  ...overrides,
});

const questao = (id: string, enunciado: string, alternativas: Record<string, string> = { A: 'Alt A', B: 'Alt B' }) => ({
  id,
  enunciado,
  tipo: 'MULTIPLA_ESCOLHA',
  alternativas,
  dificuldade: 'FACIL',
});

const tentativa = (questoes: ReturnType<typeof questao>[], tentativaId = 'tentativa-1') => ({
  tentativaId,
  totalQuestoes: questoes.length,
  questoes,
});

const resultado = (over: Record<string, unknown> = {}) => ({
  tentativaId: 'tentativa-1',
  tema: 'Neuro',
  dificuldade: 'FACIL',
  totalQuestoes: 2,
  totalAcertos: 1,
  jaConcluida: false,
  recompensa: { xpBase: 10, bonusDesempenho: 5, bonusPowerUp: 0, xpTotalRecebido: 15 },
  progresso: {
    xpTotal: 15,
    nivel: 1,
    proximoNivel: 2,
    xpNoNivel: 15,
    xpNecessarioNoNivel: 100,
    xpFaltante: 85,
    percentual: 15,
  },
  subiuDeNivel: false,
  nivelAnterior: 1,
  ...over,
});

const renderPage = (rota = '/aluno/quiz/responder?tema=Neuro&dificuldade=FACIL') =>
  render(<MemoryRouter initialEntries={[rota]}><ResponderQuizPage /></MemoryRouter>);

/** Seleciona a alternativa, confirma e espera o botao de avancar/concluir aparecer. */
const responder = async (textoAlternativa: string, proximoBotao: RegExp) => {
  fireEvent.click(screen.getByText(textoAlternativa));
  fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }));
  await waitFor(() => expect(screen.getByRole('button', { name: proximoBotao })).toBeInTheDocument());
};

describe('ResponderQuizPage - rodada de quiz', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStudentCoinsStore.getState().reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    cleanup();
  });

  it('deve exibir tela de erro quando não houver questões', async () => {
    iniciarMock.mockResolvedValue(tentativa([]));

    renderPage();

    await waitFor(() => expect(screen.getByText('Nenhuma questão encontrada')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Voltar e escolher outro'));
    expect(mockNavigate).toHaveBeenCalledWith('/aluno/quiz/escolha');
  });

  it('inicia a rodada com o tema e a dificuldade da URL', async () => {
    iniciarMock.mockResolvedValue(tentativa([questao('1', 'Q1?')]));

    renderPage();

    await waitFor(() => expect(screen.getByText('Q1?')).toBeInTheDocument());
    expect(iniciarMock).toHaveBeenCalledWith({ tema: 'Neuro', dificuldade: 'FACIL' });
    expect(screen.getByText('Rodada de 1 questão')).toBeInTheDocument();
    expect(screen.getByText('1 de 1')).toBeInTheDocument();
  });

  it('inicia a rodada sem filtros quando a URL nao traz tema nem dificuldade', async () => {
    iniciarMock.mockResolvedValue(tentativa([questao('1', 'Q1?')]));

    renderPage('/aluno/quiz/responder');

    await waitFor(() => expect(screen.getByText('Q1?')).toBeInTheDocument());
    expect(iniciarMock).toHaveBeenCalledWith({ tema: undefined, dificuldade: undefined });
  });

  it('percorre a rodada, termina na última questão e mostra a recompensa de XP', async () => {
    iniciarMock.mockResolvedValue(tentativa([questao('1', 'Q1?'), questao('2', 'Q2?', { C: 'Alt C' })]));
    concluirMock.mockResolvedValue(resultado());

    renderPage();
    await waitFor(() => expect(screen.getByText('Q1?')).toBeInTheDocument());
    expect(screen.getByText('Rodada de 2 questões')).toBeInTheDocument();
    expect(screen.getByText('1 de 2')).toBeInTheDocument();

    // Primeira questao: erra. Ainda nao e a ultima, entao o botao e "Próxima".
    responderMock.mockResolvedValueOnce(feedback({ correcao: false, saibaMais: 'Errado!', moedasConcedidas: 0, saldoMoedas: 0 }));
    await responder('Alt B', /Próxima/i);
    expect(responderMock).toHaveBeenCalledWith({
      questaoId: '1',
      tipo: 'MULTIPLA_ESCOLHA',
      respostaMarcada: 'B',
      tentativaId: 'tentativa-1',
    });
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Concluir quiz/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Próxima/i }));
    await waitFor(() => expect(screen.getByText('Q2?')).toBeInTheDocument());
    expect(screen.getByText('2 de 2')).toBeInTheDocument();

    // Ultima questao: acerta. O botao passa a ser "Concluir quiz" e nao busca mais questoes.
    responderMock.mockResolvedValueOnce(feedback({ respostaCorreta: 'C', moedasConcedidas: 25, saldoMoedas: 25 }));
    await responder('Alt C', /Concluir quiz/i);
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Próxima/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Concluir quiz/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Quiz concluído!' })).toBeInTheDocument());
    expect(concluirMock).toHaveBeenCalledWith('tentativa-1');
    expect(screen.getByText('+15 XP')).toBeInTheDocument();
    expect(screen.getByText('Nível 1')).toBeInTheDocument();
    expect(screen.getByText('Faltam 85 XP para o nível 2')).toBeInTheDocument();
    expect(iniciarMock).toHaveBeenCalledTimes(1);
  });

  it('celebra o novo nível na tela de recompensa', async () => {
    iniciarMock.mockResolvedValue(tentativa([questao('1', 'Q1?')]));
    concluirMock.mockResolvedValue(
      resultado({ subiuDeNivel: true, nivelAnterior: 1, progresso: { ...resultado().progresso, nivel: 2, proximoNivel: 3 } }),
    );
    responderMock.mockResolvedValueOnce(feedback());

    renderPage();
    await waitFor(() => expect(screen.getByText('Q1?')).toBeInTheDocument());
    await responder('Alt A', /Concluir quiz/i);
    fireEvent.click(screen.getByRole('button', { name: /Concluir quiz/i }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Parabéns! Você alcançou o nível 2'));
  });

  it('permite tentar concluir de novo quando a conclusão falha', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    iniciarMock.mockResolvedValue(tentativa([questao('1', 'Q1?')]));
    concluirMock.mockRejectedValueOnce(new Error('rede caiu')).mockResolvedValueOnce(resultado({ jaConcluida: true }));
    responderMock.mockResolvedValueOnce(feedback());

    renderPage();
    await waitFor(() => expect(screen.getByText('Q1?')).toBeInTheDocument());
    await responder('Alt A', /Concluir quiz/i);

    fireEvent.click(screen.getByRole('button', { name: /Concluir quiz/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível concluir o quiz'));

    fireEvent.click(screen.getByRole('button', { name: /Concluir quiz/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Quiz concluído!' })).toBeInTheDocument());
    expect(concluirMock).toHaveBeenCalledTimes(2);

    (console.error as jest.Mock).mockRestore();
  });

  it('"Jogar de novo" inicia outra rodada e "Escolher outro quiz" volta para a escolha', async () => {
    iniciarMock
      .mockResolvedValueOnce(tentativa([questao('1', 'Q1?')]))
      .mockResolvedValueOnce(tentativa([questao('9', 'Nova rodada?')], 'tentativa-2'));
    concluirMock.mockResolvedValue(resultado());
    responderMock.mockResolvedValue(feedback());

    renderPage();
    await waitFor(() => expect(screen.getByText('Q1?')).toBeInTheDocument());
    await responder('Alt A', /Concluir quiz/i);
    fireEvent.click(screen.getByRole('button', { name: /Concluir quiz/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Quiz concluído!' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Escolher outro quiz/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/aluno/quiz/escolha');

    fireEvent.click(screen.getByRole('button', { name: /Jogar de novo/i }));
    await waitFor(() => expect(screen.getByText('Nova rodada?')).toBeInTheDocument());
    expect(iniciarMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText('1 de 1')).toBeInTheDocument();

    // As respostas da nova rodada usam o id da nova tentativa.
    await responder('Alt A', /Concluir quiz/i);
    expect(responderMock).toHaveBeenLastCalledWith(expect.objectContaining({ tentativaId: 'tentativa-2' }));
  });

  it('deve exibir ganho de ATP e atualizar saldo global ao acertar', async () => {
    iniciarMock.mockResolvedValue(tentativa([questao('1', 'Q ATP?', { A: 'Alt A' })]));
    responderMock.mockResolvedValueOnce(feedback({ respostaCorreta: 'A', moedasConcedidas: 10, saldoMoedas: 40 }));

    renderPage();

    await waitFor(() => expect(screen.getByText('Q ATP?')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Alt A'));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }));

    await waitFor(() => expect(screen.getByText('+10 ATP')).toBeInTheDocument());
    expect(useStudentCoinsStore.getState().saldoMoedas).toBe(40);
  });

  it('nao deve exibir ganho de ATP quando acerto nao concede recompensa', async () => {
    iniciarMock.mockResolvedValue(tentativa([questao('1', 'Q sem ATP?', { A: 'Alt A' })]));
    responderMock.mockResolvedValueOnce(
      feedback({ respostaCorreta: 'A', moedasConcedidas: 0, saldoMoedas: 40, moedasJaConcedidas: true }),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText('Q sem ATP?')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Alt A'));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }));

    await waitFor(() => expect(screen.getByText('Resposta Correta!')).toBeInTheDocument());
    expect(screen.queryByText(/\+\d+ ATP/i)).not.toBeInTheDocument();
  });

  it('avisa quando o envio da resposta falha e deixa tentar de novo', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    iniciarMock.mockResolvedValue(tentativa([questao('1', 'Q1?')]));
    responderMock.mockRejectedValueOnce(new Error('rede caiu')).mockResolvedValueOnce(feedback());

    renderPage();
    await waitFor(() => expect(screen.getByText('Q1?')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Alt A'));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível enviar sua resposta'));

    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Concluir quiz/i })).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    (console.error as jest.Mock).mockRestore();
  });

  it('deve disparar erro inicial no useEffect', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    iniciarMock.mockRejectedValueOnce(new Error('Falha Geral'));

    renderPage();
    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(await screen.findByText('Nenhuma questão encontrada')).toBeInTheDocument();

    (console.error as jest.Mock).mockRestore();
  });

  it('deve testar os botões de Sair do quiz, Reportar e Pausar', async () => {
    iniciarMock.mockResolvedValue(
      tentativa([{ id: '1', enunciado: 'Q2?', tipo: 'CERTO_ERRADO', alternativas: { A: 'A' }, dificuldade: 'FACIL' }]),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText('Q2?')).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Sair do quiz/i));
    expect(mockNavigate).toHaveBeenCalledWith('/aluno/quiz/escolha');

    fireEvent.click(screen.getByText(/Reportar/i));

    const botoes = screen.getAllByRole('button');
    const pauseBtn = botoes.find(b => b.className.includes('text-[#14D5C2]'));
    expect(pauseBtn).toBeDefined();
    fireEvent.click(pauseBtn as HTMLElement);
    await waitFor(() => expect(screen.getByText('Quiz pausado')).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Retomar quiz/i));
    await waitFor(() => expect(screen.getByText('Q2?')).toBeInTheDocument());
  });
});
