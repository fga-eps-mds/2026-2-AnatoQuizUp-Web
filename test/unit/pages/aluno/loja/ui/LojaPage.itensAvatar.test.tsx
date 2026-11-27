import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  comprarItem,
  listarCatalogo,
  listarInventario,
  listarHistorico,
} from '../../../../../../src/features/loja';
import { LojaPage } from '../../../../../../src/pages/aluno/loja/ui/LojaPage';
import { useStudentCoinsStore } from '../../../../../../src/features/student-coins/model/useStudentCoinsStore';
import { salvarAparenciaRemota } from '../../../../../../src/shared/avatar/avatarApi';

jest.mock('../../../../../../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'aluno-1' } }),
}));

jest.mock('../../../../../../src/shared/avatar/avatarApi', () => ({
  buscarAparenciaRemota: jest.fn(() => new Promise(() => {})),
  salvarAparenciaRemota: jest.fn(),
}));

jest.mock('../../../../../../src/features/loja', () => ({
  listarCatalogo: jest.fn(),
  listarInventario: jest.fn(),
  listarHistorico: jest.fn(),
  comprarItem: jest.fn(),
}));

const listarCatalogoMock = listarCatalogo as jest.Mock;
const listarInventarioMock = listarInventario as jest.Mock;
const listarHistoricoMock = listarHistorico as jest.Mock;
const comprarItemMock = comprarItem as jest.Mock;

const vazio = { dados: [], metadados: { page: 1, limit: 100, total: 0, totalPages: 0 } };

const item = (id: string, nome: string, tipo: string, precoMoedas: number) => ({
  id,
  codigo: id,
  nome,
  descricao: null,
  tipo,
  precoMoedas,
  valor: null,
  imagemUrl: `/avatar/${id}.png`,
  previewImagemUrl: null,
  ativo: true,
  adquirido: false,
});

const itensAvatar = [
  item('trancas', 'Tranças', 'CABELO', 150),
  item('chapeu-cowboy', 'Chapéu de Cowboy', 'ACESSORIO', 160),
  item('luva-goleiro', 'Luva de Goleiro', 'LUVA', 120),
  item('bota-coturno', 'Bota Coturno', 'CALCADO', 140),
];

describe('LojaPage - itens novos do avatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStudentCoinsStore.setState({ saldoMoedas: 1000 });
    listarCatalogoMock.mockResolvedValue({
      dados: itensAvatar,
      metadados: { page: 1, limit: 100, total: itensAvatar.length, totalPages: 1 },
    });
    listarInventarioMock.mockResolvedValue(vazio);
    listarHistoricoMock.mockResolvedValue(vazio);
  });

  it.each([
    ['Cabelos', 'Tranças'],
    ['Acessórios', 'Chapéu de Cowboy'],
    ['Luvas', 'Luva de Goleiro'],
    ['Calçados', 'Bota Coturno'],
  ])('a categoria %s mostra só o item do seu tipo', async (categoria, nome) => {
    render(<LojaPage />);
    await screen.findByText('Tranças');

    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${categoria}`) }));

    const nomes = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(nomes).toEqual([nome]);
  });

  it('compra um item de cada tipo novo pelo modal de confirmação', async () => {
    render(<LojaPage />);
    await screen.findByText('Tranças');

    for (const novo of itensAvatar) {
      comprarItemMock.mockResolvedValueOnce({
        mensagem: 'Item comprado com sucesso.',
        saldoMoedas: 1000 - novo.precoMoedas,
        quantidadeComprada: 1,
        item: { id: `inv-${novo.id}`, equipado: false, quantidade: 1, adquiridoEm: '2026-11-26T00:00:00.000Z', item: novo },
      });

      const card = screen.getByText(novo.nome).closest('article') as HTMLElement;
      await userEvent.click(within(card).getByRole('button', { name: 'Comprar' }));
      const dialog = await screen.findByRole('dialog');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Comprar' }));

      await waitFor(() => expect(comprarItemMock).toHaveBeenCalledWith(novo.id, 1));
      const resultado = await screen.findByRole('alertdialog');
      await userEvent.click(within(resultado).getByRole('button', { name: 'Continuar comprando' }));
      expect(within(card).getByText('Adquirido')).toBeInTheDocument();
    }

    expect(comprarItemMock).toHaveBeenCalledTimes(4);
  });

  describe('pré-visualização no avatar', () => {
    const CHAVE_AVATAR = 'anatoquizup:avatar:aluno-1';
    const avatarSalvo = JSON.stringify({ corCerebro: 'azul', cabelo: 'loiro', acessorio: null, luva: null, calcado: null });

    beforeEach(() => {
      localStorage.clear();
      localStorage.setItem(CHAVE_AVATAR, avatarSalvo);
    });

    it('mostra o item no avatar do aluno e, ao sair sem comprar, nada muda', async () => {
      render(<LojaPage />);
      await screen.findByText('Bota Coturno');

      await userEvent.click(screen.getByRole('button', { name: 'Pré-visualizar Bota Coturno' }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('Como fica no seu avatar')).toBeInTheDocument();

      await userEvent.click(within(dialog).getByRole('button', { name: 'Como está agora' }));
      expect(within(dialog).getByText('Seu avatar como está agora')).toBeInTheDocument();

      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Sem compra, sem gasto e sem mudanca na aparencia salva (local ou remota).
      expect(comprarItemMock).not.toHaveBeenCalled();
      expect(useStudentCoinsStore.getState().saldoMoedas).toBe(1000);
      expect(localStorage.getItem(CHAVE_AVATAR)).toBe(avatarSalvo);
      expect(salvarAparenciaRemota).not.toHaveBeenCalled();
      expect(within(screen.getByText('Bota Coturno').closest('article') as HTMLElement).getByRole('button', { name: 'Comprar' })).toBeInTheDocument();
    });

    it('ao reabrir, a prévia volta a mostrar o item', async () => {
      render(<LojaPage />);
      await screen.findByText('Bota Coturno');

      await userEvent.click(screen.getByRole('button', { name: 'Pré-visualizar Bota Coturno' }));
      await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Como está agora' }));
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));

      await userEvent.click(screen.getByRole('button', { name: 'Pré-visualizar Bota Coturno' }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('Como fica no seu avatar')).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: 'Com o item' })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
