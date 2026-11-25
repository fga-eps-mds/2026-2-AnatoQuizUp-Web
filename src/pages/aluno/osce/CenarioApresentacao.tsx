// Etapa de cenario da simulacao OSCE: o aluno le o local, o seu papel e a
// apresentacao do paciente antes de o chat abrir, como na "porta da estacao" de um
// OSCE real. O campo de texto so existe depois de "Iniciar atendimento".
import { ArrowLeft, MapPin, Play, UserRound } from 'lucide-react';

import type { CenarioOsceResumo } from '../../../features/osce/osceService';

type CenarioApresentacaoProps = {
  cenario: CenarioOsceResumo;
  onIniciar: () => void;
  onVoltar: () => void;
};

// Mostrado quando o ChatbotOSCE ainda nao devolve `contextoInicial`.
export const TEXTO_CONTEXTO_PADRAO =
  'O cenário detalhado deste caso ainda não está disponível. Ao iniciar, conduza a anamnese a partir da queixa do título.';

export const CenarioApresentacao = ({ cenario, onIniciar, onVoltar }: CenarioApresentacaoProps) => {
  const contexto = cenario.contextoInicial;

  return (
    <section
      aria-labelledby="osce-cenario-titulo"
      className="flex flex-col gap-5 rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#0D9488]">Cenário do caso</p>
        <h2 id="osce-cenario-titulo" className="text-lg font-black text-[#0A1128]">
          {cenario.titulo}
        </h2>
        <p className="text-xs font-medium text-[#64748B]">
          {cenario.especialidade} · {cenario.dificuldade}
        </p>
      </div>

      {contexto ? (
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex gap-3 rounded-lg bg-[#F8FAFC] p-4">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0D9488]" aria-hidden="true" />
            <div>
              <dt className="text-xs font-bold text-[#64748B]">Local</dt>
              <dd className="text-sm font-semibold text-[#0A1128]">{contexto.local}</dd>
              <dt className="mt-3 text-xs font-bold text-[#64748B]">Seu papel</dt>
              <dd className="text-sm font-semibold text-[#0A1128]">{contexto.papelEstudante}</dd>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg bg-[#F8FAFC] p-4">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[#0D9488]" aria-hidden="true" />
            <div>
              <dt className="text-xs font-bold text-[#64748B]">Paciente</dt>
              <dd className="text-sm font-semibold text-[#0A1128]">
                {contexto.idade} anos, sexo {contexto.sexo.toLowerCase()}
              </dd>
              <dt className="mt-3 text-xs font-bold text-[#64748B]">Queixa</dt>
              <dd className="text-sm font-semibold text-[#0A1128]">{contexto.queixa}</dd>
            </div>
          </div>
        </dl>
      ) : (
        <p className="rounded-lg bg-[#F8FAFC] p-4 text-sm font-medium text-[#64748B]">
          {TEXTO_CONTEXTO_PADRAO}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onVoltar}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-[#64748B] hover:bg-[#F1F5F9]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar
        </button>
        <button
          type="button"
          onClick={onIniciar}
          className="flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-bold text-white hover:brightness-95"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          Iniciar atendimento
        </button>
      </div>
    </section>
  );
};
