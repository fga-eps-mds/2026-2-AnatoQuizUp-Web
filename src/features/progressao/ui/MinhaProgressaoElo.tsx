import { AvatarCosmetico } from '../../../shared/ui/profile-identity-card';
import type { SlotsCosmeticos } from '../../profile-cosmetics';
import { formatarDataPrazo, resolverDadosEloProgresso } from '../eloUtils';
import type { EstadoElo, ProgressoNivel } from '../types';
import { AvisoInatividadeBanner } from './AvisoInatividadeBanner';
import { EloIcon } from './EloIcon';

type MinhaProgressaoEloProps = {
  nomeUsuario: string;
  totalAcertos?: number;
  cosmeticos?: SlotsCosmeticos;
  progresso?: ProgressoNivel | null;
  onVerTodosOsElos?: () => void;
  onFazerQuiz?: () => void;
};

const formatar = (valor: number) => valor.toLocaleString('pt-BR');

// Rotulo e cor do estado do elo exibidos no card "Elo atual".
const ESTADO_ELO: Record<EstadoElo, { rotulo: string; cor: string }> = {
  ATIVO: { rotulo: 'ativo', cor: 'text-[#059669]' },
  EM_RISCO: { rotulo: 'em risco', cor: 'text-[#B45309]' },
  REBAIXADO: { rotulo: 'rebaixado', cor: 'text-[#BE123C]' },
};

/**
 * Componente da Tela 2 ("Minha progressão") do Figma.
 * Exibe o card de identidade do aluno com o elo atual, os 4 cartoes de resumo
 * (Elo atual, XP de elo, XP total, Maior elo), a barra de avanco da faixa atual
 * ate o proximo elo (ou topo em Staff do servico) e o bloco "Como seu elo funciona".
 */
