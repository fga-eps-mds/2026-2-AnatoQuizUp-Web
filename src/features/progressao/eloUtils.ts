import type {
  CodigoEloXp,
  EloJornada,
  EstadoElo,
  FaixaElo,
  ProgressoNivel,
  StatusFaixaElo,
} from './types';

// Faixas padrao de elos espelhadas no frontend para calculo imediato, fallbacks e icones.
// IMPORTANTE: manter sincronizado com FAIXAS_ELO em src/modules/progressao/progressao.constants.ts do Quiz-Service.
export const FAIXAS_ELO_PADRAO: readonly FaixaElo[] = [
  {
    codigo: 'CURIOSO',
    nome: 'Curioso',
    ordem: 1,
    xpMinimo: 0,
    xpMaximo: 499,
    objetivo: 'Primeiros passos na plataforma.',
  },
  {
    codigo: 'ACADEMICO',
    nome: 'Acadêmico',
    ordem: 2,
    xpMinimo: 500,
    xpMaximo: 1499,
    objetivo: 'Participação frequente em quizzes.',
  },
  {
    codigo: 'INTERNO',
    nome: 'Interno',
    ordem: 3,
    xpMinimo: 1500,
    xpMaximo: 2999,
    objetivo: 'Consolidação do aprendizado.',
  },
  {
    codigo: 'R1',
    nome: 'R1',
    ordem: 4,
    xpMinimo: 3000,
    xpMaximo: 5999,
    objetivo: 'Início da progressão avançada.',
  },
  {
    codigo: 'R3',
    nome: 'R3',
    ordem: 5,
    xpMinimo: 6000,
    xpMaximo: 9999,
    objetivo: 'Domínio intermediário.',
  },
  {
    codigo: 'R6',
    nome: 'R6',
    ordem: 6,
    xpMinimo: 10000,
    xpMaximo: 14999,
    objetivo: 'Alto nível de experiência.',
  },
  {
    codigo: 'STAFF_DO_SERVICO',
    nome: 'Staff do serviço',
    ordem: 7,
    xpMinimo: 15000,
    xpMaximo: null,
    objetivo: 'Maior nível de progressão.',
  },
];

export function calcularFaixaEloPorXp(
  xpTotal: number,
  faixas: readonly FaixaElo[] = FAIXAS_ELO_PADRAO,
): FaixaElo {
  const xp = Math.max(0, Math.floor(xpTotal));
  let encontrada = faixas[0];

  for (const faixa of faixas) {
    if (xp >= faixa.xpMinimo) {
      encontrada = faixa;
    } else {
      break;
    }
  }

  return encontrada;
}

export function obterFaixaEloPorNomeOuCodigo(
  identificador?: string | CodigoEloXp | null,
  faixas: readonly FaixaElo[] = FAIXAS_ELO_PADRAO,
): FaixaElo {
  if (!identificador) return faixas[0];
  const normalizado = identificador.trim().toLowerCase();
  return (
    faixas.find(
      (f) => f.codigo.toLowerCase() === normalizado || f.nome.toLowerCase() === normalizado,
    ) ?? faixas[0]
  );
}

function calcularStatusJornada(
  faixa: FaixaElo,
  eloAtual: FaixaElo,
  proximoElo: FaixaElo | null,
  totalFaixas: number,
  maiorElo: FaixaElo,
): StatusFaixaElo {
  if (faixa.ordem < eloAtual.ordem) return 'CONQUISTADO';
  if (faixa.ordem === eloAtual.ordem) return 'ELO_ATUAL';
  if (proximoElo && faixa.ordem === proximoElo.ordem) return 'PROXIMO_ELO';
  // Acima do elo atual mas dentro do recorde: conquistada e perdida por inatividade.
  if (faixa.ordem <= maiorElo.ordem) return 'CONQUISTADO';
  if (faixa.ordem === totalFaixas) return 'ELO_MAXIMO';
  return 'BLOQUEADO';
}

export function montarJornadaElosLocal(
  xpElo: number,
  eloAtual: FaixaElo,
  proximoElo: FaixaElo | null,
  percentualNoEloAtual: number,
  faixas: readonly FaixaElo[] = FAIXAS_ELO_PADRAO,
  maiorElo: FaixaElo = eloAtual,
): EloJornada[] {
  const xp = Math.max(0, Math.floor(xpElo));

  return faixas.map((faixa, idx) => {
    const status = calcularStatusJornada(faixa, eloAtual, proximoElo, faixas.length, maiorElo);
    const conquistado = faixa.ordem < eloAtual.ordem || faixa.ordem <= maiorElo.ordem;
    const ehAtual = faixa.ordem === eloAtual.ordem;
    const anterior = idx > 0 ? faixas[idx - 1] : null;

    let percentual = 0;
    if (ehAtual) {
      percentual = percentualNoEloAtual;
    } else if (conquistado) {
      percentual = 100;
    }

    const xpFaltante = faixa.ordem <= eloAtual.ordem ? 0 : Math.max(0, faixa.xpMinimo - xp);

    return {
      ...faixa,
      status,
      conquistado,
      ehAtual,
      percentual,
      xpFaltante,
      eloAnteriorNome: anterior ? anterior.nome : null,
    };
  });
}

