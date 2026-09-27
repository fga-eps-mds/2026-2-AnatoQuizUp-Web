import { useState } from 'react';
import { Check, X } from 'lucide-react';
import cabeloLoiro from '../../../shared/assets/avatar/cabelo/cabelo-loiro.png';
import cabeloCacheado from '../../../shared/assets/avatar/cabelo/cabelo-cacheado.png';
import cabeloMoicano from '../../../shared/assets/avatar/cabelo/cabelo-moicano.png';
import acessorioCoroa from '../../../shared/assets/avatar/acessorios/coroa.png';
import acessorioOculos from '../../../shared/assets/avatar/acessorios/oculos.png';
import acessorioChapeuFormatura from '../../../shared/assets/avatar/acessorios/chapeu_formatura.png';
import type { AparenciaAvatar, CorCerebro, EstiloAcessorio, EstiloCabelo } from './aparencia';

// Personalizacao de aparencia do avatar-cerebro: cor do cerebro, cabelo e acessorios.
// Roupas (issue #33) segue como aba desabilitada, fora de escopo aqui.
// Acessorios (issue #34): base liberada com 3 itens; os demais entram via loja depois.

const CORES: { id: CorCerebro; hex: string; label: string }[] = [
  { id: 'rosa', hex: '#F87171', label: 'Rosa' },
  { id: 'roxo', hex: '#A78BFA', label: 'Roxo' },
  { id: 'azul', hex: '#60A5FA', label: 'Azul' },
  { id: 'verde', hex: '#4ADE80', label: 'Verde' },
  { id: 'laranja', hex: '#FB923C', label: 'Laranja' },
  { id: 'amarelo', hex: '#FDE047', label: 'Amarelo' },
];

const CABELOS: { id: EstiloCabelo; label: string; imagem: string }[] = [
  { id: 'loiro', label: 'Loiro', imagem: cabeloLoiro },
  { id: 'cacheado', label: 'Cacheado', imagem: cabeloCacheado },
  { id: 'moicano', label: 'Moicano', imagem: cabeloMoicano },
];

// Base liberada da issue #34; os demais acessorios da loja entram depois.
const ACESSORIOS: { id: EstiloAcessorio; label: string; imagem: string }[] = [
  { id: 'coroa', label: 'Coroa', imagem: acessorioCoroa },
  { id: 'oculos', label: 'Óculos', imagem: acessorioOculos },
  { id: 'chapeu-formatura', label: 'Chapéu de formatura', imagem: acessorioChapeuFormatura },
];

/** Miniatura do acessorio, usada na grade e no overlay do preview (ver HairThumb). */
export const AccessoryThumb = ({ estilo, size }: { estilo: EstiloAcessorio; size?: number }) => {
  const item = ACESSORIOS.find((a) => a.id === estilo);
  if (!item) return null;
  return (
    <img
      src={item.imagem}
      alt=""
      aria-hidden="true"
      style={size ? { width: size, height: 'auto' } : { width: '100%', height: 'auto', display: 'block' }}
    />
  );
};

/**
 * Miniatura do estilo de cabelo (fundo já removido), usada na grade e no preview.
 * Sem `size`, a imagem preenche 100% do container (usado no overlay do preview,
 * que controla o tamanho via CSS em `.avatar-cabelo-overlay`).
 */
export const HairThumb = ({ estilo, size }: { estilo: EstiloCabelo; size?: number }) => {
  const item = CABELOS.find((c) => c.id === estilo);
  if (!item) return null;
  return (
    <img
      src={item.imagem}
      alt=""
      aria-hidden="true"
      style={size ? { width: size, height: 'auto' } : { width: '100%', height: 'auto', display: 'block' }}
    />
  );
};

type AparenciaPanelProps = {
  valor: AparenciaAvatar;
  aoMudar: (aparencia: AparenciaAvatar) => void;
  aoSalvar: () => void;
  aoCancelar: () => void;
  temAlteracoes: boolean;
};

type AbaPersonalizacao = 'aparencia' | 'roupas' | 'acessorios';

