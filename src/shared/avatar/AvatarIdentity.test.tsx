import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AvatarCosmetico } from '../ui/profile-identity-card';
import { AvatarPage } from '../../pages/aluno/avatar/AvatarPage';
import { useAuth } from '../../app/providers/AuthProvider';
import { carregarAparencia, salvarAparencia } from './useAparenciaAvatar';
import { APARENCIA_PADRAO } from './aparencia';
import { buscarAparenciaRemota, salvarAparenciaRemota } from './avatarApi';

jest.mock('../../app/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('./avatarApi', () => ({ buscarAparenciaRemota: jest.fn(), salvarAparenciaRemota: jest.fn() }));

const identidade = { nome: 'Letícia', usuarioId: 'aluna-1' };
const avatar = () => screen.getByRole('img', { name: 'Avatar de Letícia' });

beforeEach(() => {
  localStorage.clear();
  jest.mocked(buscarAparenciaRemota).mockResolvedValue(APARENCIA_PADRAO);
  jest.mocked(salvarAparenciaRemota).mockImplementation(async (aparencia) => aparencia);
  jest.mocked(useAuth).mockReturnValue({ user: { id: 'aluna-1', name: 'Letícia' } } as ReturnType<typeof useAuth>);
});

it('exibe o cérebro padrão para aluno novo', () => {
  render(<AvatarCosmetico identidade={identidade} cosmeticos={{}} tamanho="sm" />);
  expect(avatar()).toHaveStyle({ filter: 'hue-rotate(0deg)' });
});

it('carrega a aparência de outro aluno a partir do backend', async () => {
  jest.mocked(buscarAparenciaRemota).mockResolvedValueOnce({ ...APARENCIA_PADRAO, corCerebro: 'roxo', cabelo: 'loiro' });
  render(<AvatarCosmetico identidade={{ nome: 'Outro', usuarioId: 'aluno-remoto' }} cosmeticos={{}} tamanho="sm" />);
  await waitFor(() => expect(screen.getByRole('img', { name: 'Avatar de Outro' })).toHaveStyle({ filter: 'hue-rotate(300deg)' }));
  expect(buscarAparenciaRemota).toHaveBeenCalledWith('aluno-remoto');
});

it('atualiza todas as representações somente ao salvar e restaura o padrão', async () => {
  render(<MemoryRouter>
    <AvatarPage />
    <AvatarCosmetico identidade={identidade} cosmeticos={{}} tamanho="sm" />
  </MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Editar aparência do avatar' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Azul' }));
  expect(avatar()).toHaveStyle({ filter: 'hue-rotate(0deg)' });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await waitFor(() => expect(avatar()).toHaveStyle({ filter: 'hue-rotate(235deg)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Verde' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(avatar()).toHaveStyle({ filter: 'hue-rotate(235deg)' });
  fireEvent.click(screen.getByRole('button', { name: 'Restaurar alterações' }));
  await waitFor(() => expect(avatar()).toHaveStyle({ filter: 'hue-rotate(0deg)' }));
});

it('mantém aparência após remontagem e isola usuários com o mesmo nome', () => {
  salvarAparencia('aluna-1', { ...APARENCIA_PADRAO, corCerebro: 'roxo', cabelo: 'loiro', acessorio: 'coroa' });
  const { unmount } = render(<AvatarCosmetico identidade={identidade} cosmeticos={{}} tamanho="sm" />);
  expect(avatar()).toHaveStyle({ filter: 'hue-rotate(300deg)' });
  unmount();
  const { rerender } = render(<AvatarCosmetico identidade={identidade} cosmeticos={{}} tamanho="sm" />);
  expect(avatar()).toHaveStyle({ filter: 'hue-rotate(300deg)' });
  rerender(<AvatarCosmetico identidade={{ ...identidade, usuarioId: 'aluna-2' }} cosmeticos={{}} tamanho="sm" />);
  expect(avatar()).toHaveStyle({ filter: 'hue-rotate(0deg)' });
});

it.each(['null', '42', '"texto"', '{', '{"corCerebro":"invalida","cabelo":"x","acessorio":"y"}'])('tolera registro inválido %s', (registro) => {
  localStorage.setItem('anatoquizup:avatar:aluna-1', registro);
  expect(carregarAparencia('aluna-1')).toEqual(APARENCIA_PADRAO);
});

it('sincroniza mudanças de outra aba', () => {
  render(<AvatarCosmetico identidade={identidade} cosmeticos={{}} tamanho="sm" />);
  act(() => {
    localStorage.setItem('anatoquizup:avatar:aluna-1', JSON.stringify({ corCerebro: 'verde' }));
    const storageEvent = new Event('storage');
    Object.defineProperty(storageEvent, 'key', { value: 'anatoquizup:avatar:aluna-1' });
    window.dispatchEvent(storageEvent);
  });
  expect(avatar()).toHaveStyle({ filter: 'hue-rotate(170deg)' });
});

it('usa a mesma aparência no pódio e na lista do ranking', async () => {
  const { RankingRow } = await import('../../features/ranking/ui/RankingRow');
  const { PodiumRanking } = await import('../../features/ranking/ui/PodiumRanking');
  salvarAparencia('aluna-1', { ...APARENCIA_PADRAO, corCerebro: 'azul', cabelo: 'cacheado', acessorio: 'oculos', luva: 'luva-boxe', calcado: 'tenis-esportivo' });
  const linha = {
    posicao: 1, id: 'aluna-1', nome: 'Letícia', nickname: null, detalhe: null,
    totalAcertos: 10, taxaAcerto: 100, destaque: true, cosmeticos: {},
  };
  const { container } = render(<>
    <RankingRow linha={linha} rotuloMetrica="XP" />
    <PodiumRanking linhas={[linha]} rotuloMetrica="XP" />
  </>);
  const imagens = screen.getAllByRole('img', { name: 'Avatar de Letícia' });
  expect(imagens).toHaveLength(2);
  imagens.forEach((imagem) => expect(imagem).toHaveStyle({ filter: 'hue-rotate(235deg)' }));
  expect([...container.querySelectorAll('img[aria-hidden="true"]')].filter((imagem) => imagem.getAttribute('style')?.includes('top: 68.76%'))).toHaveLength(2);
  expect([...container.querySelectorAll('img[aria-hidden="true"]')].filter((imagem) => imagem.getAttribute('style')?.includes('top: 75.79%'))).toHaveLength(2);
});

it('usa o cérebro para o próprio aluno mesmo com foto equipada e mantém a moldura', () => {
  render(<AvatarCosmetico identidade={{ ...identidade, preferirAvatarCerebro: true }}
    cosmeticos={{
      AVATAR: { nome: 'Foto antiga', imagemUrl: '/foto.png' },
      MOLDURA: { nome: 'Dourada', valor: '#ffc000' },
    } as React.ComponentProps<typeof AvatarCosmetico>['cosmeticos']} tamanho="sm" />);
  expect(avatar()).toBeInTheDocument();
  expect(screen.queryByRole('img', { name: 'Foto antiga' })).not.toBeInTheDocument();
  expect(screen.getByLabelText('Moldura Dourada')).toContainElement(avatar());
});

it('usa o cérebro também para outros estudantes com foto antiga equipada', () => {
  render(<AvatarCosmetico identidade={{ nome: 'Outro', usuarioId: 'aluno-2' }}
    cosmeticos={{ AVATAR: { nome: 'Foto antiga', imagemUrl: '/foto.png' } } as React.ComponentProps<typeof AvatarCosmetico>['cosmeticos']}
    tamanho="sm" />);
  expect(screen.getByRole('img', { name: 'Avatar de Outro' })).toBeInTheDocument();
  expect(screen.queryByRole('img', { name: 'Foto antiga' })).not.toBeInTheDocument();
});

it('usa o padrão se o armazenamento estiver indisponível', () => {
  const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('indisponível'); });
  try {
    render(<AvatarCosmetico identidade={identidade} cosmeticos={{}} tamanho="sm" />);
    expect(avatar()).toHaveStyle({ filter: 'hue-rotate(0deg)' });
  } finally {
    spy.mockRestore();
  }
});
