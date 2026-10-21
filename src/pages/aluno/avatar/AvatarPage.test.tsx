import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { AvatarPage } from './AvatarPage';
import { buscarAparenciaRemota, salvarAparenciaRemota } from '../../../shared/avatar/avatarApi';
import { APARENCIA_PADRAO } from './aparencia';

jest.mock('../../../app/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('../../../shared/avatar/avatarApi', () => ({ buscarAparenciaRemota: jest.fn(), salvarAparenciaRemota: jest.fn() }));
const mockedUseAuth = jest.mocked(useAuth);

const renderPage = () => render(<MemoryRouter><AvatarPage /></MemoryRouter>);

describe('AvatarPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.mocked(buscarAparenciaRemota).mockResolvedValue(APARENCIA_PADRAO);
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
    expect(screen.getByRole('button', { name: 'Moicano' })).toHaveClass('selecionado');
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
});
