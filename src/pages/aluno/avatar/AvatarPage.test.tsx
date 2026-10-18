import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { AvatarPage } from './AvatarPage';
import { buscarAparenciaRemota, salvarAparenciaRemota } from '../../../shared/avatar/avatarApi';

jest.mock('../../../app/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('../../../shared/avatar/avatarApi', () => ({ buscarAparenciaRemota: jest.fn(), salvarAparenciaRemota: jest.fn() }));
const mockedUseAuth = jest.mocked(useAuth);

const renderPage = () => render(<MemoryRouter><AvatarPage /></MemoryRouter>);

describe('AvatarPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.mocked(buscarAparenciaRemota).mockResolvedValue({ corCerebro: 'rosa', cabelo: null, acessorio: null });
    jest.mocked(salvarAparenciaRemota).mockImplementation(async (aparencia) => aparencia);
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

  it('mostra a aba Roupas desabilitada (fora de escopo)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));

    expect(screen.getByRole('tab', { name: 'Roupas' })).toBeDisabled();
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

    await waitFor(() => expect(salvarAparenciaRemota).toHaveBeenCalledWith({ corCerebro: 'rosa', cabelo: 'loiro', acessorio: null }));
    const salvo = JSON.parse(localStorage.getItem('anatoquizup:avatar:user-1') ?? '{}');
    expect(salvo).toMatchObject({ cabelo: 'loiro' });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument());
    expect(screen.getByText('Alterações salvas.')).toBeInTheDocument();
  });

  it('carrega do backend a aparência salva em outra sessão', async () => {
    jest.mocked(buscarAparenciaRemota).mockResolvedValue({ corCerebro: 'azul', cabelo: 'moicano', acessorio: 'coroa' });
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));
    expect(screen.getByRole('button', { name: 'Azul' })).toHaveClass('selecionado');
    expect(screen.getByRole('button', { name: 'Moicano' })).toHaveClass('selecionado');
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
    expect(localStorage.getItem('anatoquizup:avatar:user-1')).toEqual(JSON.stringify({ corCerebro: 'rosa', cabelo: null, acessorio: null }));
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
    jest.mocked(buscarAparenciaRemota).mockResolvedValue({ corCerebro: 'verde', cabelo: 'moicano', acessorio: null });
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());

    fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));
    expect(screen.getByRole('button', { name: 'Verde' })).toHaveClass('selecionado');

    fireEvent.click(screen.getByRole('button', { name: /Restaurar alterações/i }));

    await waitFor(() => expect(salvarAparenciaRemota).toHaveBeenCalledWith({ corCerebro: 'rosa', cabelo: null, acessorio: null }));
    expect(screen.getByRole('button', { name: 'Rosa' })).toHaveClass('selecionado');
    expect(screen.getByText('Avatar restaurado ao padrão.')).toBeInTheDocument();
  });
});
