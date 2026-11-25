// Confirmacao de encerramento da simulacao OSCE, aberta quando o aluno se despede
// no chat. A confirmacao (em vez de encerrar sozinho) evita encerramento acidental;
// ver a observacao da US24. Usa o <dialog> nativo (como o ChatAjudaModal), com
// aria-modal; Esc fecha e o foco entra no modal ao abrir.
import { useEffect, useId, useRef } from 'react';
import { Loader2 } from 'lucide-react';

type ModalConfirmarEncerramentoProps = {
  finalizando: boolean;
  onContinuar: () => void;
  onEncerrar: () => void;
};

export const ModalConfirmarEncerramento = ({
  finalizando,
  onContinuar,
  onEncerrar,
}: ModalConfirmarEncerramentoProps) => {
  const tituloId = useId();
  const descricaoId = useId();
  const continuarRef = useRef<HTMLButtonElement | null>(null);

  // Foco no botao mais seguro ("Continuar"), para Enter acidental nao encerrar.
  useEffect(() => {
    continuarRef.current?.focus();
  }, []);

  // Esc fecha o modal (exceto durante a avaliacao, para nao perder o retorno).
  useEffect(() => {
    const aoPressionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && !finalizando) onContinuar();
    };

    window.addEventListener('keydown', aoPressionarTecla);
    return () => window.removeEventListener('keydown', aoPressionarTecla);
  }, [finalizando, onContinuar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      // Clique no fundo escurecido (fora da caixa) equivale a continuar.
      data-testid="osce-encerramento-overlay"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !finalizando) onContinuar();
      }}
    >
      <dialog
        open
        className="relative m-0 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descricaoId}
      >
        <h2 id={tituloId} className="text-lg font-black text-[#0A1128]">
          Encerrar e ver avaliação?
        </h2>
        <p id={descricaoId} className="mt-2 text-sm font-medium text-[#64748B]">
          A conversa será enviada ao examinador e não poderá mais ser continuada.
        </p>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            ref={continuarRef}
            type="button"
            onClick={onContinuar}
            disabled={finalizando}
            className="rounded-lg px-4 py-2 text-sm font-bold text-[#0A1128] hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuar atendimento
          </button>
          <button
            type="button"
            onClick={onEncerrar}
            disabled={finalizando}
            className="flex items-center gap-1.5 rounded-lg bg-[#0A1128] px-4 py-2 text-sm font-bold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {finalizando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Encerrar
          </button>
        </div>
      </dialog>
    </div>
  );
};
