import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ItemInventario, TipoItemLoja } from '../../../../../src/features/loja';
import { ProfileIdentityCard } from '../../../../../src/shared/ui/profile-identity-card';

const criarItem = (
  tipo: TipoItemLoja,
  overrides: Partial<ItemInventario> = {},
): ItemInventario => ({
  id: `item-${tipo.toLowerCase()}`,
  codigo: `codigo-${tipo.toLowerCase()}`,
  nome: tipo,
  descricao: null,
  tipo,
  precoMoedas: 100,
  valor: null,
  imagemUrl: null,
  previewImagemUrl: null,
  ativo: true,
  ...overrides,
});

const identidade = {
  nome: 'João Silva',
};

describe('ProfileIdentityCard', () => {
  it('renderiza somente circulo com iniciais no tamanho sm', () => {
    render(<ProfileIdentityCard identidade={identidade} tamanho="sm" />);

    expect(screen.getByText('JS')).toBeInTheDocument();
    expect(screen.queryByLabelText('Plano de fundo do perfil')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'João Silva' })).not.toBeInTheDocument();
  });

  it('renderiza titulo abaixo do circulo no tamanho sm', () => {
    const titulo = criarItem('TITULO', { nome: 'Mestre da Anatomia' });

    render(
      <ProfileIdentityCard
        identidade={identidade}
        tamanho="sm"
        cosmeticos={{ TITULO: titulo }}
      />,
    );

    expect(screen.getByText('Mestre da Anatomia')).toBeInTheDocument();
  });

  it('renderiza card md com banner, iniciais e nome', () => {
    render(<ProfileIdentityCard identidade={identidade} />);

    expect(screen.getByLabelText('Plano de fundo do perfil')).toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'João Silva' })).toBeInTheDocument();
    expect(screen.queryByText(/^@/)).not.toBeInTheDocument();
  });

  it('renderiza nickname, curso e titulo no card completo', () => {
    const titulo = criarItem('TITULO', { nome: 'Veterano' });

    render(
      <ProfileIdentityCard
        identidade={{ nome: 'João Silva', nickname: 'joao', curso: 'Medicina' }}
        cosmeticos={{ TITULO: titulo }}
      />,
    );

    expect(screen.getByText('@joao')).toBeInTheDocument();
    expect(screen.getByText('Medicina')).toBeInTheDocument();
    expect(screen.getByText('Veterano')).toBeInTheDocument();
  });

  it('aplica plano de fundo e moldura equipados', () => {
    const fundo = criarItem('PLANO_FUNDO', { nome: 'Oceano', valor: '#123456' });
    const moldura = criarItem('MOLDURA', { nome: 'Dourada', valor: '#FCD34D' });

    render(
      <ProfileIdentityCard
        identidade={identidade}
        cosmeticos={{ PLANO_FUNDO: fundo, MOLDURA: moldura }}
      />,
    );

    expect(screen.getByLabelText('Plano de fundo do perfil')).toHaveStyle({
      background: '#123456',
    });
    expect(screen.getByLabelText('Moldura Dourada')).toHaveStyle({
      background: '#FCD34D',
    });
  });

  it('prioriza avatar quando avatar e icone estao equipados', () => {
    const avatar = criarItem('AVATAR', { nome: 'Avatar Coruja', imagemUrl: '/avatar.png' });
    const icone = criarItem('ICONE_PERFIL', {
      nome: 'Icone Cerebro',
      imagemUrl: '/icone.png',
    });

    render(
      <ProfileIdentityCard
        identidade={identidade}
        cosmeticos={{ AVATAR: avatar, ICONE_PERFIL: icone }}
      />,
    );

    expect(screen.getByRole('img', { name: 'Avatar Coruja' })).toHaveAttribute(
      'src',
      '/avatar.png',
    );
    expect(screen.queryByRole('img', { name: 'Icone Cerebro' })).not.toBeInTheDocument();
  });

  it('compoe rosto e cabelo quando nao ha avatar nem icone equipados', () => {
    const rosto = criarItem('ROSTO', { nome: 'Rosto Padrão', imagemUrl: '/rosto.png' });
    const cabelo = criarItem('CABELO', { nome: 'Moicano', imagemUrl: '/cabelo.png' });

    render(
      <ProfileIdentityCard
        identidade={identidade}
        cosmeticos={{ ROSTO: rosto, CABELO: cabelo }}
      />,
    );

    expect(screen.getByRole('img', { name: 'Rosto Padrão' })).toHaveAttribute('src', '/rosto.png');
    expect(screen.getByRole('img', { name: 'Moicano' })).toHaveAttribute('src', '/cabelo.png');
  });

  it('prioriza icone sobre rosto/cabelo quando ambos estao equipados', () => {
    const icone = criarItem('ICONE_PERFIL', { nome: 'Icone Cerebro', imagemUrl: '/icone.png' });
    const rosto = criarItem('ROSTO', { nome: 'Rosto Padrão', imagemUrl: '/rosto.png' });

    render(
      <ProfileIdentityCard
        identidade={identidade}
        cosmeticos={{ ICONE_PERFIL: icone, ROSTO: rosto }}
      />,
    );

    expect(screen.getByRole('img', { name: 'Icone Cerebro' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Rosto Padrão' })).not.toBeInTheDocument();
  });

  it('renderiza icone de perfil quando nao ha avatar', () => {
    const icone = criarItem('ICONE_PERFIL', {
      nome: 'Icone Cerebro',
      imagemUrl: '/icone.png',
      valor: '#0A1128',
    });

    render(
      <ProfileIdentityCard identidade={identidade} cosmeticos={{ ICONE_PERFIL: icone }} />,
    );

    expect(screen.getByRole('img', { name: 'Icone Cerebro' })).toHaveAttribute(
      'src',
      '/icone.png',
    );
  });

  it('renderiza o logo premium quando equipado', () => {
    const iconePremium = criarItem('ICONE_PERFIL', {
      codigo: 'icone-anatoquiz-dourado',
      nome: 'AnatoQuiz Dourado',
    });

    render(
      <ProfileIdentityCard
        identidade={identidade}
        cosmeticos={{ ICONE_PERFIL: iconePremium }}
      />,
    );

    expect(screen.getByRole('img', { name: 'AnatoQuiz Dourado' })).toBeInTheDocument();
  });

  it('renderiza card completo no tamanho lg', () => {
    render(<ProfileIdentityCard identidade={identidade} tamanho="lg" />);

    expect(screen.getByLabelText('Plano de fundo do perfil')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'João Silva' })).toBeInTheDocument();
  });

  it('exibe e aciona personalizacao quando o card e editavel', async () => {
    const onPersonalizar = jest.fn();
    const user = userEvent.setup();

    render(
      <ProfileIdentityCard
        identidade={identidade}
        readOnly={false}
        onPersonalizar={onPersonalizar}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Personalizar perfil' }));

    expect(onPersonalizar).toHaveBeenCalledTimes(1);
  });

  it('nao exibe personalizacao quando o card e somente leitura', () => {
    render(<ProfileIdentityCard identidade={identidade} onPersonalizar={jest.fn()} />);

    expect(
      screen.queryByRole('button', { name: 'Personalizar perfil' }),
    ).not.toBeInTheDocument();
  });

  it('exibe email quando a prop email e fornecida e readOnly e false', () => {
    render(
      <ProfileIdentityCard
        identidade={identidade}
        email="joao@example.com"
        readOnly={false}
      />,
    );

    expect(screen.getByText('joao@example.com')).toBeInTheDocument();
  });

  it('exibe saldo quando a prop saldo e fornecida e readOnly e false', () => {
    render(
      <ProfileIdentityCard
        identidade={identidade}
        saldo="1.240 ATP"
        readOnly={false}
      />,
    );

    expect(screen.getByText('1.240 ATP')).toBeInTheDocument();
  });

  it('exibe e aciona botao de editar quando onEditar e fornecido e readOnly e false', async () => {
    const onEditar = jest.fn();
    const user = userEvent.setup();

    render(
      <ProfileIdentityCard
        identidade={identidade}
        readOnly={false}
        onEditar={onEditar}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Editar informações/i }));

    expect(onEditar).toHaveBeenCalledTimes(1);
  });

  it('nao exibe email, saldo ou editar quando readOnly e true', () => {
    render(
      <ProfileIdentityCard
        identidade={identidade}
        email="joao@example.com"
        saldo="1.240 ATP"
        onEditar={jest.fn()}
        readOnly={true}
      />,
    );

    expect(screen.queryByText('joao@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('1.240 ATP')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Editar informações/i }),
    ).not.toBeInTheDocument();
  });

  it('exibe chip de fundo no banner quando fundo equipado e readOnly e false', () => {
    const fundo = criarItem('PLANO_FUNDO', { nome: 'Textura Anatomica', valor: '#123456' });

    render(
      <ProfileIdentityCard
        identidade={identidade}
        cosmeticos={{ PLANO_FUNDO: fundo }}
        readOnly={false}
      />,
    );

    expect(screen.getByText('Fundo: Textura Anatomica')).toBeInTheDocument();
  });

  it('nao exibe chip de fundo quando readOnly e true', () => {
    const fundo = criarItem('PLANO_FUNDO', { nome: 'Textura Anatomica', valor: '#123456' });

    render(
      <ProfileIdentityCard
        identidade={identidade}
        cosmeticos={{ PLANO_FUNDO: fundo }}
        readOnly={true}
      />,
    );

    expect(screen.queryByText('Fundo: Textura Anatomica')).not.toBeInTheDocument();
  });
});
