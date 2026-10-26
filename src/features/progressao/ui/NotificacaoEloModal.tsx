import { PartyPopper, ShieldAlert, TriangleAlert, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { formatarDataPrazo } from '../eloUtils';
import { useNotificacoesEloStore } from '../model/useNotificacoesEloStore';
import { marcarNotificacaoEloLida } from '../progressaoService';
import type { TipoNotificacaoElo } from '../types';
import { EloIcon } from './EloIcon';

// Aparencia por tipo de aviso. ELO_RECUPERADO e a Tela 4 do Figma ("elo recuperado");
// os demais cobrem o ciclo de inatividade (telas 1 a 3).
const APARENCIA: Record<
  TipoNotificacaoElo,
  { fundo: string; borda: string; cor: string; Icone: typeof TriangleAlert; selo: string }
> = {
  AVISO_PREVENTIVO: {
    fundo: 'bg-[#EFF6FF]',
    borda: 'border-[#DBEAFE]',
    cor: 'text-[#1D4ED8]',
    Icone: TriangleAlert,
    selo: 'AVISO PREVENTIVO',
  },
  ELO_EM_RISCO: {
    fundo: 'bg-[#FFFBEB]',
    borda: 'border-[#F59E0B]/35',
    cor: 'text-[#B45309]',
    Icone: TriangleAlert,
    selo: 'ELO EM RISCO',
  },
  VESPERA_REBAIXAMENTO: {
    fundo: 'bg-[#FFF7ED]',
    borda: 'border-[#EA580C]/35',
    cor: 'text-[#C2410C]',
    Icone: TriangleAlert,
    selo: 'ÚLTIMO DIA',
  },
  ELO_REBAIXADO: {
    fundo: 'bg-[#FFF1F2]',
    borda: 'border-[#F43F5E]/35',
    cor: 'text-[#BE123C]',
    Icone: ShieldAlert,
    selo: 'ELO REBAIXADO',
  },
  ELO_RECUPERADO: {
    fundo: 'bg-[#ECFDF5]',
    borda: 'border-[#10B981]/25',
    cor: 'text-[#059669]',
    Icone: PartyPopper,
    selo: 'ELO RECUPERADO',
  },
};

/**
 * Modal global dos avisos de elo. Exibe um aviso por vez a partir da fila da store e,
 * ao fechar, marca o aviso como lido no backend para nao reaparecer.
 *
 * Montado uma unica vez no AuthenticatedLayout, junto do modal de conquistas.
 */
export const NotificacaoEloModal = () => {
  const navigate = useNavigate();
  const notificacao = useNotificacoesEloStore((state) => state.notificacaoAtual);
  const avancarFila = useNotificacoesEloStore((state) => state.avancarFila);

  if (!notificacao) return null;

  const aparencia = APARENCIA[notificacao.tipo] ?? APARENCIA.AVISO_PREVENTIVO;
  const { Icone } = aparencia;
  const prazo = formatarDataPrazo(notificacao.prazoRebaixamentoEm);
  const ehRecuperacao = notificacao.tipo === 'ELO_RECUPERADO';

  // Falhar ao marcar como lido nao deve travar a fila: o aviso volta na proxima carga.
  const fechar = () => {
    void marcarNotificacaoEloLida(notificacao.id).catch(() => undefined);
    avancarFila();
  };

  // `void` porque o navigate do react-router 7 devolve Promise e aqui o retorno e
  // descartado: sem ele a navegacao fica como promessa sem tratamento.
  const irParaProgressao = () => {
    fechar();
    void navigate('/aluno/ranking');
  };

  // Fecha antes de navegar: o modal vive no layout autenticado, entao deixa-lo aberto
  // cobriria a tela de destino (e o aviso continuaria nao lido).
  const irParaQuiz = () => {
    fechar();
    void navigate('/aluno/quiz/escolha');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1128]/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-notificacao-elo"
    >
      <section
        className={`relative w-full max-w-md rounded-2xl border ${aparencia.borda} ${aparencia.fundo} p-6 shadow-xl`}
      >
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar aviso"
          className="absolute right-4 top-4 rounded-lg p-1 text-[#0A1128]/50 transition-colors hover:bg-white/60 hover:text-[#0A1128]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            {notificacao.eloRelacionado ? (
              <EloIcon elo={notificacao.eloRelacionado} size={28} />
            ) : (
              <Icone className={`h-7 w-7 ${aparencia.cor}`} aria-hidden="true" />
            )}
          </span>

          <span className={`mt-4 text-[11px] font-black uppercase tracking-wider ${aparencia.cor}`}>
            {aparencia.selo}
          </span>

          <h2 id="titulo-notificacao-elo" className="mt-1 text-xl font-black text-[#0A1128]">
            {notificacao.titulo}
          </h2>

          <p className="mt-2 text-sm font-medium text-[#0A1128]/75">{notificacao.mensagem}</p>

          {prazo && !ehRecuperacao && (
            <p className="mt-3 rounded-xl bg-white/70 px-4 py-2 text-xs font-black text-[#0A1128]">
              Prazo: {prazo}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={ehRecuperacao ? fechar : irParaQuiz}
              className="rounded-xl bg-[#EA580C] px-6 py-2.5 text-xs font-black text-white shadow-sm transition-colors hover:bg-[#C2410C]"
            >
              {ehRecuperacao ? 'Continuar' : 'Fazer um quiz'}
            </button>
            <button
              type="button"
              onClick={irParaProgressao}
              className="rounded-xl border border-[#0A1128]/15 bg-white px-6 py-2.5 text-xs font-black text-[#0A1128] transition-colors hover:bg-[#F8FAFC]"
            >
              Ver progressão
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
