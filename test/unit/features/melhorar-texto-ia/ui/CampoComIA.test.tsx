jest.mock('../../../../../src/features/melhorar-texto-ia/model/melhorarTextoIaService', () => ({
  melhorarTextoIa: jest.fn(),
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { melhorarTextoIa } from '../../../../../src/features/melhorar-texto-ia/model/melhorarTextoIaService';
import { CampoComIA } from '../../../../../src/features/melhorar-texto-ia/ui/CampoComIA';

const melhorarTextoIaMock = melhorarTextoIa as jest.Mock;

const Wrapper = ({ valorInicial = 'Texto original' }: { valorInicial?: string }) => {
  const [valor, setValor] = useState(valorInicial);
  return (
    <CampoComIA
      campo="titulo"
      label="Título"
      required
      value={valor}
      onChange={setValor}
      placeholder="ex: título"
      hint="Dica do campo."
      contexto={{ titulo: valor }}
    />
  );
};

describe('CampoComIA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza o label, a dica e o botao de melhorar', () => {
    render(<Wrapper />);

    expect(screen.getByLabelText(/^Título/)).toHaveValue('Texto original');
    expect(screen.getByText('Dica do campo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /melhorar com ia/i })).toBeEnabled();
  });

  it('desabilita o botao quando o campo esta vazio', () => {
    render(<Wrapper valorInicial="" />);

    expect(screen.getByRole('button', { name: /melhorar com ia/i })).toBeDisabled();
  });

  it('mostra a sugestao e aplica, substituindo o valor do campo', async () => {
    const user = userEvent.setup();
    melhorarTextoIaMock.mockResolvedValue('Texto reescrito pela IA.');

    render(<Wrapper />);

    await user.click(screen.getByRole('button', { name: /melhorar com ia/i }));

    await waitFor(() => expect(melhorarTextoIaMock).toHaveBeenCalledWith('titulo', 'Texto original', { titulo: 'Texto original' }));
    expect(await screen.findByText('Sugestão da IA')).toBeInTheDocument();
    expect(screen.getByText('Texto reescrito pela IA.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(screen.getByLabelText(/^Título/)).toHaveValue('Texto reescrito pela IA.');
    expect(screen.queryByText('Sugestão da IA')).not.toBeInTheDocument();
  });

  it('descarta a sugestao sem alterar o valor do campo', async () => {
    const user = userEvent.setup();
    melhorarTextoIaMock.mockResolvedValue('Texto reescrito pela IA.');

    render(<Wrapper />);

    await user.click(screen.getByRole('button', { name: /melhorar com ia/i }));
    await screen.findByText('Sugestão da IA');

    await user.click(screen.getByRole('button', { name: 'Descartar' }));

    expect(screen.getByLabelText(/^Título/)).toHaveValue('Texto original');
    expect(screen.queryByText('Sugestão da IA')).not.toBeInTheDocument();
  });

  it('mostra erro inline sem bloquear o campo quando a chamada falha', async () => {
    const user = userEvent.setup();
    melhorarTextoIaMock.mockRejectedValue(new Error('Serviço de IA indisponível.'));

    render(<Wrapper />);

    await user.click(screen.getByRole('button', { name: /melhorar com ia/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Serviço de IA indisponível.');
    const campo = screen.getByLabelText(/^Título/);
    expect(campo).not.toBeDisabled();
    await user.type(campo, ' editado');
    expect(campo).toHaveValue('Texto original editado');
  });

  it('suporta a variante textarea', () => {
    render(
      <CampoComIA
        as="textarea"
        campo="historiaSintomas"
        label="História e sintomas"
        value="Conteúdo"
        onChange={() => {}}
        rows={3}
      />,
    );

    const campo = screen.getByLabelText('História e sintomas');
    expect(campo.tagName).toBe('TEXTAREA');
    expect(campo).toHaveAttribute('rows', '3');
  });
});
