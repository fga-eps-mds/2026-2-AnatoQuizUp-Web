import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ModalConfirmarCompra } from '../../../../../src/features/loja/ui/ModalConfirmarCompra';
import type { ItemLoja } from '../../../../../src/features/loja/types';

const criarItem = (over: Partial<ItemLoja> = {}): ItemLoja => ({
  id: 'tempo-1',
  codigo: 'potencializador-tempo-extra',
  nome: 'Tempo Extra',
  descricao: 'Mais fôlego para pensar.',
  tipo: 'POTENCIALIZADOR',
  precoMoedas: 60,
  valor: null,
  imagemUrl: null,
  previewImagemUrl: null,
  ativo: true,
  disponivelNaLoja: true,
  consumivel: true,
  efeito: '+30 segundos na questão.',
  adquirido: false,
  quantidadePossuida: 0,
  ...over,
});

const renderizar = (over: Partial<ItemLoja> = {}, saldoMoedas = 1000, comprando = false) => {
  const onCancelar = jest.fn();
  const onConfirmar = jest.fn();

  render(
    <ModalConfirmarCompra
      item={criarItem(over)}
      saldoMoedas={saldoMoedas}
      comprando={comprando}
      onCancelar={onCancelar}
      onConfirmar={onConfirmar}
    />,
  );

  return { onCancelar, onConfirmar };
};

describe('ModalConfirmarCompra', () => {
  it('mostra efeito, total e saldo após a compra de um consumível', () => {
    renderizar({ quantidadePossuida: 2 }, 320);

    expect(screen.getByText('Você está comprando:')).toBeInTheDocument();
    expect(screen.getByText('+30 segundos na questão.')).toBeInTheDocument();
    expect(screen.getByText('Você já tem 2 unidades')).toBeInTheDocument();
    expect(screen.getByLabelText('Seu saldo: 320 ATP')).toBeInTheDocument();
    // total 60 e saldo após 260
    expect(screen.getAllByText('60 ATP')).toHaveLength(2);
    expect(screen.getByText('260 ATP')).toBeInTheDocument();
  });

  it('ajusta a quantidade entre 1 e o máximo permitido pelo saldo', async () => {
    const { onConfirmar } = renderizar({}, 130);

    const diminuir = screen.getByRole('button', { name: 'Diminuir quantidade' });
    const aumentar = screen.getByRole('button', { name: 'Aumentar quantidade' });

    expect(diminuir).toBeDisabled();

    await userEvent.click(aumentar);
    // 130 / 60 = no máximo 2 unidades
    expect(aumentar).toBeDisabled();
    expect(screen.getByText('120 ATP')).toBeInTheDocument();
    expect(screen.getByText('10 ATP')).toBeInTheDocument();

    await userEvent.click(diminuir);
    await userEvent.click(aumentar);
    await userEvent.click(screen.getByRole('button', { name: 'Comprar' }));

    expect(onConfirmar).toHaveBeenCalledWith(2);
  });

  it('usa o limite de 99 unidades para item sem custo', () => {
    renderizar({ precoMoedas: 0 }, 0);

    expect(screen.getByRole('button', { name: 'Aumentar quantidade' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Comprar' })).toBeEnabled();
  });

  it('desabilita a compra e avisa quando o total passa do saldo', () => {
    renderizar({}, 30);

    expect(screen.getByRole('button', { name: 'Comprar' })).toBeDisabled();
    expect(screen.getByText('Moedas insuficientes para esta compra.')).toBeInTheDocument();
    expect(screen.queryByText('Saldo após a compra')).not.toBeInTheDocument();
  });

  it('não mostra seletor de quantidade para cosméticos', async () => {
    const { onConfirmar } = renderizar({
      tipo: 'MOLDURA',
      consumivel: false,
      efeito: null,
      nome: 'Dourada',
    });

    expect(screen.queryByRole('button', { name: 'Aumentar quantidade' })).not.toBeInTheDocument();
    expect(screen.getByText('Mais fôlego para pensar.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Comprar' }));
    expect(onConfirmar).toHaveBeenCalledWith(1);
  });

  it('vira pré-visualização para cosmético já adquirido', async () => {
    const { onCancelar, onConfirmar } = renderizar({
      tipo: 'MOLDURA',
      consumivel: false,
      adquirido: true,
    });

    expect(screen.getByText('Pré-visualização')).toBeInTheDocument();
    expect(screen.getByText('Você já possui este item')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Comprar' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onCancelar).toHaveBeenCalled();
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it('não fecha enquanto a compra está em andamento', async () => {
    const { onCancelar } = renderizar({}, 1000, true);

    expect(screen.getByRole('button', { name: 'Comprando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();

    await userEvent.keyboard('{Escape}');
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement as HTMLElement);

    expect(onCancelar).not.toHaveBeenCalled();
  });

  it('fecha ao clicar no fundo e com Esc', async () => {
    const { onCancelar } = renderizar();

    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onCancelar).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByRole('dialog').parentElement as HTMLElement);
    await userEvent.keyboard('{Escape}');

    expect(onCancelar).toHaveBeenCalledTimes(2);
  });
});