export const MinhaProgressaoElo = ({
  nomeUsuario,
  totalAcertos = 0,
  cosmeticos = {},
  progresso,
  onVerTodosOsElos,
  onFazerQuiz,
}: MinhaProgressaoEloProps) => {
  const dados = resolverDadosEloProgresso(progresso);
  const {
    eloAtual,
    maiorElo,
    proximoElo,
    xpTotal,
    xpElo,
    nivel,
    xpFaltanteProximoElo,
    percentualElo,
    estadoElo,
    diasInatividade,
    diasParaAviso,
    prazoRebaixamentoEm,
  } = dados;
  const estado = ESTADO_ELO[estadoElo] ?? ESTADO_ELO.ATIVO;
  const prazo = formatarDataPrazo(prazoRebaixamentoEm);

  return (
    <section aria-label="Minha progressão de elos" className="flex w-full flex-col gap-5">
      {/* Telas 1 a 3: aviso preventivo, elo em risco e elo rebaixado */}
      <AvisoInatividadeBanner
        estadoElo={estadoElo}
        diasInatividade={diasInatividade}
        diasParaAviso={diasParaAviso}
        prazoRebaixamentoEm={prazoRebaixamentoEm}
        eloAtual={eloAtual}
        maiorElo={maiorElo}
        onFazerQuiz={onFazerQuiz}
      />

      {/* Card superior de identidade + badge do elo atual */}
      <article className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#0A1128]/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <AvatarCosmetico
            identidade={{ nome: nomeUsuario }}
            cosmeticos={cosmeticos}
            tamanho="lg"
          />
          <div>
            <h2 className="text-xl font-black text-[#0A1128]">{nomeUsuario}</h2>
            <p className="mt-0.5 text-xs font-semibold text-[#0A1128]/60">
              Nível {nivel} · {formatar(totalAcertos)} acertos no ranking
            </p>
            <p className="mt-1 text-sm font-black text-[#EA580C]">
              Elo atual: {eloAtual.nome}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-[#EFF6FF] px-5 py-3.5 text-[#0A1128]">
            <EloIcon elo={eloAtual.codigo} size={22} />
            <span className="text-sm font-black">{eloAtual.nome}</span>
          </div>
          {onVerTodosOsElos && (
            <button
              type="button"
              onClick={onVerTodosOsElos}
              className="rounded-xl border border-[#0A1128]/15 bg-white px-4 py-2.5 text-xs font-black text-[#0A1128] transition-colors hover:bg-[#F8FAFC]"
            >
              Ver todos os elos
            </button>
          )}
        </div>
      </article>

      {/* Quatro mini-cards: Elo atual, XP de elo, XP total, Maior elo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-[#0A1128]/10 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#0A1128]/55">Elo atual</p>
          <p className="mt-1 text-xl font-black text-[#0A1128]">{eloAtual.nome}</p>
          <p className={`mt-1 text-xs font-bold ${estado.cor}`}>Estado: {estado.rotulo}</p>
          {prazo && estadoElo !== 'ATIVO' && (
            <p className="mt-0.5 text-xs font-medium text-[#0A1128]/50">
              Rebaixamento previsto: {prazo}
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-[#0A1128]/10 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#0A1128]/55">XP de elo</p>
          <p className="mt-1 text-xl font-black tabular-nums text-[#0A1128]">
            {formatar(xpElo)} XP
          </p>
          <p className="mt-1 text-xs font-medium text-[#0A1128]/50">Define o elo atual</p>
        </article>

        <article className="rounded-2xl border border-[#0A1128]/10 bg-green-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#0A1128]/55">XP total</p>
          <p className="mt-1 text-xl font-black tabular-nums text-[#0A1128]">
            {formatar(xpTotal)} XP
          </p>
          <p className="mt-1 text-xs font-medium text-[#0A1128]/50">Histórico acumulado</p>
        </article>

        <article className="rounded-2xl border border-[#0A1128]/10 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#0A1128]/55">Maior elo</p>
          <p className="mt-1 text-xl font-black text-[#0A1128]">{maiorElo.nome}</p>
          <p className="mt-1 text-xs font-medium text-[#0A1128]/50">
            {maiorElo.ordem > eloAtual.ordem ? 'Preservado após o rebaixamento' : 'Conquista preservada'}
          </p>
        </article>
      </div>

      {/* Card da barra de evolucao entre faixas */}
      <article className="rounded-2xl border border-[#0A1128]/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#0A1128]">
              <EloIcon elo={eloAtual.codigo} size={22} />
            </span>
            <div>
              <h3 className="text-lg font-black text-[#0A1128]">
                {proximoElo ? `${eloAtual.nome} → ${proximoElo.nome}` : eloAtual.nome}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-[#0A1128]/60">
                {proximoElo
                  ? `${formatar(xpElo)} XP de elo acumulados. A próxima faixa começa em ${formatar(proximoElo.xpMinimo)} XP.`
                  : `${formatar(xpElo)} XP de elo acumulados. Este é o maior nível de progressão, sem limite máximo.`}
              </p>
            </div>
          </div>

          <div className="text-right">
            {proximoElo ? (
              <>
                <p className="text-base font-black text-[#EA580C]">
                  Faltam {formatar(xpFaltanteProximoElo)} XP
                </p>
                <p className="text-xs font-medium text-[#0A1128]/55">
                  Próximo elo: {proximoElo.nome}
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-black text-[#059669]">Elo máximo alcançado</p>
                <p className="text-xs font-medium text-[#0A1128]/55">Sem próximo elo</p>
              </>
            )}
          </div>
        </div>

        <div
          role="progressbar"
          aria-label={
            proximoElo
              ? `Progresso de ${eloAtual.nome} para ${proximoElo.nome}`
              : `Elo máximo ${eloAtual.nome}`
          }
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentualElo}
          className="mt-5 h-3 w-full overflow-hidden rounded-full bg-[#0A1128]/10"
        >
          <div
            className="h-full rounded-full bg-[#EA580C] transition-all duration-700 ease-out"
            style={{ width: `${percentualElo}%` }}
          />
        </div>

        <p className="mt-2.5 text-xs font-semibold text-[#0A1128]/55">
          {proximoElo
            ? `Faixa atual: ${formatar(eloAtual.xpMinimo)} XP · XP de elo: ${formatar(xpElo)} · Próximo elo: ${formatar(proximoElo.xpMinimo)} XP`
            : `Faixa atual: ${formatar(eloAtual.xpMinimo)} XP · XP de elo: ${formatar(xpElo)} · Sem limite máximo`}
        </p>
      </article>

      {/* Bloco explicativo "Como seu elo funciona" */}
      <article className="rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] p-6">
        <h3 className="text-base font-black text-[#0A1128]">Como seu elo funciona</h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs font-medium text-[#0A1128]/75">
          <li>Quizzes concluídos que concedem XP aumentam o XP total e o XP de elo.</li>
          <li>O elo muda automaticamente ao atingir a próxima faixa; XP excedente permanece.</li>
          <li>
            Ficar muitos dias sem concluir um quiz válido coloca o elo em risco e, depois do prazo,
            reduz um elo por período — o elo Curioso é o piso.
          </li>
          <li>
            O rebaixamento ajusta apenas o XP de elo: o XP total e o maior elo já conquistado nunca
            são reduzidos, e o elo volta sozinho quando o XP de elo alcança a faixa de novo.
          </li>
        </ul>
        <p className="mt-3 text-xs font-semibold text-[#0A1128]/60">
          Seu elo aparece no ranking apenas enquanto seu perfil estiver público.
        </p>
      </article>
    </section>
  );
};

