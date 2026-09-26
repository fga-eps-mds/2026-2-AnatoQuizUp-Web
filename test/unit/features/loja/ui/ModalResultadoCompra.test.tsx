import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ModalResultadoCompra } from '../../../../../src/features/loja/ui/ModalResultadoCompra';
import type { ItemLoja } from '../../../../../src/features/loja/types';

const cafe: ItemLoja = {
  id: 'cafe-1',
  codigo: 'potencializador-cafe-do-foco',
  nome: 'Café do Foco',
  descricao: null,
  tipo: 'POTENCIALIZADOR',
  precoMoedas: 120,
  valor: null,
  imagemUrl: null,
  previewImagemUrl: null,
  ativo: true,
  disponivelNaLoja: true,
  consumivel: true,
  efeito: 'Dobra seus pontos na próxima sessão.',
  adquirido: false,
};

describe('ModalResultadoCompra', () => {
  it('mostra a compra concluída com o novo saldo', async () => {
    const onFechar = jest.fn();
    render(
      <ModalResultadoCompra
        resultado={{ tipo: 'sucesso', item: cafe, quantidade: 1, saldoMoedas: 200 }}
        onFechar={onFechar}
      />,
    );

    expect(screen.getByText('Compra concluída')).toBeInTheDocument();
    expect(screen.getByText('Café do Foco')).toBeInTheDocument();
    expect(screen.getByLabelText('Seu saldo: 200 ATP')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Continuar comprando' }));
    expect(onFechar).toHaveBeenCalled();
  });

  it('explica quanto falta quando o saldo é insuficiente', () => {
    render(
      <ModalResultadoCompra
        resultado={{ tipo: 'saldo-insuficiente', item: cafe, quantidade: 2, saldoMoedas: 100 }}
        onFechar={jest.fn()}
      />,
    );

    expect(screen.getByText('Saldo insuficiente')).toBeInTheDocument();
    // 2 x 120 = 240; tem 100; faltam 140
    expect(screen.getByText(/2x Café do Foco/)).toBeInTheDocument();
    expect(screen.getByText('240 ATP')).toBeInTheDocument();
    expect(screen.getByText('140 ATP')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entendi' })).toBeInTheDocument();
  });

  it('fecha com Esc e ao clicar no fundo, mas não ao clicar na caixa', async () => {
    const onFechar = jest.fn();
    render(
      <ModalResultadoCompra
        resultado={{ tipo: 'sucesso', item: cafe, quantidade: 3, saldoMoedas: 0 }}
        onFechar={onFechar}
      />,
    );

    const dialog = screen.getByRole('alertdialog');
    fireEvent.mouseDown(dialog);
    expect(onFechar).not.toHaveBeenCalled();

    fireEvent.mouseDown(dialog.parentElement as HTMLElement);
    await userEvent.keyboard('{Escape}');
    expect(onFechar).toHaveBeenCalledTimes(2);
  });
});
