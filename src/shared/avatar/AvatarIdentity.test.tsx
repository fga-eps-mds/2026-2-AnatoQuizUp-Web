import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AvatarCosmetico } from '../ui/profile-identity-card';
import { AvatarPage } from '../../pages/aluno/avatar/AvatarPage';
import { useAuth } from '../../app/providers/AuthProvider';
import { carregarAparencia, salvarAparencia } from './useAparenciaAvatar';
import { APARENCIA_PADRAO } from './aparencia';

jest.mock('../../app/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

const identidade = { nome: 'Letícia', usuarioId: 'aluna-1' };
const avatar = () => screen.getByRole('img', { name: 'Avatar de Letícia' });

beforeEach(() => {
  localStorage.clear();
  jest.mocked(useAuth).mockReturnValue({ user: { id: 'aluna-1', name: 'Letícia' } } as ReturnType<typeof useAuth>);
});

it('exibe o cérebro padrão para aluno novo', () => {
  render(<AvatarCosmetico identidade={identidade} cosmeticos={{}} tamanho="sm" />);
  expect(avatar()).toHaveStyle({ filter: 'hue-rotate(0deg)' });
});

it('atualiza todas as representações somente ao salvar e restaura o padrão', () => {
  render(<MemoryRouter>
    <AvatarPage />
    <AvatarCosmetico identidade={identidade} cosmeticos={{}} tamanho="sm" />
  </MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Azul' }));
  expect(avatar()).toHaveStyle({ filter: 'hue-rotate(0deg)' });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  expect(avatar()).toHaveStyle({ filter: 'hue-rotate(235deg)' });
  fireEvent.click(screen.getByRole('button', { name: 'Editar aparência do avatar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Verde' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(avatar()).toHaveStyle({ filter: 'hue-rotate(235deg)' });
  fireEvent.click(screen.getByRole('button', { name: 'Restaurar alterações' }));
  expect(avatar()).toHaveStyle({ filter: 'hue-rotate(0deg)' });
});

it('mantém aparência após remontagem e isola usuários com o mesmo nome', () => {
  salvarAparencia('aluna-1', { corCerebro: 'roxo', cabelo: 'loiro', acessorio: 'coroa' });
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
    window.dispatchEvent(new StorageEvent('storage', { key: 'anatoquizup:avatar:aluna-1' }));
  });
  expect(avatar()).toHaveStyle({ filter: 'hue-rotate(170deg)' });
});

it('usa a mesma aparência no pódio e na lista do ranking', async () => {
  const { RankingRow } = await import('../../features/ranking/ui/RankingRow');
  const { PodiumRanking } = await import('../../features/ranking/ui/PodiumRanking');
  salvarAparencia('aluna-1', { corCerebro: 'azul', cabelo: 'cacheado', acessorio: 'oculos' });
  const linha = {
    posicao: 1, id: 'aluna-1', nome: 'Letícia', nickname: null, detalhe: null,
    totalAcertos: 10, taxaAcerto: 100, destaque: true, cosmeticos: {},
  };
  render(<>
    <RankingRow linha={linha} rotuloMetrica="XP" />
    <PodiumRanking linhas={[linha]} rotuloMetrica="XP" />
  </>);
  const imagens = screen.getAllByRole('img', { name: 'Avatar de Letícia' });
  expect(imagens).toHaveLength(2);
  imagens.forEach((imagem) => expect(imagem).toHaveStyle({ filter: 'hue-rotate(235deg)' }));
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

it('usa o padrão se o armazenamento estiver indisponível', () => {
  const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('indisponível'); });
  try {
    render(<AvatarCosmetico identidade={identidade} cosmeticos={{}} tamanho="sm" />);
    expect(avatar()).toHaveStyle({ filter: 'hue-rotate(0deg)' });
  } finally {
    spy.mockRestore();
  }
});
