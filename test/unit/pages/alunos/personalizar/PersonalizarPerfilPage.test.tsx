import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import type { AxiosResponse } from 'axios';

import { PersonalizarPerfilPage } from '../../../../../src/pages/aluno/perfil/personalizar/PersonalizarPerfilPage';
import { httpClient } from '../../../../../src/shared/api/httpClient';
import { useAuth } from '../../../../../src/app/providers/AuthProvider';
import { useEquippedCosmeticsStore } from '../../../../../src/features/profile-cosmetics';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock('../../../../../src/app/providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));
const mockedUseAuth = jest.mocked(useAuth);

const mockSetCosmeticosGlobais = jest.fn();
jest.mock('../../../../../src/features/profile-cosmetics', () => ({
  useEquippedCosmeticsStore: jest.fn(),
}));
const mockedUseEquippedCosmeticsStore = jest.mocked(useEquippedCosmeticsStore);

jest.mock('../../../../../src/shared/api/httpClient', () => ({
  httpClient: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));
jest.mock('../../../../../src/shared/avatar/avatarApi', () => ({
  buscarAparenciaRemota: jest.fn().mockResolvedValue({ corCerebro: 'rosa', cabelo: null, acessorio: null }),
  salvarAparenciaRemota: jest.fn(),
}));
const mockedHttpClient = jest.mocked(httpClient);

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

type MockZustandState = {
  cosmeticos: Record<string, unknown>;
  setCosmeticos: jest.Mock;
};

const ITEM_CORUJA = {
  inventarioId: 'inventario-1',
  id: 'item-1',
  codigo: 'moldura-bronze',
  nome: 'Bronze',
  descricao: null,
  tipo: 'MOLDURA',
  precoMoedas: 0,
  valor: '#14b8a6',
  imagemUrl: null,
  previewImagemUrl: null,
  ativo: true,
  equipado: true,
  origem: 'COMPRA',
};
const ITEM_CEREBRO = {
  inventarioId: 'inventario-2',
  id: 'item-2',
  codigo: 'moldura-prateada',
  nome: 'Prateada',
  descricao: null,
  tipo: 'MOLDURA',
  precoMoedas: 0,
  valor: '#00214d',
  imagemUrl: null,
  previewImagemUrl: null,
  ativo: true,
  equipado: false,
  origem: 'COMPRA',
};
const ITEM_CORUJA_EQUIPADO = {
  id: ITEM_CORUJA.id,
  codigo: ITEM_CORUJA.codigo,
  nome: ITEM_CORUJA.nome,
  descricao: ITEM_CORUJA.descricao,
  tipo: ITEM_CORUJA.tipo,
  precoMoedas: ITEM_CORUJA.precoMoedas,
  valor: ITEM_CORUJA.valor,
  imagemUrl: ITEM_CORUJA.imagemUrl,
  previewImagemUrl: ITEM_CORUJA.previewImagemUrl,
  ativo: ITEM_CORUJA.ativo,
};

const ITEM_TITULO = {
  inventarioId: 'inventario-3',
  id: 'item-titulo-1',
  codigo: 'titulo-calouro-curioso',
  nome: 'Calouro Curioso',
  descricao: null,
  tipo: 'TITULO',
  precoMoedas: 0,
  valor: null,
  imagemUrl: null,
  previewImagemUrl: null,
  ativo: true,
  equipado: false,
  origem: 'COMPRA',
};
// So existe no catalogo (nao esta no inventario) — usado para testar o bloqueio.
const ITEM_TITULO_BLOQUEADO = {
  inventarioId: 'nao-possuido',
  id: 'item-titulo-2',
  codigo: 'titulo-mestre-anatomia',
  nome: 'Mestre da Anatomia',
  descricao: null,
  tipo: 'TITULO',
  precoMoedas: 250,
  valor: null,
  imagemUrl: null,
  previewImagemUrl: null,
  ativo: true,
  equipado: false,
  origem: 'COMPRA',
};

// Catalogo (GET /loja/catalogo) correspondente aos itens de inventario acima:
// a pagina agora busca inventario + catalogo em paralelo para poder mostrar
// itens ainda nao adquiridos (bloqueados).
const catalogoDe = (...itens: Array<typeof ITEM_CORUJA>) => ({
  data: {
    dados: itens.map((item) => ({
      id: item.id,
      codigo: item.codigo,
      nome: item.nome,
      descricao: item.descricao,
      tipo: item.tipo,
      precoMoedas: item.precoMoedas,
      valor: item.valor,
      imagemUrl: item.imagemUrl,
      previewImagemUrl: item.previewImagemUrl,
      ativo: item.ativo,
      disponivelNaLoja: true,
      adquirido: true,
    })),
  },
});

describe('PersonalizarPerfilPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-123',
        name: 'Pedro Cabeceira',
        nickname: 'cabeceira',
        course: 'Engenharia de Software',
        institution: 'UnB',
        email: 'pedro@unb.br',
        role: 'STUDENT',
      },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    mockedUseEquippedCosmeticsStore.mockImplementation((selector: unknown) => {
      const state: MockZustandState = {
        cosmeticos: {
          MOLDURA: ITEM_CORUJA_EQUIPADO,
        },
        setCosmeticos: mockSetCosmeticosGlobais,
      };
      
      const typedSelector = selector as (s: MockZustandState) => unknown;
      return typedSelector(state);
    });
  });

  it('deve renderizar a página, abas e buscar o inventário com sucesso', async () => {
    const mockResponse: Partial<AxiosResponse> = {
      data: {
        dados: [ITEM_CORUJA, ITEM_CEREBRO],
      },
    };
    mockedHttpClient.get.mockResolvedValueOnce(mockResponse as AxiosResponse);
    mockedHttpClient.get.mockResolvedValueOnce(catalogoDe(ITEM_CORUJA, ITEM_CEREBRO) as AxiosResponse);

    renderWithProviders(<PersonalizarPerfilPage />);

    expect(screen.getByText('Personalizar avatar')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Bronze')).toBeInTheDocument();
      expect(screen.getByText('Prateada')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Equipado')).toHaveLength(1);
  });

  it('deve exibir a barra de salvar ao selecionar um novo item', async () => {
    const mockResponse: Partial<AxiosResponse> = {
      data: {
        dados: [ITEM_CORUJA, ITEM_CEREBRO],
      },
    };
    mockedHttpClient.get.mockResolvedValueOnce(mockResponse as AxiosResponse);
    mockedHttpClient.get.mockResolvedValueOnce(catalogoDe(ITEM_CORUJA, ITEM_CEREBRO) as AxiosResponse);

    renderWithProviders(<PersonalizarPerfilPage />);

    await waitFor(() => expect(screen.getByText('Prateada')).toBeInTheDocument());

    expect(screen.queryByText('Você tem alterações não salvas')).not.toBeInTheDocument();

    const cerebroText = screen.getByText('Prateada');
    fireEvent.click(cerebroText);

    expect(await screen.findByText('Você tem alterações não salvas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar alterações/i })).toBeInTheDocument();
  });

  it('deve realizar as chamadas patch, atualizar store global e abrir modal de sucesso ao salvar', async () => {
    const mockResponse: Partial<AxiosResponse> = {
      data: {
        dados: [ITEM_CORUJA, ITEM_CEREBRO],
      },
    };
    mockedHttpClient.get.mockResolvedValueOnce(mockResponse as AxiosResponse);
    mockedHttpClient.get.mockResolvedValueOnce(catalogoDe(ITEM_CORUJA, ITEM_CEREBRO) as AxiosResponse);

    const mockPatchResponse: Partial<AxiosResponse> = { status: 200 };
    mockedHttpClient.patch.mockResolvedValueOnce(mockPatchResponse as AxiosResponse);

    renderWithProviders(<PersonalizarPerfilPage />);
    await waitFor(() => expect(screen.getByText('Prateada')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Prateada'));
    
    const saveBtn = await screen.findByRole('button', { name: /Salvar alterações/i });
    fireEvent.click(saveBtn);

    expect(await screen.findByText('Sucesso!')).toBeInTheDocument();
    
    expect(mockedHttpClient.patch).toHaveBeenCalledWith('/inventario/equipar', { itemLojaId: 'item-2' });
    expect(mockSetCosmeticosGlobais).toHaveBeenCalled();
  });

  it('deve desequipar (PATCH /inventario/desequipar) ao escolher "Nenhum (padrão)" e salvar', async () => {
    const mockResponse: Partial<AxiosResponse> = {
      data: {
        dados: [ITEM_CORUJA, ITEM_CEREBRO],
      },
    };
    mockedHttpClient.get.mockResolvedValueOnce(mockResponse as AxiosResponse);
    mockedHttpClient.get.mockResolvedValueOnce(catalogoDe(ITEM_CORUJA, ITEM_CEREBRO) as AxiosResponse);
    mockedHttpClient.patch.mockResolvedValueOnce({ status: 200 } as AxiosResponse);

    renderWithProviders(<PersonalizarPerfilPage />);
    await waitFor(() => expect(screen.getByText('Bronze')).toBeInTheDocument());

    // Remove o item equipado escolhendo "Nenhum (padrão)".
    fireEvent.click(screen.getByText('Nenhum (padrão)'));

    const saveBtn = await screen.findByRole('button', { name: /Salvar alterações/i });
    fireEvent.click(saveBtn);

    expect(await screen.findByText('Sucesso!')).toBeInTheDocument();
    expect(mockedHttpClient.patch).toHaveBeenCalledWith('/inventario/desequipar', {
      itemLojaId: 'item-1',
    });
    expect(mockSetCosmeticosGlobais).toHaveBeenCalled();
  });

  it('mostra só as abas Molduras, Títulos e Fundos, abrindo em Molduras', async () => {
    mockedHttpClient.get.mockResolvedValueOnce({ data: { dados: [ITEM_CORUJA] } } as AxiosResponse);
    mockedHttpClient.get.mockResolvedValueOnce(catalogoDe(ITEM_CORUJA) as AxiosResponse);

    renderWithProviders(<PersonalizarPerfilPage />);
    await waitFor(() => expect(screen.getByText('Bronze')).toBeInTheDocument());

    expect(screen.getByRole('heading', { name: 'Molduras' })).toBeInTheDocument();
    expect(screen.getByText('Títulos')).toBeInTheDocument();
    expect(screen.getByText('Fundos')).toBeInTheDocument();
    for (const removida of ['Ícones', 'Avatares', 'Aparência']) {
      expect(screen.queryByText(removida)).not.toBeInTheDocument();
    }
  });

  it('deve bloquear item nao adquirido e navegar para a loja em vez de equipar', async () => {
    const mockResponse: Partial<AxiosResponse> = { data: { dados: [ITEM_TITULO] } };
    mockedHttpClient.get.mockResolvedValueOnce(mockResponse as AxiosResponse);
    mockedHttpClient.get.mockResolvedValueOnce(
      catalogoDe(ITEM_TITULO, ITEM_TITULO_BLOQUEADO) as AxiosResponse,
    );

    renderWithProviders(<PersonalizarPerfilPage />);
    await waitFor(() => expect(screen.getByText('Títulos')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Títulos'));

    const [nomeBloqueado] = await screen.findAllByText(ITEM_TITULO_BLOQUEADO.nome);
    expect(screen.getByText('Adquira na loja')).toBeInTheDocument();

    fireEvent.click(nomeBloqueado);

    expect(mockNavigate).toHaveBeenCalledWith('/aluno/loja');
    expect(mockedHttpClient.patch).not.toHaveBeenCalled();
  });

  it('deve equipar um título possuído ao salvar', async () => {
    const mockResponse: Partial<AxiosResponse> = { data: { dados: [ITEM_TITULO] } };
    mockedHttpClient.get.mockResolvedValueOnce(mockResponse as AxiosResponse);
    mockedHttpClient.get.mockResolvedValueOnce(
      catalogoDe(ITEM_TITULO, ITEM_TITULO_BLOQUEADO) as AxiosResponse,
    );
    mockedHttpClient.patch.mockResolvedValueOnce({ status: 200 } as AxiosResponse);

    renderWithProviders(<PersonalizarPerfilPage />);
    await waitFor(() => expect(screen.getByText('Títulos')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Títulos'));
    fireEvent.click((await screen.findAllByText(ITEM_TITULO.nome))[0]);

    const saveBtn = await screen.findByRole('button', { name: /Salvar alterações/i });
    fireEvent.click(saveBtn);

    expect(await screen.findByText('Sucesso!')).toBeInTheDocument();
    expect(mockedHttpClient.patch).toHaveBeenCalledWith('/inventario/equipar', {
      itemLojaId: ITEM_TITULO.id,
    });
  });

  it('deve navegar para a loja ao clicar em Ver mais na Loja', async () => {
    const mockResponse: Partial<AxiosResponse> = { data: { dados: [] } };
    mockedHttpClient.get.mockResolvedValueOnce(mockResponse as AxiosResponse);
    mockedHttpClient.get.mockResolvedValueOnce({ data: { dados: [] } } as AxiosResponse);

    renderWithProviders(<PersonalizarPerfilPage />);

    const shopBtn = await screen.findAllByText('Ver mais na Loja');
    fireEvent.click(shopBtn[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/aluno/loja');
  });

  it('mostra a prévia do item bloqueado sem imagem quebrada (moldura e fundo usam o valor)', async () => {
    const molduraBloqueada = { ...ITEM_CEREBRO, id: 'moldura-dourada', nome: 'Dourada', valor: '#FCD34D' };
    const fundoBloqueado = {
      ...ITEM_CEREBRO,
      id: 'fundo-azul',
      codigo: 'fundo-azul-noturno',
      nome: 'Azul Noturno',
      tipo: 'PLANO_FUNDO',
      valor: '#0A1128',
    };
    mockedHttpClient.get.mockResolvedValueOnce({ data: { dados: [] } } as AxiosResponse);
    mockedHttpClient.get.mockResolvedValueOnce(catalogoDe(molduraBloqueada, fundoBloqueado) as AxiosResponse);

    renderWithProviders(<PersonalizarPerfilPage />);
    const cartaoMoldura = (await screen.findByText('Dourada')).closest('button')!;

    expect(cartaoMoldura.querySelector('img')).toBeNull();
    expect(cartaoMoldura.querySelector('[style*="background"]')).toHaveStyle({ background: '#FCD34D' });

    fireEvent.click(screen.getByText('Fundos'));
    const cartaoFundo = (await screen.findByText('Azul Noturno')).closest('button')!;
    expect(cartaoFundo.querySelector('img')).toBeNull();
    expect(cartaoFundo.querySelector('[style*="background"]')).toHaveStyle({ background: '#0A1128' });
  });
});
