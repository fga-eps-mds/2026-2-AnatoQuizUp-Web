import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ResumoAmizade } from '../../../../../src/features/friendship';
import type { ItemInventario, TipoItemLoja } from '../../../../../src/features/loja';
import type { SlotsCosmeticos } from '../../../../../src/shared/ui/profile-identity-card';
import { CardAmigo } from '../../../../../src/pages/amigosAluno/ui/CardAmigo';

const criarCosmetico = (
  tipo: TipoItemLoja,
  dados: Partial<ItemInventario> = {},
): ItemInventario => ({
  id: `item-${tipo.toLowerCase()}`,
  codigo: `codigo-${tipo.toLowerCase()}`,
  nome: `Item ${tipo}`,
  descricao: null,
  tipo,
  precoMoedas: 100,
  valor: null,
  imagemUrl: null,
  previewImagemUrl: null,
  ativo: true,
  ...dados,
});

const amizadeBase: ResumoAmizade = {
  id: 'amizade-1',
  criadoEm: '2026-05-31T12:00:00.000Z',
  atualizadoEm: '2026-05-31T12:00:00.000Z',
  excluidoEm: null,
  usuarioOrigemId: 'aluno-logado',
  usuarioDestinoId: 'aluno-1',
  statusAmizade: 'ATIVO',
  amigo: {
    id: 'aluno-1',
    nome: 'Ana Paula',
    nickname: 'anapaula',
    curso: 'Medicina',
    semestre: '3',
  },
};

const cosmeticosVazios: SlotsCosmeticos = {};

const renderCard = (
  overrides: Partial<{
    amizade: ResumoAmizade;
    cosmeticos: SlotsCosmeticos;
    processando: boolean;
  }> = {},
  handlers: { onVerPerfil?: jest.Mock; onDesfazer?: jest.Mock } = {},
) => {
  const onVerPerfil = handlers.onVerPerfil ?? jest.fn();
  const onDesfazer = handlers.onDesfazer ?? jest.fn();

  return render(
    <CardAmigo
      amizade={overrides.amizade ?? amizadeBase}
      cosmeticos={overrides.cosmeticos ?? cosmeticosVazios}
      processando={overrides.processando ?? false}
      onVerPerfil={onVerPerfil}
      onDesfazer={onDesfazer}
    />,
  );
};

describe('CardAmigo', () => {
  it('renderiza nome e nickname do amigo', () => {
    renderCard();

    expect(screen.getByRole('heading', { level: 4, name: 'Ana Paula' })).toBeInTheDocument();
    expect(screen.getByText('@anapaula')).toBeInTheDocument();
  });

  it('renderiza curso e semestre formatados', () => {
    renderCard();

    expect(screen.getByText('Medicina · 3° semestre')).toBeInTheDocument();
  });

  it('exibe fallback de nickname quando amigo nao tem nickname', () => {
    renderCard({
      amizade: {
        ...amizadeBase,
        amigo: { ...amizadeBase.amigo, nickname: null },
      },
    });

    expect(screen.getByText('Sem nickname')).toBeInTheDocument();
  });

  it('exibe badge de titulo quando equipado', () => {
    renderCard({
      cosmeticos: {
        TITULO: criarCosmetico('TITULO', { nome: 'Mestre dos Ossos' }),
      },
    });

    expect(screen.getByText('Mestre dos Ossos')).toBeInTheDocument();
  });

  it('exibe fallback quando nenhum titulo esta equipado', () => {
    renderCard();

    expect(screen.getByText('Sem título equipado')).toBeInTheDocument();
  });

  it('chama onVerPerfil ao clicar no article', async () => {
    const user = userEvent.setup();
    const onVerPerfil = jest.fn();

    renderCard({}, { onVerPerfil });

    await user.click(screen.getByRole('article'));

    expect(onVerPerfil).toHaveBeenCalledTimes(1);
  });

  it('chama onVerPerfil ao clicar no botao "Ver perfil"', async () => {
    const user = userEvent.setup();
    const onVerPerfil = jest.fn();

    renderCard({}, { onVerPerfil });

    await user.click(screen.getByRole('button', { name: /Ver perfil/i }));

    expect(onVerPerfil).toHaveBeenCalledTimes(1);
  });

  it('chama onDesfazer ao clicar em "Desfazer amizade"', async () => {
    const user = userEvent.setup();
    const onDesfazer = jest.fn();

    renderCard({}, { onDesfazer });

    await user.click(screen.getByRole('button', { name: /Desfazer amizade/i }));

    expect(onDesfazer).toHaveBeenCalledTimes(1);
  });

  it('botao "Desfazer amizade" nao propaga clique para o article', async () => {
    const user = userEvent.setup();
    const onVerPerfil = jest.fn();
    const onDesfazer = jest.fn();

    renderCard({}, { onVerPerfil, onDesfazer });

    await user.click(screen.getByRole('button', { name: /Desfazer amizade/i }));

    expect(onDesfazer).toHaveBeenCalledTimes(1);
    expect(onVerPerfil).not.toHaveBeenCalled();
  });

  it('desabilita botao "Desfazer amizade" quando processando', () => {
    renderCard({ processando: true });

    expect(screen.getByRole('button', { name: /Removendo/i })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Desfazer amizade/i })).not.toBeInTheDocument();
  });

  it('renderiza avatar equipado', () => {
    renderCard({
      cosmeticos: {
        AVATAR: criarCosmetico('AVATAR', {
          nome: 'Avatar Especial',
          imagemUrl: '/avatar-especial.png',
        }),
      },
    });

    expect(screen.getByRole('img', { name: 'Avatar Especial' })).toBeInTheDocument();
  });

  it('exibe cérebro padrão quando sem cosméticos', () => {
    renderCard();

    expect(screen.getByRole('img', { name: 'Avatar de Ana Paula' })).toBeInTheDocument();
  });
});
