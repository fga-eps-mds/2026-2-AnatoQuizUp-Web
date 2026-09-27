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
  codigo: 'coruja',
  nome: 'Coruja',
  descricao: null,
  tipo: 'ICONE_PERFIL',
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
  codigo: 'cerebro',
  nome: 'Cérebro',
  descricao: null,
  tipo: 'ICONE_PERFIL',
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

const ITEM_ROSTO = {
  inventarioId: 'inventario-3',
  id: 'item-rosto-1',
  codigo: 'rosto-padrao',
  nome: 'Rosto Padrão',
  descricao: null,
  tipo: 'ROSTO',
  precoMoedas: 0,
  valor: null,
  imagemUrl: null,
  previewImagemUrl: null,
  ativo: true,
  equipado: false,
  origem: 'COMPRA',
};
// So existe no catalogo (nao esta no inventario) — usado para testar o bloqueio.
const ITEM_CABELO_BLOQUEADO = {
  inventarioId: 'nao-possuido',
  id: 'item-cabelo-1',
  codigo: 'cabelo-moicano',
  nome: 'Moicano Colorido',
  descricao: null,
  tipo: 'CABELO',
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
          ICONE_PERFIL: ITEM_CORUJA_EQUIPADO,
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

    expect(screen.getByText('Personalizar Perfil')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Coruja')).toBeInTheDocument();
      expect(screen.getByText('Cérebro')).toBeInTheDocument();
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

    await waitFor(() => expect(screen.getByText('Cérebro')).toBeInTheDocument());

    expect(screen.queryByText('Você tem alterações não salvas')).not.toBeInTheDocument();

    const cerebroText = screen.getByText('Cérebro');
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
    await waitFor(() => expect(screen.getByText('Cérebro')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Cérebro'));
    
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
    await waitFor(() => expect(screen.getByText('Coruja')).toBeInTheDocument());

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

  it('deve mostrar a aba Aparência com os grupos de Rosto e Cabelo', async () => {
    const mockResponse: Partial<AxiosResponse> = { data: { dados: [ITEM_ROSTO] } };
    mockedHttpClient.get.mockResolvedValueOnce(mockResponse as AxiosResponse);
    mockedHttpClient.get.mockResolvedValueOnce(
      catalogoDe(ITEM_ROSTO, ITEM_CABELO_BLOQUEADO) as AxiosResponse,
    );

    renderWithProviders(<PersonalizarPerfilPage />);
    await waitFor(() => expect(screen.getByText('Aparência')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Aparência'));

    expect(await screen.findByText('Rosto')).toBeInTheDocument();
    expect(screen.getByText('Cabelo')).toBeInTheDocument();
  });

  it('deve bloquear item nao adquirido e navegar para a loja em vez de equipar', async () => {
    const mockResponse: Partial<AxiosResponse> = { data: { dados: [ITEM_ROSTO] } };
    mockedHttpClient.get.mockResolvedValueOnce(mockResponse as AxiosResponse);
    mockedHttpClient.get.mockResolvedValueOnce(
      catalogoDe(ITEM_ROSTO, ITEM_CABELO_BLOQUEADO) as AxiosResponse,
    );

    renderWithProviders(<PersonalizarPerfilPage />);
    await waitFor(() => expect(screen.getByText('Aparência')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Aparência'));

    const nomeBloqueado = await screen.findByText(ITEM_CABELO_BLOQUEADO.nome);
    expect(screen.getByText('Adquira na loja')).toBeInTheDocument();

    fireEvent.click(nomeBloqueado);

    expect(mockNavigate).toHaveBeenCalledWith('/aluno/loja');
    expect(mockedHttpClient.patch).not.toHaveBeenCalled();
  });

  it('deve equipar um item de ROSTO possuído ao salvar', async () => {
    const mockResponse: Partial<AxiosResponse> = { data: { dados: [ITEM_ROSTO] } };
    mockedHttpClient.get.mockResolvedValueOnce(mockResponse as AxiosResponse);
    mockedHttpClient.get.mockResolvedValueOnce(
      catalogoDe(ITEM_ROSTO, ITEM_CABELO_BLOQUEADO) as AxiosResponse,
    );
    mockedHttpClient.patch.mockResolvedValueOnce({ status: 200 } as AxiosResponse);

    renderWithProviders(<PersonalizarPerfilPage />);
    await waitFor(() => expect(screen.getByText('Aparência')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Aparência'));
    fireEvent.click(await screen.findByText(ITEM_ROSTO.nome));

    const saveBtn = await screen.findByRole('button', { name: /Salvar alterações/i });
    fireEvent.click(saveBtn);

    expect(await screen.findByText('Sucesso!')).toBeInTheDocument();
    expect(mockedHttpClient.patch).toHaveBeenCalledWith('/inventario/equipar', {
      itemLojaId: ITEM_ROSTO.id,
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
});
