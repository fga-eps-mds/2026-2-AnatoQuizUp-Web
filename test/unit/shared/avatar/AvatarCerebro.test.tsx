import { render, screen } from '@testing-library/react';

import { AvatarCerebro } from '../../../../src/shared/avatar/AvatarCerebro';
import { APARENCIA_PADRAO } from '../../../../src/shared/avatar/aparencia';

const camadas = (container: HTMLElement) => container.querySelectorAll('img[aria-hidden="true"]');

describe('AvatarCerebro - itens equipados', () => {
  it('desenha só o cérebro quando nenhum item está equipado', () => {
    const { container } = render(<AvatarCerebro aparencia={APARENCIA_PADRAO} nome="Ana" />);

    expect(camadas(container)).toHaveLength(0);
  });

  it('equipa cabelo, acessório, luva e calçado novos ao mesmo tempo, cada um na sua camada', () => {
    const { container } = render(
      <AvatarCerebro
        nome="Ana"
        aparencia={{
          ...APARENCIA_PADRAO,
          cabelo: 'trancas',
          acessorio: 'chapeu-cowboy',
          luva: 'luva-goleiro',
          calcado: 'bota-coturno',
        }}
      />,
    );

    const imagens = Array.from(camadas(container)) as HTMLImageElement[];
    expect(imagens).toHaveLength(4);
    // cabelo (2) abaixo do chapeu (3); calcado (1) atras da luva (3)
    expect(imagens.map((img) => img.style.zIndex)).toEqual(['2', '3', '1', '3']);
  });

  it('mantém o acessório de rosto abaixo do cabelo', () => {
    const { container } = render(
      <AvatarCerebro nome="Ana" aparencia={{ ...APARENCIA_PADRAO, cabelo: 'trancas', acessorio: 'oculos-sol' }} />,
    );

    const [cabelo, acessorio] = Array.from(camadas(container)) as HTMLImageElement[];
    expect(Number(acessorio.style.zIndex)).toBeLessThan(Number(cabelo.style.zIndex));
  });

  it('usa o fundo equipado atrás do cérebro', () => {
    render(<AvatarCerebro aparencia={APARENCIA_PADRAO} nome="Ana" fundo="#123456" />);

    const circulo = screen.getByRole('img', { name: 'Avatar de Ana' }).parentElement!;
    expect(circulo).toHaveStyle({ background: '#123456' });
    expect(circulo).toHaveAttribute('data-fundo', 'personalizado');
  });

  it('mantém o fundo padrão sem fundo equipado', () => {
    render(<AvatarCerebro aparencia={APARENCIA_PADRAO} nome="Ana" fundo={null} />);

    const circulo = screen.getByRole('img', { name: 'Avatar de Ana' }).parentElement!;
    expect(circulo).not.toHaveAttribute('style');
    expect(circulo).toHaveAttribute('data-fundo', 'padrao');
  });
});
