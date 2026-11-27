import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Lock, X } from 'lucide-react';
import cabeloLoiro from '../../../shared/assets/avatar/cabelo/cabelo-loiro.png';
import cabeloCacheado from '../../../shared/assets/avatar/cabelo/cabelo-cacheado.png';
import cabeloMoicano from '../../../shared/assets/avatar/cabelo/cabelo-moicano.png';
import acessorioCoroa from '../../../shared/assets/avatar/acessorios/coroa.png';
import acessorioOculos from '../../../shared/assets/avatar/acessorios/oculos.png';
import acessorioChapeuFormatura from '../../../shared/assets/avatar/acessorios/chapeu_formatura.png';
import luvaBoxeIcone from '../../../shared/assets/avatar/luvas/luva-boxe.png';
import luvaCirurgicaIcone from '../../../shared/assets/avatar/luvas/luva-cirurgica.png';
import luvaLaIcone from '../../../shared/assets/avatar/luvas/luva-la.png';
import luvaBoxePosicao from '../../../shared/assets/avatar/luvas/luva-boxe-posicao.png';
import luvaCirurgicaPosicao from '../../../shared/assets/avatar/luvas/luva-cirurgica-posicao.png';
import luvaLaPosicao from '../../../shared/assets/avatar/luvas/luva-la-posicao.png';
import calcadoSapatoPlantaoIcone from '../../../shared/assets/avatar/calcados/sapato-plantao.png';
import calcadoTenisCanoAltoIcone from '../../../shared/assets/avatar/calcados/tenis-cano-alto.png';
import calcadoTenisEsportivoIcone from '../../../shared/assets/avatar/calcados/tenis-esportivo.png';
import calcadoSapatoPlantaoPosicao from '../../../shared/assets/avatar/calcados/sapato-plantao-posicao.png';
import calcadoTenisCanoAltoPosicao from '../../../shared/assets/avatar/calcados/tenis-cano-alto-posicao.png';
import calcadoTenisEsportivoPosicao from '../../../shared/assets/avatar/calcados/tenis-esportivo-posicao.png';
import type {
  AparenciaAvatar,
  CorCerebro,
  EstiloAcessorio,
  EstiloCabelo,
  EstiloCalcado,
  EstiloLuva,
} from './aparencia';
import type { InventarioItem, ItemLoja, TipoItemLoja } from '../../../features/loja';
import {
  normalizarAcessorio,
  normalizarCabelo,
  normalizarCalcado,
  normalizarLuva,
} from '../../../shared/avatar/useAparenciaAvatar';

// Personalizacao de aparencia do avatar-cerebro: cor do cerebro, cabelo, acessorios de
// cabeca + luvas (aba Acessorios) e calcados (aba Calcados). Base liberada com itens
// fixos; os demais entram via loja depois.

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
  { id: 'moicano', label: 'Topete', imagem: cabeloMoicano },
];

// Base liberada da issue #34; os demais acessorios da loja entram depois.
const ACESSORIOS: { id: EstiloAcessorio; label: string; imagem: string }[] = [
  { id: 'coroa', label: 'Coroa', imagem: acessorioCoroa },
  { id: 'oculos', label: 'Óculos', imagem: acessorioOculos },
  { id: 'chapeu-formatura', label: 'Chapéu de formatura', imagem: acessorioChapeuFormatura },
];

// Luvas: `imagem` e o icone usado na grade; `posicao` e o par (mao esquerda + direita)
// ja recortado e posicionado para encaixar nas luvas da arte base, usado no overlay.
// Luvas: `imagem` e o icone usado na grade; `posicao` e o par (mao esquerda + direita)
// ja recortado e posicionado para encaixar nas luvas da arte base, usado no overlay.
const LUVAS: { id: EstiloLuva; label: string; imagem: string; posicao: string }[] = [
  { id: 'luva-boxe', label: 'Luva de boxe', imagem: luvaBoxeIcone, posicao: luvaBoxePosicao },
  { id: 'luva-cirurgica', label: 'Luva cirúrgica', imagem: luvaCirurgicaIcone, posicao: luvaCirurgicaPosicao },
  { id: 'luva-la', label: 'Luva de lã', imagem: luvaLaIcone, posicao: luvaLaPosicao },
];

