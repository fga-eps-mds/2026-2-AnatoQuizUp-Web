import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  comprarItem,
  listarCatalogo,
  listarInventario,
} from '../../../../../../src/features/loja';
import { LojaPage } from '../../../../../../src/pages/aluno/loja/ui/LojaPage';
import { useStudentCoinsStore } from '../../../../../../src/features/student-coins/model/useStudentCoinsStore';

jest.mock('../../../../../../src/features/loja', () => ({
  listarCatalogo: jest.fn(),
  listarInventario: jest.fn(),
  comprarItem: jest.fn(),
}));

const listarCatalogoMock = listarCatalogo as jest.Mock;
const listarInventarioMock = listarInventario as jest.Mock;
const comprarItemMock = comprarItem as jest.Mock;

const item = (over: Record<string, unknown>) => ({
  id: 'id',
  codigo: 'cod',
  nome: 'Item',
  descricao: 'Descrição',
  precoMoedas: 100,
  valor: null,
  imagemUrl: null,
  previewImagemUrl: null,
  ativo: true,
  adquirido: false,
  ...over,
});

const catalogo = {
  dados: [
    item({ id: 'icone-1', codigo: 'icone-coruja', nome: 'Coruja', tipo: 'ICONE_PERFIL', precoMoedas: 60 }),
    item({ id: 'fundo-1', nome: 'Azul Noturno', tipo: 'PLANO_FUNDO', precoMoedas: 80, valor: '#0A1128' }),
    item({ id: 'avatar-1', nome: 'O Estudioso', tipo: 'AVATAR', precoMoedas: 100 }),
    item({ id: 'moldura-1', nome: 'Dourada', tipo: 'MOLDURA', precoMoedas: 220, valor: '#FCD34D' }),
    item({ id: 'titulo-1', nome: 'Mestre da Anatomia', tipo: 'TITULO', precoMoedas: 250 }),
  ],
  metadados: { page: 1, limit: 100, total: 5, totalPages: 1 },
};

const inventarioVazio = {
  dados: [],
  metadados: { page: 1, limit: 100, total: 0, totalPages: 0 },
};

const dica = item({
  id: 'dica-1',
  codigo: 'dica-vacina',
  nome: 'Vacina da Dica',
  tipo: 'DICA',
  precoMoedas: 50,
  consumivel: true,
  efeito: 'Revela uma dica para a questão.',
  quantidadePossuida: 0,
});

const respostaCompraCoruja = {
  mensagem: 'Item comprado com sucesso.',
  saldoMoedas: 940,
  quantidadeComprada: 1,
  item: {
    id: 'inv-1',
    equipado: false,
    quantidade: 1,
    adquiridoEm: '2026-06-18T00:00:00.000Z',
    item: item({ id: 'icone-1', codigo: 'icone-coruja', nome: 'Coruja', tipo: 'ICONE_PERFIL', precoMoedas: 60 }),
  },
};

