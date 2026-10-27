jest.mock('../../../../../src/features/osce/osceService', () => ({
  listarCenariosOsce: jest.fn(),
  enviarMensagemOsce: jest.fn(),
  finalizarOsce: jest.fn(),
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  enviarMensagemOsce,
  finalizarOsce,
  listarCenariosOsce,
  type AvaliacaoOsce,
} from '../../../../../src/features/osce/osceService';
import { OscePage } from '../../../../../src/pages/aluno/osce/OscePage';

const listarMock = listarCenariosOsce as jest.Mock;
const enviarMock = enviarMensagemOsce as jest.Mock;
const finalizarMock = finalizarOsce as jest.Mock;

const CENARIOS = [
  { id: 'dor-toracica', titulo: 'Dor torácica', especialidade: 'Cardiologia', dificuldade: 'Médio' },
  { id: 'cefaleia-subita', titulo: 'Cefaleia súbita', especialidade: 'Neurologia', dificuldade: 'Difícil' },
];

const AVALIACAO: AvaliacaoOsce = {
  cenarioId: 'dor-toracica',
  titulo: 'Dor torácica',
  diagnosticoEsperado: 'Síndrome coronariana aguda',
  comentarioFinal: 'Faltou investigar fatores de risco.',
  itens: [
    {
      id: 'caracteriza-dor',
      dominio: 'Identificação do problema',
      descricao: 'Caracteriza a dor',
      ancoras: { competente: 'Localização e qualidade' },
      peso: 2,
      permiteParcial: false,
      nivel: 'competente',
      justificativa: 'Perguntou onde doía',
      pontos: 2,
      pontosMaximos: 2,
    },
  ],
  pontuacao: 2,
  pontuacaoMaxima: 2,
  percentual: 100,
  nivelChecklist: 'excelente',
  rotuloChecklist: 'Excelente',
  notaGlobal: 3,
  rotuloNotaGlobal: 'Boa aprovação',
  ancoraNotaGlobal: 'Conduziu bem.',
  justificativaNotaGlobal: 'Raciocínio claro.',
  aprovado: true,
  itensCriticosNaoCumpridos: [],
  divergente: false,
};

// Promise que o teste resolve na mao, para observar o estado de carregamento.
const promiseControlavel = <T,>() => {
  let resolve!: (valor: T) => void;
  let reject!: (erro: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const abrirCaso = async (titulo = 'Dor torácica') => {
  render(<OscePage />);
  const caso = await screen.findByText(titulo);
  await userEvent.click(caso);
};

beforeEach(() => {
  jest.clearAllMocks();
  listarMock.mockResolvedValue(CENARIOS);
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe('OscePage', () => {
  it('mostra o carregamento e depois a lista de casos clinicos', async () => {
    const cenarios = promiseControlavel<typeof CENARIOS>();
    listarMock.mockReturnValue(cenarios.promise);

    render(<OscePage />);

    expect(screen.getByText(/Carregando casos clínicos/)).toBeInTheDocument();

    cenarios.resolve(CENARIOS);

    expect(await screen.findByText('Dor torácica')).toBeInTheDocument();
    expect(screen.getByText('Cefaleia súbita')).toBeInTheDocument();
    expect(screen.getByText('Cardiologia')).toBeInTheDocument();
    expect(screen.getByText('Difícil')).toBeInTheDocument();
    expect(screen.queryByText(/Carregando casos clínicos/)).not.toBeInTheDocument();
  });

  it('avisa quando a lista de casos falha', async () => {
    listarMock.mockRejectedValue(new Error('Serviço de IA indisponível'));

    render(<OscePage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Serviço de IA indisponível');
  });

  it('abre a conversa do caso escolhido', async () => {
    await abrirCaso();

    expect(screen.getByPlaceholderText(/Pergunte algo ao paciente/)).toBeInTheDocument();
    expect(screen.getByText(/Inicie a anamnese/)).toBeInTheDocument();
    expect(screen.queryByText('Cefaleia súbita')).not.toBeInTheDocument();
  });

  it('envia a fala do aluno e mostra a resposta do paciente', async () => {
    enviarMock.mockResolvedValue('Dói desde ontem, **em aperto**.');
    await abrirCaso();

    await userEvent.type(screen.getByPlaceholderText(/Pergunte algo ao paciente/), 'Desde quando dói?');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar pergunta ao paciente' }));

    expect(await screen.findByText(/Dói desde ontem/)).toBeInTheDocument();
    // O negrito da resposta e renderizado como <strong>.
    expect(screen.getByText('em aperto').tagName).toBe('STRONG');
    expect(enviarMock).toHaveBeenCalledWith('dor-toracica', 'Desde quando dói?', []);
    // O campo volta vazio depois do envio.
    expect(screen.getByPlaceholderText(/Pergunte algo ao paciente/)).toHaveValue('');
  });

  it('envia a fala ao pressionar Enter, mas nao com Shift+Enter', async () => {
    enviarMock.mockResolvedValue('Resposta do paciente.');
    await abrirCaso();

    const campo = screen.getByPlaceholderText(/Pergunte algo ao paciente/);
    await userEvent.type(campo, 'Onde dói?{Shift>}{Enter}{/Shift}');
    expect(enviarMock).not.toHaveBeenCalled();

    await userEvent.type(campo, '{Enter}');
    await waitFor(() => expect(enviarMock).toHaveBeenCalledTimes(1));
  });

  it('manda o historico anterior sem o id interno dos turnos', async () => {
    enviarMock.mockResolvedValueOnce('Dor no peito.').mockResolvedValueOnce('Desde ontem.');
    await abrirCaso();

    const campo = screen.getByPlaceholderText(/Pergunte algo ao paciente/);
    await userEvent.type(campo, 'O que sente?{Enter}');
    await screen.findByText('Dor no peito.');

    await userEvent.type(campo, 'Desde quando?{Enter}');
    await waitFor(() => expect(enviarMock).toHaveBeenCalledTimes(2));

    expect(enviarMock).toHaveBeenLastCalledWith('dor-toracica', 'Desde quando?', [
      { autor: 'aluno', texto: 'O que sente?' },
      { autor: 'paciente', texto: 'Dor no peito.' },
    ]);
  });

  it('nao envia mensagem vazia', async () => {
    await abrirCaso();

    await userEvent.type(screen.getByPlaceholderText(/Pergunte algo ao paciente/), '   {Enter}');

    expect(enviarMock).not.toHaveBeenCalled();
  });

  it('avisa quando a fala do paciente falha', async () => {
    enviarMock.mockRejectedValue(new Error('Erro ao falar com o paciente'));
    await abrirCaso();

    await userEvent.type(screen.getByPlaceholderText(/Pergunte algo ao paciente/), 'Onde dói?{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao falar com o paciente');
  });

  it('so libera a finalizacao depois da primeira fala', async () => {
    enviarMock.mockResolvedValue('Dor no peito.');
    await abrirCaso();

    const finalizar = screen.getByRole('button', { name: /Finalizar e ver feedback/ });
    expect(finalizar).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText(/Pergunte algo ao paciente/), 'O que sente?{Enter}');
    await screen.findByText('Dor no peito.');

    expect(finalizar).toBeEnabled();
  });

  it('finaliza a estacao e mostra o feedback do examinador', async () => {
    enviarMock.mockResolvedValue('Dor no peito.');
    finalizarMock.mockResolvedValue(AVALIACAO);
    await abrirCaso();

    await userEvent.type(screen.getByPlaceholderText(/Pergunte algo ao paciente/), 'O que sente?{Enter}');
    await screen.findByText('Dor no peito.');

    await userEvent.click(screen.getByRole('button', { name: /Finalizar e ver feedback/ }));

    expect(await screen.findByText('Feedback do examinador')).toBeInTheDocument();
    expect(screen.getByText('Faltou investigar fatores de risco.')).toBeInTheDocument();
    expect(finalizarMock).toHaveBeenCalledWith('dor-toracica', [
      { autor: 'aluno', texto: 'O que sente?' },
      { autor: 'paciente', texto: 'Dor no peito.' },
    ]);
    // Com a estacao avaliada, nao se conversa mais nem se finaliza de novo.
    expect(screen.getByPlaceholderText(/Pergunte algo ao paciente/)).toBeDisabled();
    expect(screen.getByRole('button', { name: /Finalizar e ver feedback/ })).toBeDisabled();
  });

  it('avisa quando a avaliacao falha', async () => {
    enviarMock.mockResolvedValue('Dor no peito.');
    finalizarMock.mockRejectedValue(new Error('Avaliação indisponível'));
    await abrirCaso();

    await userEvent.type(screen.getByPlaceholderText(/Pergunte algo ao paciente/), 'O que sente?{Enter}');
    await screen.findByText('Dor no peito.');

    await userEvent.click(screen.getByRole('button', { name: /Finalizar e ver feedback/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Avaliação indisponível');
  });

  it('trocar caso volta para a lista e descarta a conversa', async () => {
    enviarMock.mockResolvedValue('Dor no peito.');
    await abrirCaso();

    await userEvent.type(screen.getByPlaceholderText(/Pergunte algo ao paciente/), 'O que sente?{Enter}');
    await screen.findByText('Dor no peito.');

    await userEvent.click(screen.getByRole('button', { name: 'Trocar caso' }));

    expect(screen.getByText('Cefaleia súbita')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Dor torácica'));

    expect(screen.getByText(/Inicie a anamnese/)).toBeInTheDocument();
    expect(screen.queryByText('Dor no peito.')).not.toBeInTheDocument();
  });
});
