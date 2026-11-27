import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { AvatarPage } from './AvatarPage';
import { buscarAparenciaRemota, salvarAparenciaRemota } from '../../../shared/avatar/avatarApi';
import { buscarInventarioCompleto, listarCatalogo, type InventarioItem } from '../../../features/loja';
import { APARENCIA_PADRAO } from './aparencia';

jest.mock('../../../app/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('../../../shared/avatar/avatarApi', () => ({ buscarAparenciaRemota: jest.fn(), salvarAparenciaRemota: jest.fn() }));
jest.mock('../../../features/loja', () => ({ buscarInventarioCompleto: jest.fn(), listarCatalogo: jest.fn() }));
const mockedUseAuth = jest.mocked(useAuth);

const renderPage = () => render(<MemoryRouter><AvatarPage /></MemoryRouter>);

describe('AvatarPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.mocked(buscarAparenciaRemota).mockResolvedValue(APARENCIA_PADRAO);
    jest.mocked(salvarAparenciaRemota).mockImplementation(async (aparencia) => aparencia);
    jest.mocked(buscarInventarioCompleto).mockResolvedValue([]);
    jest.mocked(listarCatalogo).mockResolvedValue({ dados: [], metadados: { page: 1, limit: 100, total: 0, totalPages: 1 } });
    mockedUseAuth.mockReturnValue({
      user: { id: 'user-1', name: 'Aluno Teste' },
    } as unknown as ReturnType<typeof useAuth>);
  });

  it('exibe apenas o cartão do avatar até a canetinha ser acionada', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());

    expect(screen.getByRole('heading', { name: 'Personalize seu avatar' })).toBeInTheDocument();
    expect(screen.queryByText('Cor do Cérebro')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));

    expect(screen.getByText('Cor do Cérebro')).toBeInTheDocument();
    expect(screen.getByText('Cabelo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Nenhum' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('permite escolher calçados para o avatar', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));

    fireEvent.click(screen.getByRole('tab', { name: 'Calçados' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tênis esportivo' }));
    expect(screen.getByRole('button', { name: 'Tênis esportivo' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled();
  });

  it('permite combinar luvas com acessórios de cabeça', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Acessórios' }));
    fireEvent.click(screen.getByRole('button', { name: 'Coroa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Luva de boxe' }));
    expect(screen.getByRole('button', { name: 'Coroa' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Luva de boxe' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('a aba Acessórios lista os itens liberados e permite equipar um', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));

    fireEvent.click(screen.getByRole('tab', { name: 'Acessórios' }));

    expect(screen.getByRole('button', { name: 'Nenhum' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Coroa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Óculos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chapéu de formatura' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Coroa' }));

    expect(screen.getByRole('button', { name: 'Coroa' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled();
  });

  it('habilita Salvar/Cancelar somente após alterar a seleção', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));

    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Roxo' }));

    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled();
  });

  it('persiste a escolha no backend ao salvar', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));

    fireEvent.click(screen.getByRole('button', { name: 'Loiro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(salvarAparenciaRemota).toHaveBeenCalledWith({ ...APARENCIA_PADRAO, cabelo: 'loiro' }));
    const salvo = JSON.parse(localStorage.getItem('anatoquizup:avatar:user-1') ?? '{}');
    expect(salvo).toMatchObject({ cabelo: 'loiro' });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument());
    expect(screen.getByText('Alterações salvas.')).toBeInTheDocument();
  });

  it('carrega do backend a aparência salva em outra sessão', async () => {
    jest.mocked(buscarAparenciaRemota).mockResolvedValue({ ...APARENCIA_PADRAO, corCerebro: 'azul', cabelo: 'moicano', acessorio: 'coroa', luva: 'luva-la', calcado: 'tenis-cano-alto' });
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));
    expect(screen.getByRole('button', { name: 'Azul' })).toHaveClass('selecionado');
    expect(screen.getByRole('button', { name: 'Topete' })).toHaveClass('selecionado');
    fireEvent.click(screen.getByRole('tab', { name: 'Acessórios' }));
    expect(screen.getByRole('button', { name: 'Luva de lã' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Calçados' }));
    expect(screen.getByRole('button', { name: 'Tênis cano alto' })).toHaveAttribute('aria-pressed', 'true');
    expect(buscarAparenciaRemota).toHaveBeenCalledWith('user-1', true);
  });

  it('não confirma a mudança se a gravação falhar', async () => {
    jest.mocked(salvarAparenciaRemota).mockRejectedValueOnce(new Error('falha'));
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Azul' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await screen.findByText('Não foi possível salvar o avatar.');
    expect(localStorage.getItem('anatoquizup:avatar:user-1')).toEqual(JSON.stringify(APARENCIA_PADRAO));
  });

  it('descarta o rascunho ao cancelar, voltando ao que estava salvo', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));

    fireEvent.click(screen.getByRole('button', { name: 'Azul' }));
    expect(screen.getByRole('button', { name: 'Azul' })).toHaveClass('selecionado');

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByText('Cor do Cérebro')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));
    expect(screen.getByRole('button', { name: 'Rosa' })).toHaveClass('selecionado');
    expect(screen.getByRole('button', { name: 'Azul' })).not.toHaveClass('selecionado');
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
  });

  it('restaura para o padrão no backend', async () => {
    jest.mocked(buscarAparenciaRemota).mockResolvedValue({ ...APARENCIA_PADRAO, corCerebro: 'verde', cabelo: 'moicano' });
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());

    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));
    expect(screen.getByRole('button', { name: 'Verde' })).toHaveClass('selecionado');

    fireEvent.click(screen.getByRole('button', { name: /Restaurar alterações/i }));

    await waitFor(() => expect(salvarAparenciaRemota).toHaveBeenCalledWith(APARENCIA_PADRAO));
    expect(screen.getByRole('button', { name: 'Rosa' })).toHaveClass('selecionado');
    expect(screen.getByText('Avatar restaurado ao padrão.')).toBeInTheDocument();
  });

  describe('itens comprados na loja', () => {
    const comprado = (codigo: string, nome: string, tipo: string, pasta: string) => ({
      id: `inv-${codigo}`,
      equipado: false,
      adquiridoEm: '2026-11-26T19:02:03.652Z',
      item: {
        id: codigo, codigo, nome, tipo, descricao: null, precoMoedas: 100, valor: null,
        imagemUrl: `/avatar/${pasta}/${codigo}.png`, previewImagemUrl: null, ativo: true,
      },
    }) as unknown as InventarioItem;

    const abrirEditor = async () => {
      renderPage();
      await waitFor(() => expect(buscarInventarioCompleto).toHaveBeenCalled());
      await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());
      fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));
    };

    it('mostra o tênis comprado na aba Calçados e deixa equipar e salvar', async () => {
      jest.mocked(buscarInventarioCompleto).mockResolvedValue([
        comprado('tenis-esportivo-preto', 'Tênis Esportivo Preto', 'CALCADO', 'calcados'),
      ]);
      await abrirEditor();

      fireEvent.click(screen.getByRole('tab', { name: 'Calçados' }));
      const tenis = await screen.findByRole('button', { name: 'Tênis Esportivo Preto' });
      expect(tenis.querySelector('img')).toHaveAttribute('src', '/avatar/calcados/tenis-esportivo-preto.png');

      fireEvent.click(tenis);
      expect(tenis).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
      await waitFor(() => expect(salvarAparenciaRemota).toHaveBeenCalledWith(
        expect.objectContaining({ calcado: 'tenis-esportivo-preto' }),
      ));
    });

    it('mostra cabelo, acessório e luva comprados nas suas grades', async () => {
      jest.mocked(buscarInventarioCompleto).mockResolvedValue([
        comprado('trancas', 'Tranças', 'CABELO', 'cabelo'),
        comprado('chapeu-cowboy', 'Chapéu de Cowboy', 'ACESSORIO', 'acessorios'),
        comprado('luva-goleiro', 'Luva de Goleiro', 'LUVA', 'luvas'),
      ]);
      await abrirEditor();

      expect(await screen.findByRole('button', { name: 'Tranças' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('tab', { name: 'Acessórios' }));
      expect(screen.getByRole('button', { name: 'Chapéu de Cowboy' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Luva de Goleiro' })).toBeInTheDocument();
    });

    it('não mostra item que não foi comprado nem item que o avatar não sabe desenhar', async () => {
      jest.mocked(buscarInventarioCompleto).mockResolvedValue([
        comprado('icone-coruja', 'Coruja', 'ICONE_PERFIL', 'icones'),
        comprado('calcado-inexistente', 'Calçado Inexistente', 'CALCADO', 'calcados'),
      ]);
      await abrirEditor();

      fireEvent.click(screen.getByRole('tab', { name: 'Calçados' }));
      expect(screen.queryByRole('button', { name: 'Tênis Esportivo Preto' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Calçado Inexistente' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Coruja' })).not.toBeInTheDocument();
    });

    it('mantém os itens base quando o inventário não carrega', async () => {
      jest.mocked(buscarInventarioCompleto).mockRejectedValue(new Error('falha'));
      await abrirEditor();

      fireEvent.click(screen.getByRole('tab', { name: 'Calçados' }));
      expect(screen.getByRole('button', { name: 'Tênis esportivo' })).toBeInTheDocument();
    });
  });

  describe('itens não comprados', () => {
    const daLoja = (codigo: string, nome: string, tipo: string, pasta: string, adquirido: boolean) => ({
      id: codigo, codigo, nome, tipo, descricao: null, precoMoedas: 120, valor: null,
      imagemUrl: `/avatar/${pasta}/${codigo}.png`, previewImagemUrl: null, ativo: true, adquirido,
    });

    const catalogo = (...itens: ReturnType<typeof daLoja>[]) =>
      jest.mocked(listarCatalogo).mockResolvedValue({
        dados: itens,
        metadados: { page: 1, limit: 100, total: itens.length, totalPages: 1 },
      } as Awaited<ReturnType<typeof listarCatalogo>>);

    const abrirEditor = async () => {
      renderPage();
      await waitFor(() => expect(listarCatalogo).toHaveBeenCalled());
      await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());
      fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));
    };

    it('mostra o item não comprado bloqueado, com aviso de que está na loja', async () => {
      catalogo(daLoja('bota-coturno', 'Bota Coturno', 'CALCADO', 'calcados', false));
      await abrirEditor();

      fireEvent.click(screen.getByRole('tab', { name: 'Calçados' }));
      const bota = await screen.findByRole('button', { name: 'Bota Coturno (adquira na loja)' });

      expect(bota).toHaveClass('bloqueado');
      expect(bota).toHaveAttribute('aria-disabled', 'true');
      expect(bota).toHaveAttribute('title', 'Adquira na loja');
    });

    it('não equipa o item bloqueado ao clicar e aponta para a Loja', async () => {
      catalogo(daLoja('luva-goleiro', 'Luva de Goleiro', 'LUVA', 'luvas', false));
      await abrirEditor();

      fireEvent.click(screen.getByRole('tab', { name: 'Acessórios' }));
      const luva = await screen.findByRole('button', { name: 'Luva de Goleiro (adquira na loja)' });
      fireEvent.click(luva);

      expect(luva).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: 'Nenhuma' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
      expect(screen.getByText(/ainda não é seu/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Loja' })).toHaveAttribute('href', '/aluno/loja');
    });

    it('o aviso some ao escolher um item liberado', async () => {
      catalogo(daLoja('trancas', 'Tranças', 'CABELO', 'cabelo', false));
      await abrirEditor();

      fireEvent.click(await screen.findByRole('button', { name: 'Tranças (adquira na loja)' }));
      expect(screen.getByText(/ainda não é seu/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Loiro' }));
      expect(screen.queryByText(/ainda não é seu/)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Loiro' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('item comprado aparece liberado mesmo estando no catálogo', async () => {
      catalogo(daLoja('chapeu-cowboy', 'Chapéu de Cowboy', 'ACESSORIO', 'acessorios', true));
      jest.mocked(buscarInventarioCompleto).mockResolvedValue([
        { id: 'inv-1', equipado: false, adquiridoEm: null, item: daLoja('chapeu-cowboy', 'Chapéu de Cowboy', 'ACESSORIO', 'acessorios', true) },
      ] as unknown as InventarioItem[]);
      await abrirEditor();

      fireEvent.click(screen.getByRole('tab', { name: 'Acessórios' }));
      const chapeu = await screen.findByRole('button', { name: 'Chapéu de Cowboy' });
      expect(chapeu).not.toHaveClass('bloqueado');
      fireEvent.click(chapeu);
      expect(chapeu).toHaveAttribute('aria-pressed', 'true');
    });

    it('ignora itens de outros tipos do catálogo', async () => {
      catalogo(daLoja('icone-coruja', 'Coruja', 'ICONE_PERFIL', 'icones', false));
      await abrirEditor();

      expect(screen.queryByRole('button', { name: /Coruja/ })).not.toBeInTheDocument();
    });
  });
});
