import { render, screen } from '@testing-library/react';

import { PodiumRanking } from '../../../../../src/features/ranking/ui/PodiumRanking';
import { RankingBoard } from '../../../../../src/features/ranking/ui/RankingBoard';
import { RankingRow } from '../../../../../src/features/ranking/ui/RankingRow';
import type { LinhaRanking } from '../../../../../src/features/ranking/types';

const criarLinha = (over: Partial<LinhaRanking> = {}): LinhaRanking => ({
  posicao: 1,
  id: 'u1',
  nome: 'Ana',
  nickname: 'ana',
  detalhe: null,
  totalAcertos: 5,
  taxaAcerto: 80,
  destaque: false,
  cosmeticos: {},
  ...over,
});

describe('RankingRow', () => {
  test('exibe nome, nickname, acertos e taxa', () => {
    render(<RankingRow linha={criarLinha()} rotuloMetrica="acertos" />);

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('@ana')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  test('mostra XP como metrica principal e o nivel quando o ranking e por XP', () => {
    render(
      <RankingRow
        linha={criarLinha({ pontuacao: 1320, nivel: 5, totalAcertos: 7 })}
        rotuloMetrica="XP"
      />,
    );

    expect(screen.getByText('1.320')).toBeInTheDocument();
    expect(screen.getByText('XP')).toBeInTheDocument();
    expect(screen.getByText('Nível 5')).toBeInTheDocument();
    // O total de acertos deixa de ser o numero em destaque.
    expect(screen.queryByText('7')).not.toBeInTheDocument();
  });

  test('nao mostra nivel nos rankings sem XP (turma e lista)', () => {
    render(<RankingRow linha={criarLinha()} rotuloMetrica="acertos" />);

    expect(screen.queryByText(/Nível/)).not.toBeInTheDocument();
  });

  test('destaca o usuario atual e usa o detalhe quando nao ha nickname', () => {
    render(
      <RankingRow
        linha={criarLinha({ destaque: true, nickname: null, detalhe: 'Medicina' })}
        rotuloMetrica="acertos"
      />,
    );

    expect(screen.getByText('Você')).toBeInTheDocument();
    expect(screen.getByText('Medicina')).toBeInTheDocument();
  });

  test('mostra texto padrao sem nickname e sem detalhe', () => {
    render(
      <RankingRow linha={criarLinha({ nickname: null, detalhe: null })} rotuloMetrica="acertos" />,
    );

    expect(screen.getByText('Sem nickname')).toBeInTheDocument();
  });

  test('aplica estilos das diferentes posicoes sem quebrar', () => {
    [1, 2, 3, 4].forEach((posicao) => {
      const { unmount } = render(
        <RankingRow linha={criarLinha({ id: `u${posicao}`, posicao })} rotuloMetrica="acertos" />,
      );
      unmount();
    });
  });
});

describe('PodiumRanking', () => {
  test('renderiza os tres degraus e a coroa do primeiro', () => {
    const linhas = [
      criarLinha({ posicao: 1, id: 'a', nome: 'Alice Alpha', destaque: true }),
      criarLinha({ posicao: 2, id: 'b', nome: 'Bruno Beta' }),
      criarLinha({ posicao: 3, id: 'c', nome: 'Caio Gama' }),
    ];

    render(<PodiumRanking linhas={linhas} rotuloMetrica="acertos" />);

    expect(screen.getByText('Alice Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bruno Beta')).toBeInTheDocument();
    expect(screen.getByText('Caio Gama')).toBeInTheDocument();
    expect(screen.getByText('1º')).toBeInTheDocument();
  });

  test('retorna nulo quando nao ha primeiro colocado', () => {
    const { container } = render(
      <PodiumRanking linhas={[criarLinha({ posicao: 2 })]} rotuloMetrica="acertos" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe('RankingBoard', () => {
  const props = {
    rotuloMetrica: 'acertos',
    carregando: false,
    erro: null as string | null,
    mensagemVazio: 'Nada por aqui',
  };

  test('mostra esqueleto enquanto carrega', () => {
    const { container } = render(<RankingBoard {...props} linhas={[]} carregando />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  test('mostra mensagem de erro', () => {
    render(<RankingBoard {...props} linhas={[]} erro="deu ruim" />);
    expect(screen.getByText('deu ruim')).toBeInTheDocument();
  });

  test('mostra estado vazio', () => {
    render(<RankingBoard {...props} linhas={[]} />);
    expect(screen.getByText('Nada por aqui')).toBeInTheDocument();
  });

  test('renderiza podio, restantes e a barra do usuario fora da lista', () => {
    const linhas = [
      criarLinha({ posicao: 1, id: 'a', nome: 'A' }),
      criarLinha({ posicao: 2, id: 'b', nome: 'B' }),
      criarLinha({ posicao: 3, id: 'c', nome: 'C' }),
      criarLinha({ posicao: 4, id: 'd', nome: 'Davi' }),
    ];
    const usuarioAtual = criarLinha({ posicao: 42, id: 'me', nome: 'Eu', destaque: true });

    render(<RankingBoard {...props} linhas={linhas} usuarioAtual={usuarioAtual} />);

    expect(screen.getByText('Davi')).toBeInTheDocument();
    expect(screen.getByText('Eu')).toBeInTheDocument();
  });

  test('nao mostra barra extra quando o usuario ja esta na lista', () => {
    const linhas = [criarLinha({ posicao: 1, id: 'me', nome: 'Eu', destaque: true })];
    const usuarioAtual = criarLinha({ posicao: 1, id: 'me', nome: 'Eu', destaque: true });

    render(<RankingBoard {...props} linhas={linhas} usuarioAtual={usuarioAtual} />);

    expect(screen.getAllByText('Eu').length).toBe(1);
  });
});

describe('PodiumRanking por XP', () => {
  test('mostra XP e nivel de cada degrau', () => {
    render(
      <PodiumRanking
        linhas={[
          criarLinha({ posicao: 1, id: 'a', nome: 'Ana', pontuacao: 2500, nivel: 7 }),
          criarLinha({ posicao: 2, id: 'b', nome: 'Bia', pontuacao: 900, nivel: 4 }),
        ]}
        rotuloMetrica="XP"
      />,
    );

    expect(screen.getByText('2.500')).toBeInTheDocument();
    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.getByText('Nível 7')).toBeInTheDocument();
    expect(screen.getByText('Nível 4')).toBeInTheDocument();
  });
});