const nomesDosCards = () =>
  screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('LojaPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStudentCoinsStore.setState({ saldoMoedas: 1000 });
    listarCatalogoMock.mockResolvedValue(catalogo);
    listarInventarioMock.mockResolvedValue(inventarioVazio);
  });

  it('abre na aba Todos mostrando itens de todas as categorias', async () => {
    render(<LojaPage />);

    expect(await screen.findByText('Coruja')).toBeInTheDocument();
    expect(screen.getByText('1000 ATP')).toBeInTheDocument();
    // itens de categorias diferentes aparecem juntos na aba Todos
    expect(screen.getByText('O Estudioso')).toBeInTheDocument();
    expect(screen.getAllByText('Mestre da Anatomia').length).toBeGreaterThan(0);
  });

  it('ordena por preço (mais baratos por padrão) e inverte ao alternar', async () => {
    render(<LojaPage />);
    await screen.findByText('Coruja');

    // padrão asc: o mais barato (Coruja, 60) vem primeiro
    expect(nomesDosCards()[0]).toBe('Coruja');

    await userEvent.click(screen.getByRole('button', { name: /Preço:/i }));

    // desc: o mais caro (Mestre da Anatomia, 250) vem primeiro
    expect(nomesDosCards()[0]).toBe('Mestre da Anatomia');
  });

  it('troca de categoria ao clicar na aba Molduras', async () => {
    render(<LojaPage />);
    await screen.findByText('Coruja');

    await userEvent.click(screen.getByRole('button', { name: /Molduras/i }));

    expect(await screen.findByText('Dourada')).toBeInTheDocument();
    expect(screen.queryByText('Coruja')).not.toBeInTheDocument();
  });

  it('só compra depois de confirmar no modal e mostra a compra concluída', async () => {
    comprarItemMock.mockResolvedValue(respostaCompraCoruja);

    render(<LojaPage />);
    const card = (await screen.findByText('Coruja')).closest('article') as HTMLElement;

    await userEvent.click(within(card).getByRole('button', { name: 'Comprar' }));

    // Clicar em "Comprar" no card apenas abre a confirmação.
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Você está comprando:')).toBeInTheDocument();
    expect(within(dialog).getByText('Saldo após a compra')).toBeInTheDocument();
    expect(within(dialog).getByText('940 ATP')).toBeInTheDocument();
    expect(comprarItemMock).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Comprar' }));

    await waitFor(() => expect(comprarItemMock).toHaveBeenCalledWith('icone-1', 1));
    const resultado = await screen.findByRole('alertdialog');
    expect(within(resultado).getByText('Compra concluída')).toBeInTheDocument();
    expect(screen.getByText('940 ATP')).toBeInTheDocument();

    await userEvent.click(within(resultado).getByRole('button', { name: 'Continuar comprando' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(within(card).getByText('Adquirido')).toBeInTheDocument();
  });

  it('cancela a confirmação sem enviar a compra', async () => {
    render(<LojaPage />);
    await screen.findByText('Coruja');

    await userEvent.click(screen.getByRole('button', { name: /Pré-visualizar Coruja/i }));

    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(comprarItemMock).not.toHaveBeenCalled();
  });

  it('fecha a confirmação com a tecla Esc', async () => {
    render(<LojaPage />);
    await screen.findByText('Coruja');

    await userEvent.click(screen.getByRole('button', { name: /Pré-visualizar Coruja/i }));
    await screen.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('fecha a pré-visualização somente ao interagir com o fundo', async () => {
    render(<LojaPage />);
    await screen.findByText('Coruja');

    await userEvent.click(
      screen.getByRole('button', { name: /Pré-visualizar Coruja/i }),
    );

    const dialog = await screen.findByRole('dialog');
    const backdrop = dialog.parentElement as HTMLElement;

    fireEvent.mouseDown(dialog);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.mouseDown(backdrop);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mostra os itens adquiridos na aba de inventário', async () => {
    listarInventarioMock.mockResolvedValue({
      dados: [
        {
          id: 'inv-1',
          equipado: false,
          adquiridoEm: '2026-06-18T00:00:00.000Z',
          item: item({ id: 'fundo-1', nome: 'Azul Noturno', tipo: 'PLANO_FUNDO', valor: '#0A1128' }),
        },
      ],
      metadados: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });

    render(<LojaPage />);
    await screen.findByText('Coruja');

    await userEvent.click(screen.getByRole('button', { name: /Meu Inventário/i }));

    expect(await screen.findByText('Azul Noturno')).toBeInTheDocument();
  });

  it('exibe o inventário vazio', async () => {
    render(<LojaPage />);
    await screen.findByText('Coruja');

    await userEvent.click(
      screen.getByRole('button', { name: /Meu Inventário/i }),
    );

    expect(
      screen.getByText('Você ainda não possui itens. Compre algo na loja!'),
    ).toBeInTheDocument();
  });

  it('exibe erro de carregamento e tenta novamente', async () => {
    listarCatalogoMock.mockRejectedValueOnce(new Error('Loja indisponível'));
    render(<LojaPage />);

    expect(await screen.findByText('Loja indisponível')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );

    expect(await screen.findByText('Coruja')).toBeInTheDocument();
    expect(listarCatalogoMock).toHaveBeenCalledTimes(2);
  });

  it('usa mensagem padrão para falha de carregamento não tipada', async () => {
    listarCatalogoMock.mockRejectedValueOnce('falha');
    render(<LojaPage />);

    expect(await screen.findByText('Erro ao carregar a loja.')).toBeInTheDocument();
  });

  it('informa falha não tipada ao comprar um item', async () => {
    comprarItemMock.mockRejectedValueOnce('falha');
    render(<LojaPage />);
    const card = (await screen.findByText('Coruja')).closest(
      'article',
    ) as HTMLElement;

    await userEvent.click(
      within(card).getByRole('button', { name: 'Comprar' }),
    );
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Comprar' }),
    );

    expect(
      await screen.findByText('Não foi possível comprar o item.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mostra no banner erros de compra que não são de saldo', async () => {
    comprarItemMock.mockRejectedValueOnce(new Error('Este item nao esta disponivel para compra.'));
    render(<LojaPage />);
    const card = (await screen.findByText('Coruja')).closest('article') as HTMLElement;

    await userEvent.click(within(card).getByRole('button', { name: 'Comprar' }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Comprar' }),
    );

    expect(
      await screen.findByText('Este item nao esta disponivel para compra.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('mostra o modal de saldo insuficiente quando o backend recusa por saldo', async () => {
    comprarItemMock.mockRejectedValueOnce(
      new Error('Saldo de moedas insuficiente para comprar este item.'),
    );
    render(<LojaPage />);
    const card = (await screen.findByText('Coruja')).closest('article') as HTMLElement;

    await userEvent.click(within(card).getByRole('button', { name: 'Comprar' }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Comprar' }),
    );

    const resultado = await screen.findByRole('alertdialog');
    expect(within(resultado).getByText('Saldo insuficiente')).toBeInTheDocument();
    // O saldo do cabeçalho não mudou.
    expect(screen.getAllByText('1000 ATP')[0].closest('header')).not.toBeNull();
  });

  it('exibe item já adquirido e categoria sem itens', async () => {
    listarCatalogoMock.mockResolvedValueOnce({
      ...catalogo,
      dados: [
        item({
          id: 'icone-1',
          nome: 'Coruja',
          tipo: 'ICONE_PERFIL',
          adquirido: true,
        }),
      ],
    });
    render(<LojaPage />);

    expect(await screen.findByText('Adquirido')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Molduras/i }));
    expect(
      screen.getByText('Nenhum item disponível nesta categoria.'),
    ).toBeInTheDocument();
  });

  it('explica o motivo ao clicar em "Sem saldo", sem enviar a compra', async () => {
    useStudentCoinsStore.setState({ saldoMoedas: 20 });

    render(<LojaPage />);
    const card = (await screen.findByText('Coruja')).closest('article') as HTMLElement;

    await userEvent.click(within(card).getByRole('button', { name: /Sem saldo/i }));

    const resultado = await screen.findByRole('alertdialog');
    expect(within(resultado).getByText('Saldo insuficiente')).toBeInTheDocument();
    // Coruja custa 60 e o aluno tem 20: faltam 40.
    expect(within(resultado).getByText('40 ATP')).toBeInTheDocument();
    expect(within(resultado).getByText(/Nada foi cobrado/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(comprarItemMock).not.toHaveBeenCalled();

    await userEvent.click(within(resultado).getByRole('button', { name: 'Entendi' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('lista consumíveis na aba Dicas com efeito e quantidade possuída', async () => {
    listarCatalogoMock.mockResolvedValueOnce({
      ...catalogo,
      dados: [...catalogo.dados, { ...dica, quantidadePossuida: 2 }],
    });
    render(<LojaPage />);
    await screen.findByText('Coruja');

    await userEvent.click(screen.getByRole('button', { name: /Dicas/i }));

    expect(screen.getByText('Vacina da Dica')).toBeInTheDocument();
    expect(screen.getByText('Revela uma dica para a questão.')).toBeInTheDocument();
    expect(screen.getByText('Você tem 2')).toBeInTheDocument();
    expect(screen.queryByText('Coruja')).not.toBeInTheDocument();
  });

  it('compra várias unidades de um consumível e atualiza a quantidade', async () => {
    useStudentCoinsStore.setState({ saldoMoedas: 160 });
    listarCatalogoMock.mockResolvedValueOnce({ ...catalogo, dados: [dica] });
    comprarItemMock.mockResolvedValue({
      mensagem: 'Item comprado com sucesso.',
      saldoMoedas: 10,
      quantidadeComprada: 3,
      item: {
        id: 'inv-dica',
        equipado: false,
        quantidade: 3,
        adquiridoEm: '2026-09-24T00:00:00.000Z',
        item: dica,
      },
    });

    render(<LojaPage />);
    const card = (await screen.findByText('Vacina da Dica')).closest('article') as HTMLElement;

    await userEvent.click(within(card).getByRole('button', { name: 'Comprar' }));
    const dialog = await screen.findByRole('dialog');

    const aumentar = within(dialog).getByRole('button', { name: 'Aumentar quantidade' });
    await userEvent.click(aumentar);
    await userEvent.click(aumentar);

    // 160 de saldo / 50 por unidade = no máximo 3 unidades.
    expect(aumentar).toBeDisabled();
    expect(within(dialog).getByText('150 ATP')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Comprar' }));

    await waitFor(() => expect(comprarItemMock).toHaveBeenCalledWith('dica-1', 3));
    const resultado = await screen.findByRole('alertdialog');
    expect(within(resultado).getByText('3x Vacina da Dica')).toBeInTheDocument();

    await userEvent.click(within(resultado).getByRole('button', { name: 'Continuar comprando' }));

    // Consumível continua comprável e mostra a nova quantidade.
    expect(within(card).getByText('Você tem 3')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: /Sem saldo/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Meu Inventário/i }));
    expect(screen.getByText('3 unidades')).toBeInTheDocument();
  });
});