// Dias restantes ate a data limite, nunca negativo (0 = o prazo venceu).
export function diasAtePrazo(prazo?: string | null, agora: Date = new Date()): number | null {
  if (!prazo) return null;
  const limite = new Date(prazo).getTime();
  if (Number.isNaN(limite)) return null;
  return Math.max(0, Math.ceil((limite - agora.getTime()) / (24 * 60 * 60 * 1000)));
}

export function formatarDataPrazo(prazo?: string | null): string | null {
  if (!prazo) return null;
  const data = new Date(prazo);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleDateString('pt-BR');
}

/**
 * Normaliza o objeto de progresso recebido da API garantindo que todos os
 * campos de elo (eloAtual, maiorElo, proximoElo, xpFaltanteProximoElo,
 * percentualElo, todosOsElos) e os de inatividade estejam sempre preenchidos.
 *
 * Desde a US #89 o elo atual vem do backend e PODE ser menor que o maior elo
 * conquistado (rebaixamento por inatividade). O XP de elo tambem passa a ser um saldo
 * proprio: quando o backend nao o envia, o XP total serve de aproximacao.
 */
export function resolverDadosEloProgresso(progresso?: ProgressoNivel | null): {
  xpTotal: number;
  xpElo: number;
  nivel: number;
  eloAtual: FaixaElo;
  maiorElo: FaixaElo;
  proximoElo: FaixaElo | null;
  xpNoElo: number;
  xpNecessarioNoElo: number | null;
  xpFaltanteProximoElo: number;
  percentualElo: number;
  todosOsElos: EloJornada[];
  estadoElo: EstadoElo;
  diasInatividade: number;
  diasParaAviso: number;
  prazoRebaixamentoEm: string | null;
} {
  const xpTotal = Math.max(0, Math.floor(progresso?.xpTotal ?? 0));
  const xpElo = Math.max(0, Math.floor(progresso?.xpElo ?? xpTotal));
  const nivel = progresso?.nivel ?? 1;

  // O elo atual e o que o backend gravou; sem ele, calculamos pelo XP de elo.
  const eloAtual = progresso?.eloAtual ?? calcularFaixaEloPorXp(xpElo);
  const maiorEloInformado = progresso?.maiorElo ?? eloAtual;
  // O recorde nunca pode aparecer abaixo do elo atual.
  const maiorElo = maiorEloInformado.ordem > eloAtual.ordem ? maiorEloInformado : eloAtual;

  const proximoElo =
    progresso?.proximoElo !== undefined
      ? progresso.proximoElo
      : (FAIXAS_ELO_PADRAO.find((f) => f.ordem === eloAtual.ordem + 1) ?? null);

  let xpNoElo = Math.max(0, xpElo - eloAtual.xpMinimo);
  let xpNecessarioNoElo: number | null = null;
  let xpFaltanteProximoElo = 0;
  let percentualElo = 100;

  if (proximoElo) {
    xpNecessarioNoElo = proximoElo.xpMinimo - eloAtual.xpMinimo;
    xpFaltanteProximoElo =
      progresso?.xpFaltanteProximoElo ?? Math.max(0, proximoElo.xpMinimo - xpElo);
    xpNoElo =
      progresso?.xpNoElo ?? Math.max(0, Math.min(xpNecessarioNoElo, xpElo - eloAtual.xpMinimo));
    percentualElo =
      progresso?.percentualElo ??
      (xpNecessarioNoElo > 0 ? Math.min(100, Math.round((xpNoElo / xpNecessarioNoElo) * 100)) : 100);
  }

  const todosOsElos =
    progresso?.todosOsElos && progresso.todosOsElos.length > 0
      ? progresso.todosOsElos
      : montarJornadaElosLocal(xpElo, eloAtual, proximoElo, percentualElo, FAIXAS_ELO_PADRAO, maiorElo);

  return {
    xpTotal,
    xpElo,
    nivel,
    eloAtual,
    maiorElo,
    proximoElo,
    xpNoElo,
    xpNecessarioNoElo,
    xpFaltanteProximoElo,
    percentualElo,
    todosOsElos,
    estadoElo: progresso?.estadoElo ?? 'ATIVO',
    diasInatividade: progresso?.diasInatividade ?? 0,
    // Padrao da US; o valor real vem do backend porque os prazos sao configuraveis.
    diasParaAviso: progresso?.diasParaAviso ?? 7,
    prazoRebaixamentoEm: progresso?.prazoRebaixamentoEm ?? null,
  };
}

