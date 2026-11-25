// Um turno do chat da simulacao OSCE. Falas do aluno e do paciente sao baloes; os
// pedidos de exame (US25) viram cards a parte, porque o resultado vem do cadastro do
// caso e nao da fala do paciente.
import { FlaskConical, Info } from 'lucide-react';

import type { TurnoOsce } from '../../../features/osce/osceService';
import { renderizarTextoComNegrito } from '../../../shared/utils/textoComNegrito';

type TurnoChatOsceProps = {
  turno: TurnoOsce;
};

export const TurnoChatOsce = ({ turno }: TurnoChatOsceProps) => {
  if (turno.autor === 'exame') {
    return (
      <li className="flex justify-center">
        <section
          aria-label={`Resultado de exame: ${turno.exame}`}
          className="w-full max-w-[85%] rounded-lg border border-sky-200 bg-sky-50 p-3"
        >
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-sky-800">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            Resultado de exame · {turno.exame}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-[#0A1128]">
            {turno.texto}
          </p>
        </section>
      </li>
    );
  }

  if (turno.autor === 'indisponivel') {
    return (
      <li className="flex justify-center">
        <p className="flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-3 py-1.5 text-xs font-bold text-[#64748B]">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          {turno.exame}: não disponível neste caso
        </p>
      </li>
    );
  }

  const doAluno = turno.autor === 'aluno';
  return (
    <li className={`flex flex-col gap-1.5 ${doAluno ? 'items-end' : 'items-start'}`}>
      <p
        className={
          doAluno
            ? 'max-w-[85%] rounded-lg bg-[#0D9488] px-3 py-2 text-sm font-medium text-white'
            : 'max-w-[85%] whitespace-pre-wrap rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm font-medium leading-relaxed text-[#0A1128]/80'
        }
      >
        {renderizarTextoComNegrito(turno.texto)}
      </p>
    </li>
  );
};
