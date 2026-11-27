import { fireEvent, render, screen } from '@testing-library/react';

import { ModalConfirmarCompra } from '../../../../../src/features/loja/ui/ModalConfirmarCompra';
import type { ItemLoja } from '../../../../../src/features/loja/types';
import { APARENCIA_PADRAO, type AparenciaAvatar } from '../../../../../src/shared/avatar/aparencia';

const item = (over: Partial<ItemLoja> = {}): ItemLoja => ({
  id: 'bota-1',
  codigo: 'bota-coturno',
  nome: 'Bota Coturno',
  descricao: null,
  tipo: 'CALCADO',
  precoMoedas: 220,
  valor: null,
  imagemUrl: '/avatar/calcados/bota-coturno.png',
  previewImagemUrl: null,
  ativo: true,
  disponivelNaLoja: true,
  consumivel: false,
  efeito: null,
  adquirido: false,
  quantidadePossuida: 0,
  ...over,
});

const salvo: AparenciaAvatar = { ...APARENCIA_PADRAO, cabelo: 'loiro' };

const renderizar = (over: Partial<ItemLoja> = {}, aparenciaAtual: AparenciaAvatar | null = salvo) => {
  const onCancelar = jest.fn();
  const onConfirmar = jest.fn();
  render(
    <ModalConfirmarCompra
      item={item(over)}
      saldoMoedas={1000}
      comprando={false}
      onCancelar={onCancelar}
      onConfirmar={onConfirmar}
      aparenciaAtual={aparenciaAtual ?? undefined}
    />,
  );
  return { onCancelar, onConfirmar };
};

// Camadas do avatar da previa (cabelo, acessorio, luva, calcado), sem a arte base.
const camadasDoAvatar = () =>
  screen.getByRole('img', { name: 'Avatar de você' }).parentElement!.querySelectorAll('img[aria-hidden="true"]');

describe('ModalConfirmarCompra - pré-visualização no avatar', () => {
  it('mostra o avatar salvo com o item aplicado no slot do seu tipo', () => {
    renderizar();

    expect(screen.getByText('Como fica no seu avatar')).toBeInTheDocument();
    // cabelo salvo (loiro) + bota da previa
    expect(camadasDoAvatar()).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Com o item' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('alterna para o avatar salvo e de volta para o item', () => {
    renderizar();

    fireEvent.click(screen.getByRole('button', { name: 'Como está agora' }));
    expect(screen.getByText('Seu avatar como está agora')).toBeInTheDocument();
    expect(camadasDoAvatar()).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Com o item' }));
    expect(screen.getByText('Como fica no seu avatar')).toBeInTheDocument();
    expect(camadasDoAvatar()).toHaveLength(2);
  });

  it('alternar a prévia não compra nem fecha o modal', () => {
    const { onCancelar, onConfirmar } = renderizar();

    fireEvent.click(screen.getByRole('button', { name: 'Como está agora' }));
    fireEvent.click(screen.getByRole('button', { name: 'Com o item' }));

    expect(onConfirmar).not.toHaveBeenCalled();
    expect(onCancelar).not.toHaveBeenCalled();
  });

  it('substitui o item do mesmo slot que já estava equipado', () => {
    renderizar({ codigo: 'trancas', nome: 'Tranças', tipo: 'CABELO' });

    // continua uma camada so: o cabelo da previa no lugar do loiro
    expect(camadasDoAvatar()).toHaveLength(1);
  });

  it.each([
    ['item que não é de avatar', { tipo: 'TITULO' as const, codigo: 'titulo-mestre' }],
    ['código que o avatar não sabe desenhar', { codigo: 'calcado-inexistente' }],
  ])('não mostra a prévia para %s', (_caso, over) => {
    renderizar(over);

    expect(screen.queryByText('Como fica no seu avatar')).not.toBeInTheDocument();
  });

  it('não mostra a prévia sem a aparência do aluno', () => {
    renderizar({}, null);

    expect(screen.queryByText('Como fica no seu avatar')).not.toBeInTheDocument();
  });
});
