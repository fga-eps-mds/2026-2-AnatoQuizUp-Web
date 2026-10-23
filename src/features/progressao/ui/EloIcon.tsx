import { obterFaixaEloPorNomeOuCodigo } from '../eloUtils';
import type { CodigoEloXp } from '../types';

type EloIconProps = {
  elo: CodigoEloXp | string;
  size?: number;
  className?: string;
};

/**
 * Icone vetorial oficial de cada um dos 7 elos do AnatoQuizUp, seguindo os
 * simbolos visuais das telas do Figma:
 * - Curioso: Lupa
 * - Academico: Livro aberto
 * - Interno: Losango com nucleo
 * - R1: Insignia triangular com traco vertical
 * - R3: Insignia de divisa dupla
 * - R6: Escudo com cruz medica
 * - Staff do servico: Coroa
 */
export const EloIcon = ({ elo, size = 22, className = 'text-[#0A1128]' }: EloIconProps) => {
  const faixa = obterFaixaEloPorNomeOuCodigo(elo);

  switch (faixa.codigo) {
    case 'CURIOSO':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={className}
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="20" y1="20" x2="16.2" y2="16.2" />
        </svg>
      );

    case 'ACADEMICO':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={className}
        >
          <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
          <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
        </svg>
      );

    case 'INTERNO':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={className}
        >
          <polygon points="12 2 22 12 12 22 2 12 12 2" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    case 'R1':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={className}
        >
          <polygon points="12 3 21 19 3 19 12 3" />
          <line x1="12" y1="10" x2="12" y2="15" />
        </svg>
      );

    case 'R3':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={className}
        >
          <polygon points="12 3 21 14 12 19 3 14 12 3" />
          <polyline points="6 17 12 21 18 17" />
        </svg>
      );

    case 'R6':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={className}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="14" />
          <line x1="9" y1="11" x2="15" y2="11" />
        </svg>
      );

    case 'STAFF_DO_SERVICO':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={className}
        >
          <path d="m2 6 5 5 5-6 5 6 5-5-2 13H4L2 6Z" />
        </svg>
      );
  }
};

