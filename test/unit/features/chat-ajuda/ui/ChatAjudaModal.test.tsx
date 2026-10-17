jest.mock('../../../../../src/features/chat-ajuda/chatAjudaService', () => ({
  buscarDicaAjuda: jest.fn(),
  enviarPerguntaAjuda: jest.fn(),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  buscarDicaAjuda,
  enviarPerguntaAjuda,
} from '../../../../../src/features/chat-ajuda/chatAjudaService';
import { ChatAjudaModal } from '../../../../../src/features/chat-ajuda/ui/ChatAjudaModal';

const buscarDicaAjudaMock = buscarDicaAjuda as jest.Mock;
const enviarPerguntaAjudaMock = enviarPerguntaAjuda as jest.Mock;

const renderizar = (onClose = jest.fn()) => {
  render(
    <ChatAjudaModal
      onClose={onClose}
      questaoAtual={{ tema: 'Sistema Esquelético', dificuldade: 'Fácil', enunciado: 'Qual osso?' }}
    />,
  );
  return { onClose };
};

// Controla manualmente quando a promise de buscarDicaAjuda resolve, para poder
// observar o estado de carregamento antes de liberar a resposta.
const criarPromiseControlavel = <T,>() => {
  let resolve!: (valor: T) => void;
  let reject!: (erro: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('ChatAjudaModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mostra o spinner enquanto busca a dica e depois exibe a dica formatada', async () => {
    const dica = criarPromiseControlavel<string>();
    buscarDicaAjudaMock.mockReturnValue(dica.promise);

    renderizar();

    expect(screen.getByText('Buscando sua dica...')).toBeInTheDocument();

    dica.resolve('Revise **Cranio** com atencao.');

    await waitFor(() => expect(screen.queryByText('Buscando sua dica...')).not.toBeInTheDocument());
    expect(screen.getByText('Cranio', { selector: 'strong' })).toBeInTheDocument();
  });

  it('mostra erro quando a busca da dica falha', async () => {
    buscarDicaAjudaMock.mockRejectedValue(new Error('Dica indisponivel.'));

    renderizar();

    expect(await screen.findByRole('alert')).toHaveTextContent('Dica indisponivel.');
  });

  it('envia a pergunta ao clicar em enviar e mostra a resposta no historico', async () => {
    buscarDicaAjudaMock.mockResolvedValue('Dica qualquer.');
    enviarPerguntaAjudaMock.mockResolvedValue('O femur e o osso mais longo.');

    renderizar();
    await screen.findByText('Dica qualquer.');

    const textarea = screen.getByPlaceholderText('Pergunte algo sobre o conteudo...');
    await userEvent.type(textarea, 'Por que o femur e tao grande?');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar pergunta' }));

    expect(enviarPerguntaAjudaMock).toHaveBeenCalledWith('Por que o femur e tao grande?', {
      tema: 'Sistema Esquelético',
      dificuldade: 'Fácil',
      enunciado: 'Qual osso?',
    });
    expect(await screen.findByText('O femur e o osso mais longo.')).toBeInTheDocument();
    expect(screen.getByText('Por que o femur e tao grande?')).toBeInTheDocument();
    expect(textarea).toHaveValue('');
  });

  it('envia a pergunta ao pressionar Enter, mas nao ao pressionar Shift+Enter', async () => {
    buscarDicaAjudaMock.mockResolvedValue('Dica qualquer.');
    enviarPerguntaAjudaMock.mockResolvedValue('Resposta.');

    renderizar();
    await screen.findByText('Dica qualquer.');

    const textarea = screen.getByPlaceholderText('Pergunte algo sobre o conteudo...');
    await userEvent.type(textarea, 'Pergunta');

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(enviarPerguntaAjudaMock).not.toHaveBeenCalled();

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(enviarPerguntaAjudaMock).toHaveBeenCalledTimes(1);
    await screen.findByText('Resposta.');
  });

  it('nao envia pergunta vazia ou só com espacos', async () => {
    buscarDicaAjudaMock.mockResolvedValue('Dica qualquer.');

    renderizar();
    await screen.findByText('Dica qualquer.');

    expect(screen.getByRole('button', { name: 'Enviar pergunta' })).toBeDisabled();

    const textarea = screen.getByPlaceholderText('Pergunte algo sobre o conteudo...');
    await userEvent.type(textarea, '   ');
    expect(screen.getByRole('button', { name: 'Enviar pergunta' })).toBeDisabled();

    expect(enviarPerguntaAjudaMock).not.toHaveBeenCalled();
  });

  it('mostra erro quando o envio da pergunta falha, sem derrubar a dica', async () => {
    buscarDicaAjudaMock.mockResolvedValue('Dica qualquer.');
    enviarPerguntaAjudaMock.mockRejectedValue(new Error('Nao foi possivel responder.'));

    renderizar();
    await screen.findByText('Dica qualquer.');

    const textarea = screen.getByPlaceholderText('Pergunte algo sobre o conteudo...');
    await userEvent.type(textarea, 'Pergunta qualquer');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar pergunta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nao foi possivel responder.');
    expect(screen.getByText('Dica qualquer.')).toBeInTheDocument();
  });

  it('desabilita textarea e botao, mostrando o spinner, enquanto envia a pergunta', async () => {
    buscarDicaAjudaMock.mockResolvedValue('Dica qualquer.');
    const pergunta = criarPromiseControlavel<string>();
    enviarPerguntaAjudaMock.mockReturnValue(pergunta.promise);

    renderizar();
    await screen.findByText('Dica qualquer.');

    const textarea = screen.getByPlaceholderText('Pergunte algo sobre o conteudo...');
    await userEvent.type(textarea, 'Pergunta qualquer');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar pergunta' }));

    expect(textarea).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviar pergunta' })).toBeDisabled();

    pergunta.resolve('Resposta.');
    await screen.findByText('Resposta.');
    expect(textarea).not.toBeDisabled();
  });

  it('ignora novo envio enquanto a pergunta anterior ainda esta em andamento', async () => {
    buscarDicaAjudaMock.mockResolvedValue('Dica qualquer.');
    const pergunta = criarPromiseControlavel<string>();
    enviarPerguntaAjudaMock.mockReturnValue(pergunta.promise);

    renderizar();
    await screen.findByText('Dica qualquer.');

    const textarea = screen.getByPlaceholderText('Pergunte algo sobre o conteudo...');
    await userEvent.type(textarea, 'Pergunta qualquer');

    const enviar = screen.getByRole('button', { name: 'Enviar pergunta' });
    await userEvent.click(enviar);
    fireEvent.click(enviar);

    expect(enviarPerguntaAjudaMock).toHaveBeenCalledTimes(1);

    pergunta.resolve('Resposta.');
    await screen.findByText('Resposta.');
  });

  it('fecha ao clicar no botao Fechar, no overlay e ao pressionar Escape', async () => {
    buscarDicaAjudaMock.mockResolvedValue('Dica qualquer.');
    const { onClose } = renderizar();
    await screen.findByText('Dica qualquer.');

    await userEvent.click(screen.getByRole('button', { name: 'Fechar ajuda' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(screen.getByRole('presentation'));
    expect(onClose).toHaveBeenCalledTimes(2);

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('funciona sem contexto de questao', async () => {
    buscarDicaAjudaMock.mockResolvedValue('Dica qualquer.');
    enviarPerguntaAjudaMock.mockResolvedValue('Resposta.');

    render(<ChatAjudaModal onClose={jest.fn()} />);
    await screen.findByText('Dica qualquer.');

    const textarea = screen.getByPlaceholderText('Pergunte algo sobre o conteudo...');
    await userEvent.type(textarea, 'Pergunta sem contexto');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar pergunta' }));

    expect(enviarPerguntaAjudaMock).toHaveBeenCalledWith('Pergunta sem contexto', undefined);
  });
});
