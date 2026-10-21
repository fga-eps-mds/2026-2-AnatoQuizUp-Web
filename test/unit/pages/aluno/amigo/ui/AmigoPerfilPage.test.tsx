import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { desfazerAmizade } from '../../../../../../src/features/friendship';
import type { ItemInventario } from '../../../../../../src/features/loja';
import { buscarPerfilSocial } from '../../../../../../src/features/social-profile';
import { AmigoPerfilPage } from '../../../../../../src/pages/aluno/amigo';

jest.mock('../../../../../../src/features/friendship', () => ({
  desfazerAmizade: jest.fn(),
}));

jest.mock('../../../../../../src/features/social-profile', () => ({
  buscarPerfilSocial: jest.fn(),
}));

const buscarPerfilSocialMock = jest.mocked(buscarPerfilSocial);
const desfazerAmizadeMock = jest.mocked(desfazerAmizade);

const avatar: ItemInventario = {
  id: 'avatar-1',
  codigo: 'avatar-rafael',
  nome: 'Avatar do Rafael',
  descricao: null,
  tipo: 'AVATAR',
  precoMoedas: 0,
  valor: null,
  imagemUrl: '/avatar-rafael.png',
  previewImagemUrl: null,
  ativo: true,
};

const perfilPadrao = {
  usuario: {
    id: 'aluno-2',
    nome: 'Rafael Oliveira',
    nickname: 'rafael',
    curso: 'Medicina',
    semestre: '4',
  },
  cosmeticos: [avatar],
  conquistasDestacadas: [],
};

const LocationProbe = () => {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
};

const renderPagina = (state?: { amizadeId?: string }) =>
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/aluno/amigos/aluno-2',
          state: state ?? null,
        },
      ]}
    >
      <Routes>
        <Route path="/aluno/amigos/:id" element={<AmigoPerfilPage />} />
        <Route path="/aluno/amigos" element={<div>Lista de amigos</div>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );

describe('AmigoPerfilPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buscarPerfilSocialMock.mockResolvedValue(perfilPadrao);
    desfazerAmizadeMock.mockResolvedValue({
      mensagem: 'Amizade desfeita com sucesso',
    });
  });

  it('exibe o carregamento enquanto aguarda o perfil agregado', () => {
    buscarPerfilSocialMock.mockImplementation(() => new Promise(() => {}));

    renderPagina();

    expect(
      screen.getByRole('status', { name: 'Carregando perfil' }),
    ).toBeInTheDocument();
  });

  it('renderiza identidade, cosméticos e conquistas do perfil social', async () => {
    renderPagina();

    expect(await screen.findByText('Rafael Oliveira')).toBeInTheDocument();
    expect(screen.getByText('@rafael')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Avatar de Rafael Oliveira' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Avatar do Rafael' })).not.toBeInTheDocument();
    expect(buscarPerfilSocialMock).toHaveBeenCalledWith('aluno-2');
  });

  it('não exibe a ação de amizade sem o identificador da conexão', async () => {
    renderPagina();

    await screen.findByText('Rafael Oliveira');
    expect(
      screen.queryByRole('button', { name: /Desfazer amizade/i }),
    ).not.toBeInTheDocument();
  });

  it('desfaz a amizade e retorna para a lista', async () => {
    const user = userEvent.setup();
    renderPagina({ amizadeId: 'amizade-1' });

    await user.click(
      await screen.findByRole('button', { name: /Desfazer amizade/i }),
    );

    expect(desfazerAmizadeMock).toHaveBeenCalledWith('amizade-1');
    expect(screen.getByTestId('location')).toHaveTextContent('/aluno/amigos');
  });

  it('mantém a página e informa erro quando não consegue desfazer', async () => {
    const user = userEvent.setup();
    desfazerAmizadeMock.mockRejectedValueOnce(new Error('falha'));
    renderPagina({ amizadeId: 'amizade-1' });

    await user.click(
      await screen.findByRole('button', { name: /Desfazer amizade/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível desfazer a amizade.',
    );
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/aluno/amigos/aluno-2',
    );
  });

  it('exibe erro quando o perfil social não pode ser carregado', async () => {
    buscarPerfilSocialMock.mockRejectedValueOnce(new Error('não encontrado'));

    renderPagina();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar este perfil.',
    );
  });

  it('ignora a resposta recebida depois da desmontagem', async () => {
    let resolver!: (value: typeof perfilPadrao) => void;
    const pendente = new Promise<typeof perfilPadrao>((resolve) => {
      resolver = resolve;
    });
    buscarPerfilSocialMock.mockReturnValueOnce(pendente);

    const { unmount } = renderPagina();
    unmount();
    resolver(perfilPadrao);
    await pendente;
    await waitFor(() => expect(buscarPerfilSocialMock).toHaveBeenCalledTimes(1));
  });

  it('exibe erro imediatamente quando não existe id na rota', () => {
    render(
      <MemoryRouter initialEntries={['/aluno/amigos']}>
        <Routes>
          <Route path="/aluno/amigos" element={<AmigoPerfilPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar este perfil.',
    );
    expect(buscarPerfilSocialMock).not.toHaveBeenCalled();
  });
});