// Calcados: mesmo esquema das luvas (icone para a grade, par posicionado para o overlay).
// Calcados: mesmo esquema das luvas (icone para a grade, par posicionado para o overlay).
// Os 10 novos calcados de US36 (ver aparencia.ts) entram pela loja/inventario, nao aqui.
const CALCADOS: { id: EstiloCalcado; label: string; imagem: string; posicao: string }[] = [
  { id: 'sapato-plantao', label: 'Sapato de plantão', imagem: calcadoSapatoPlantaoIcone, posicao: calcadoSapatoPlantaoPosicao },
  { id: 'tenis-cano-alto', label: 'Tênis cano alto', imagem: calcadoTenisCanoAltoIcone, posicao: calcadoTenisCanoAltoPosicao },
  { id: 'tenis-esportivo', label: 'Tênis esportivo', imagem: calcadoTenisEsportivoIcone, posicao: calcadoTenisEsportivoPosicao },
];

type OpcaoGrade<T> = { id: T; label: string; imagem: string; bloqueado?: boolean };

/**
 * Monta as opcoes de uma grade: primeiro os itens base (liberados), depois os itens
 * daquele tipo que o aluno comprou e, por fim, os itens do catalogo que ele ainda nao
 * comprou (bloqueados). O `codigo` do item no catalogo e o mesmo id usado no avatar;
 * codigos que o avatar nao sabe desenhar sao ignorados e nada aparece duplicado.
 */
const montarOpcoes = <T extends string>(
  base: OpcaoGrade<T>[],
  comprados: InventarioItem[],
  catalogo: ItemLoja[],
  tipo: TipoItemLoja,
  normalizar: (valor: unknown) => T | null,
): OpcaoGrade<T>[] => {
  const opcoes: OpcaoGrade<T>[] = [...base];
  const adicionar = (item: { codigo: string; nome: string; imagemUrl: string | null; previewImagemUrl: string | null }, bloqueado: boolean) => {
    const id = normalizar(item.codigo);
    if (!id || opcoes.some((opcao) => opcao.id === id)) return;
    const imagem = item.previewImagemUrl ?? item.imagemUrl;
    if (imagem) opcoes.push({ id, label: item.nome, imagem, ...(bloqueado ? { bloqueado } : {}) });
  };
  for (const { item } of comprados) if (item.tipo === tipo) adicionar(item, false);
  for (const item of catalogo) if (item.tipo === tipo && !item.adquirido) adicionar(item, true);
  return opcoes;
};

/** Botao de uma opcao da grade; itens nao comprados aparecem esmaecidos, com cadeado. */
const OpcaoItem = <T extends string>({
  opcao,
  selecionado,
  aoEscolher,
}: {
  opcao: OpcaoGrade<T>;
  selecionado: boolean;
  aoEscolher: () => void;
}) => (
  <button
    type="button"
    aria-label={opcao.bloqueado ? `${opcao.label} (adquira na loja)` : opcao.label}
    aria-pressed={selecionado}
    aria-disabled={opcao.bloqueado ? true : undefined}
    title={opcao.bloqueado ? 'Adquira na loja' : undefined}
    className={`avatar-cabelo-opcao${selecionado ? ' selecionado' : ''}${opcao.bloqueado ? ' bloqueado' : ''}`}
    onClick={aoEscolher}
  >
    <img src={opcao.imagem} alt="" aria-hidden="true" style={{ width: 32, height: 'auto' }} />
    {opcao.bloqueado && (
      <span className="avatar-opcao-cadeado" aria-hidden="true">
        <Lock size={12} />
      </span>
    )}
  </button>
);

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

/** Miniatura do par de luvas (ja posicionado para as duas maos), usado no overlay do preview. */
export const LuvaThumb = ({ estilo }: { estilo: EstiloLuva }) => {
  const item = LUVAS.find((l) => l.id === estilo);
  if (!item) return null;
  return (
    <img src={item.posicao} alt="" aria-hidden="true" style={{ width: '100%', height: 'auto', display: 'block' }} />
  );
};

/** Miniatura do par de calçados (ja posicionado para os dois pes), usado no overlay do preview. */
export const CalcadoThumb = ({ estilo }: { estilo: EstiloCalcado }) => {
  const item = CALCADOS.find((c) => c.id === estilo);
  if (!item) return null;
  return (
    <img src={item.posicao} alt="" aria-hidden="true" style={{ width: '100%', height: 'auto', display: 'block' }} />
  );
};

type AparenciaPanelProps = {
  valor: AparenciaAvatar;
  aoMudar: (aparencia: AparenciaAvatar) => void;
  aoSalvar: () => void;
  aoCancelar: () => void;
  temAlteracoes: boolean;
  /** Inventario do aluno: os cosmeticos de avatar comprados entram nas grades. */
  itensComprados?: InventarioItem[];
  /** Catalogo da loja: os itens de avatar ainda nao comprados aparecem bloqueados. */
  itensLoja?: ItemLoja[];
};