/** Painel de personalizacao: abas (Aparência/Roupas/Acessórios) + acoes de salvar/cancelar. */
export const AparenciaPanel = ({
  valor,
  aoMudar,
  aoSalvar,
  aoCancelar,
  temAlteracoes,
}: AparenciaPanelProps) => {
  const [aba, setAba] = useState<AbaPersonalizacao>('aparencia');

  return (
    <section className="avatar-personalizar-card" aria-label="Personalizar avatar">
      <div className="avatar-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'aparencia'}
          className={aba === 'aparencia' ? 'active' : ''}
          onClick={() => setAba('aparencia')}
        >
          Aparência
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'roupas'}
          className={aba === 'roupas' ? 'active' : ''}
          title="Em breve"
          disabled
          onClick={() => setAba('roupas')}
        >
          Roupas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'acessorios'}
          className={aba === 'acessorios' ? 'active' : ''}
          onClick={() => setAba('acessorios')}
        >
          Acessórios
        </button>
      </div>

      {aba === 'acessorios' ? (
        <div className="avatar-secao">
          <h3>Acessórios</h3>
          <div className="avatar-cabelo-grid">
            <button
              type="button"
              aria-label="Nenhum"
              aria-pressed={valor.acessorio === null}
              className={`avatar-cabelo-opcao${valor.acessorio === null ? ' selecionado' : ''}`}
              onClick={() => aoMudar({ ...valor, acessorio: null })}
            >
              <X size={20} aria-hidden="true" />
            </button>
            {ACESSORIOS.map((acessorio) => (
              <button
                key={acessorio.id}
                type="button"
                aria-label={acessorio.label}
                aria-pressed={valor.acessorio === acessorio.id}
                className={`avatar-cabelo-opcao${valor.acessorio === acessorio.id ? ' selecionado' : ''}`}
                onClick={() => aoMudar({ ...valor, acessorio: acessorio.id })}
              >
                <AccessoryThumb estilo={acessorio.id} size={32} />
              </button>
            ))}
          </div>
        </div>
      ) : aba === 'aparencia' ? (
        <div className="avatar-aparencia-conteudo">
          <div className="avatar-secao">
            <h3>Cor do Cérebro</h3>
            <div className="avatar-cores">
              {CORES.map((cor) => (
                <button
                  key={cor.id}
                  type="button"
                  aria-label={cor.label}
                  aria-pressed={valor.corCerebro === cor.id}
                  className={`avatar-cor-swatch${valor.corCerebro === cor.id ? ' selecionado' : ''}`}
                  style={{ background: cor.hex }}
                  onClick={() => aoMudar({ ...valor, corCerebro: cor.id })}
                />
              ))}
            </div>
          </div>

          <div className="avatar-secao">
            <h3>Cabelo</h3>
            <div className="avatar-cabelo-grid">
              <button
                type="button"
                aria-label="Nenhum"
                aria-pressed={valor.cabelo === null}
                className={`avatar-cabelo-opcao${valor.cabelo === null ? ' selecionado' : ''}`}
                onClick={() => aoMudar({ ...valor, cabelo: null })}
              >
                <X size={20} aria-hidden="true" />
              </button>
              {CABELOS.map((estilo) => (
                <button
                  key={estilo.id}
                  type="button"
                  aria-label={estilo.label}
                  aria-pressed={valor.cabelo === estilo.id}
                  className={`avatar-cabelo-opcao${valor.cabelo === estilo.id ? ' selecionado' : ''}`}
                  onClick={() => aoMudar({ ...valor, cabelo: estilo.id })}
                >
                  <HairThumb estilo={estilo.id} size={32} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="avatar-em-breve">Em breve você poderá personalizar roupas.</p>
      )}

      <div className="avatar-acoes">
        <button
          type="button"
          className="avatar-botao-secundario"
          onClick={aoCancelar}
          disabled={!temAlteracoes}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="avatar-botao-primario"
          onClick={aoSalvar}
          disabled={!temAlteracoes}
        >
          <Check size={16} aria-hidden="true" /> Salvar alterações
        </button>
      </div>
    </section>
  );
};
