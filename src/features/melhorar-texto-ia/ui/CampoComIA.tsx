import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { melhorarTextoIa, type ContextoMelhorarTexto } from '../model/melhorarTextoIaService';

// Campo de texto (input ou textarea) com um botao "Melhorar com IA" ao lado do
// rotulo. A sugestao nunca substitui o texto sozinha: o professor ve o antes/depois
// e escolhe Aplicar ou Descartar. Reutilizavel pra nao duplicar os 8 campos de
// texto livre do editor de caso OSCE.

type CampoComIAProps = {
  as?: 'input' | 'textarea';
  campo: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
  contexto?: ContextoMelhorarTexto;
};

const inputClassName =
  'h-8 w-full rounded-md border border-[#d8dee9] bg-white px-3 text-xs text-[#0b1840] outline-none transition-colors focus:border-[#00e5cc]';
const textareaClassName =
  'w-full resize-none rounded-md border border-[#d8dee9] px-3 py-3 text-xs leading-5 text-[#0b1840] outline-none transition-colors focus:border-[#00e5cc]';

export const CampoComIA = ({
  as = 'input',
  campo,
  label,
  required = false,
  value,
  onChange,
  placeholder,
  hint,
  rows,
  contexto,
}: CampoComIAProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sugestao, setSugestao] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  const inputId = `campo-ia-${campo}`;

  const melhorar = async () => {
    setIsLoading(true);
    setErro('');
    setSugestao(null);

    try {
      const textoMelhorado = await melhorarTextoIa(campo, value, contexto);
      setSugestao(textoMelhorado);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível melhorar o texto.');
    } finally {
      setIsLoading(false);
    }
  };

  const aplicar = () => {
    if (sugestao != null) onChange(sugestao);
    setSugestao(null);
  };

  const descartar = () => setSugestao(null);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="flex text-xs font-bold text-[#334155]">
          {label}
          {required ? <span className="ml-1 text-[#e14b4b]">*</span> : null}
        </label>
        <button
          type="button"
          onClick={() => void melhorar()}
          disabled={!value.trim() || isLoading}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#c8d6f8] bg-[#f8f9fc] px-2 py-1 text-[10px] font-bold text-[#185fa5] transition-colors hover:bg-[#e0e8ff] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 size={11} className="animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles size={11} aria-hidden="true" />
          )}
          Melhorar com IA
        </button>
      </div>

      {as === 'textarea' ? (
        <textarea
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={rows ?? 3}
          className={textareaClassName}
        />
      ) : (
        <input
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={inputClassName}
        />
      )}

      {hint ? <span className="mt-1 block text-[10px] text-[#8a9ab8]">{hint}</span> : null}

      {erro ? (
        <p role="alert" className="mt-1 text-[10px] font-bold text-[#a32d2d]">
          {erro}
        </p>
      ) : null}

      {sugestao != null ? (
        <div className="mt-2 rounded-md border border-[#c8d6f8] bg-[#f8f9fc] p-2">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#185fa5]">Sugestão da IA</p>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#0b1840]">{sugestao}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={aplicar}
              className="h-7 rounded-md bg-[#0b1840] px-3 text-[10px] font-bold text-white"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={descartar}
              className="h-7 rounded-md border border-[#d8dee9] px-3 text-[10px] font-bold text-[#4a5578]"
            >
              Descartar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