type AbaPersonalizacao = 'aparencia' | 'calcados' | 'acessorios';

/** Painel de personalizacao: abas (Aparência/Calçados/Acessórios) + acoes de salvar/cancelar. */
export const AparenciaPanel = ({
  valor,
  aoMudar,
  aoSalvar,
  aoCancelar,
  temAlteracoes,
  itensComprados = [],
  itensLoja = [],
}: AparenciaPanelProps) => {
  const [aba, setAba] = useState<AbaPersonalizacao>('aparencia');
  // Item bloqueado clicado: nao e equipado, so explica que ele esta na loja.
  const [itemNaLoja, setItemNaLoja] = useState<string | null>(null);

  const escolher = <T extends string>(opcao: OpcaoGrade<T>, aplicar: () => void) => () => {
    if (opcao.bloqueado) {
      setItemNaLoja(opcao.label);
      return;
    }
    setItemNaLoja(null);
    aplicar();
  };
  const cabelos = montarOpcoes(CABELOS, itensComprados, itensLoja, 'CABELO', normalizarCabelo);
  const acessorios = montarOpcoes(ACESSORIOS, itensComprados, itensLoja, 'ACESSORIO', normalizarAcessorio);
  const luvas = montarOpcoes(LUVAS, itensComprados, itensLoja, 'LUVA', normalizarLuva);
  const calcados = montarOpcoes(CALCADOS, itensComprados, itensLoja, 'CALCADO', normalizarCalcado);

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
          aria-selected={aba === 'calcados'}
          className={aba === 'calcados' ? 'active' : ''}
          onClick={() => setAba('calcados')}
        >
          Calçados
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

      {itemNaLoja && (
        <p className="avatar-aviso-loja" role="status">
          <Lock size={14} aria-hidden="true" />
          <span>
            <strong>{itemNaLoja}</strong> ainda não é seu. Ele está disponível na{' '}
            <Link to="/aluno/loja">Loja</Link>.
          </span>
        </p>
      )}

      {aba === 'acessorios' ? (
        <div className="avatar-aparencia-conteudo">
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
              {acessorios.map((opcao) => (
                <OpcaoItem
                  key={opcao.id}
                  opcao={opcao}
                  selecionado={valor.acessorio === opcao.id}
                  aoEscolher={escolher(opcao, () => aoMudar({ ...valor, acessorio: opcao.id }))}
                />
              ))}
            </div>
          </div>

          {/* Slot proprio (independente do acessorio de cabeca acima): da pra usar luvas
              junto com coroa/oculos/chapeu ao mesmo tempo. */}
          <div className="avatar-secao">
            <h3>Luvas</h3>
            <div className="avatar-cabelo-grid">
              <button
                type="button"
                aria-label="Nenhuma"
                aria-pressed={valor.luva === null}
                className={`avatar-cabelo-opcao${valor.luva === null ? ' selecionado' : ''}`}
                onClick={() => aoMudar({ ...valor, luva: null })}
              >
                <X size={20} aria-hidden="true" />
              </button>
              {luvas.map((opcao) => (
                <OpcaoItem
                  key={opcao.id}
                  opcao={opcao}
                  selecionado={valor.luva === opcao.id}
                  aoEscolher={escolher(opcao, () => aoMudar({ ...valor, luva: opcao.id }))}
                />
              ))}
            </div>
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
              {cabelos.map((opcao) => (
                <OpcaoItem
                  key={opcao.id}
                  opcao={opcao}
                  selecionado={valor.cabelo === opcao.id}
                  aoEscolher={escolher(opcao, () => aoMudar({ ...valor, cabelo: opcao.id }))}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="avatar-secao">
          <h3>Calçados</h3>
          <div className="avatar-cabelo-grid">
            <button
              type="button"
              aria-label="Nenhum"
              aria-pressed={valor.calcado === null}
              className={`avatar-cabelo-opcao${valor.calcado === null ? ' selecionado' : ''}`}
              onClick={() => aoMudar({ ...valor, calcado: null })}
            >
              <X size={20} aria-hidden="true" />
            </button>
            {calcados.map((opcao) => (
              <OpcaoItem
                key={opcao.id}
                opcao={opcao}
                selecionado={valor.calcado === opcao.id}
                aoEscolher={escolher(opcao, () => aoMudar({ ...valor, calcado: opcao.id }))}
              />
            ))}
          </div>
        </div>
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
