// Pagina de personalizacao do perfil do aluno. Mostra o inventario de cosmeticos
// (icones, molduras, avatares, aparencia, titulos e fundos) por aba, permite montar
// uma previa em tempo real e salvar as alteracoes equipando/desequipando cada slot.
// As mudancas ficam "em rascunho" (staged) ate o aluno confirmar o salvamento.
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, Check, Info, Lock, Save, ShoppingBag, X } from 'lucide-react';

import { useAuth } from '../../../../app/providers/AuthProvider';
import { useEquippedCosmeticsStore } from '../../../../features/profile-cosmetics';
import { httpClient } from '../../../../shared/api/httpClient';
import {
  ProfileIdentityCard,
  type SlotsCosmeticos,
} from '../../../../shared/ui/profile-identity-card';
import {
  buscarInventarioCompleto,
  listarCatalogo,
  type InventarioItem,
  type ItemInventario,
  type ItemLoja,
  type TipoItemLoja,
} from '../../../../features/loja';

// Abas de personalizacao. Cada aba agrupa um ou mais tipos de cosmetico (ex.:
// "Aparência" combina ROSTO + CABELO), com rotulo e explicacao.
const ABAS: { id: string; tipos: TipoItemLoja[]; label: string; descricao: string }[] = [
  {
    id: 'ICONE_PERFIL',
    tipos: ['ICONE_PERFIL'],
    label: 'Ícones',
    descricao: 'Selecione um ícone que você já tem — ele aparece no seu avatar.',
  },
  {
    id: 'MOLDURA',
    tipos: ['MOLDURA'],
    label: 'Molduras',
    descricao: 'A moldura é aplicada ao redor do seu ícone de perfil.',
  },
  {
    id: 'AVATAR',
    tipos: ['AVATAR'],
    label: 'Avatares',
    descricao: 'Personagem ilustrado exibido na sua página de perfil.',
  },
  {
    id: 'APARENCIA',
    tipos: ['ROSTO', 'CABELO'],
    label: 'Aparência',
    descricao: 'Combine rosto e cabelo para montar sua aparência.',
  },
  {
    id: 'TITULO',
    tipos: ['TITULO'],
    label: 'Títulos',
    descricao: 'O título escolhido aparece abaixo do seu nome.',
  },
  {
    id: 'PLANO_FUNDO',
    tipos: ['PLANO_FUNDO'],
    label: 'Fundos',
    descricao: 'Aplicado ao topo da sua página de perfil.',
  },
];

const LABEL_TIPO: Partial<Record<TipoItemLoja, string>> = {
  ROSTO: 'Rosto',
  CABELO: 'Cabelo',
};

/** Previa visual de um item ja possuido, especifica por tipo de cosmetico. */
const PreviaItem = ({ tipo, item }: { tipo: TipoItemLoja; item: ItemInventario }) => {
  if (tipo === 'PLANO_FUNDO') {
    return (
      <div
        className="h-20 w-20 rounded-2xl border border-black/5 shadow-inner"
        style={{ background: item.valor || '#e5e7eb' }}
      />
    );
  }

  if (tipo === 'TITULO') {
    return (
      <div className="flex h-16 w-full items-center justify-center rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-500/10 px-2 text-center">
        <span className="text-xs font-black text-[#B45309] uppercase tracking-wide">
          {item.nome}
        </span>
      </div>
    );
  }

  if (tipo === 'MOLDURA') {
    return (
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full p-[5px] shadow-sm"
        style={{ background: item.valor || '#e5e7eb' }}
      >
        <div className="h-full w-full rounded-full bg-gray-100" />
      </div>
    );
  }

  if (tipo === 'ICONE_PERFIL') {
    return (
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl p-4 shadow-inner"
        style={{ background: item.valor || '#0A1128' }}
      >
        {item.previewImagemUrl || item.imagemUrl ? (
          <img
            src={item.previewImagemUrl || item.imagemUrl || undefined}
            alt={item.nome}
            className="h-full w-full object-contain drop-shadow-sm"
          />
        ) : (
          <span className="text-3xl font-black text-white uppercase">{item.nome.charAt(0)}</span>
        )}
      </div>
    );
  }

  // AVATAR, ROSTO e CABELO: imagem completa (mesmo formato de miniatura).
  return (
    <img
      src={item.previewImagemUrl || item.imagemUrl || undefined}
      alt={item.nome}
      className="h-20 w-20 rounded-2xl border border-gray-200 bg-white object-contain p-1 shadow-sm"
    />
  );
};

type GradeDoTipoProps = {
  tipo: TipoItemLoja;
  itensCatalogo: ItemLoja[];
  inventario: InventarioItem[];
  stagedCosmetics: SlotsCosmeticos;
  onSelecionar: (item: ItemInventario) => void;
  onRemover: (tipo: TipoItemLoja) => void;
  onIrParaLoja: () => void;
};

/**
 * Grade de itens de um tipo de cosmetico: opcao "Nenhum (padrao)", itens
 * possuidos (selecionaveis) e itens do catalogo ainda nao adquiridos
 * (bloqueados, com indicacao para ir a loja).
 */
const GradeDoTipo = ({
  tipo,
  itensCatalogo,
  inventario,
  stagedCosmetics,
  onSelecionar,
  onRemover,
  onIrParaLoja,
}: GradeDoTipoProps) => {
  const itensDoTipo = itensCatalogo.filter((item) => item.tipo === tipo);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {/* Opcao "Nenhum (padrao)": desequipa o slot deste tipo. */}
      <button
        type="button"
        onClick={() => onRemover(tipo)}
        className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 bg-white p-4 transition-all ${
          !stagedCosmetics[tipo]
            ? 'border-[#14b8a6] bg-teal-50/30 shadow-[0_0_0_4px_rgba(20,184,166,0.15)]'
            : 'border-gray-100 hover:border-[#14b8a6] hover:shadow-md'
        }`}
      >
        {!stagedCosmetics[tipo] && (
          <div className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#14b8a6] text-white">
            <Check size={14} strokeWidth={3} />
          </div>
        )}
        <div className="flex h-24 w-full items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400">
            <Ban size={28} />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-center text-sm font-black leading-tight text-[#00214d]">
            Nenhum (padrão)
          </span>
          {!stagedCosmetics[tipo] && (
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-teal-600">
              Em uso
            </span>
          )}
        </div>
      </button>

      {itensDoTipo.map((itemCatalogo) => {
        const registroInventario = inventario.find(
          (registro) => registro.item.id === itemCatalogo.id,
        );

        if (!registroInventario) {
          return (
            <button
              key={itemCatalogo.id}
              type="button"
              onClick={onIrParaLoja}
              className="relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 opacity-70 transition-all hover:border-[#F97316]"
            >
              <div className="flex h-24 w-full items-center justify-center">
                <img
                  src={itemCatalogo.previewImagemUrl || itemCatalogo.imagemUrl || undefined}
                  alt={itemCatalogo.nome}
                  className="h-20 w-20 rounded-2xl object-contain grayscale"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-center text-sm font-black leading-tight text-gray-400">
                  {itemCatalogo.nome}
                </span>
                <span className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#F97316]">
                  <Lock size={12} /> Adquira na loja
                </span>
              </div>
            </button>
          );
        }

        const item = registroInventario.item;
        const estaEquipado = stagedCosmetics[tipo]?.id === item.id;

        return (
          <button
            key={registroInventario.id}
            onClick={() => onSelecionar(item)}
            className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 bg-white p-4 transition-all ${
              estaEquipado
                ? 'border-[#14b8a6] bg-teal-50/30 shadow-[0_0_0_4px_rgba(20,184,166,0.15)]'
                : 'border-gray-100 hover:border-[#14b8a6] hover:shadow-md'
            }`}
          >
            {estaEquipado && (
              <div className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#14b8a6] text-white">
                <Check size={14} strokeWidth={3} />
              </div>
            )}

            <div className="flex h-24 w-full items-center justify-center">
              <PreviaItem tipo={tipo} item={item} />
            </div>

            <div className="flex flex-col items-center">
              <span className="text-sm font-black text-[#00214d] text-center leading-tight">
                {item.nome}
              </span>
              {estaEquipado && (
                <span className="mt-1 text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                  Equipado
                </span>
              )}
            </div>
          </button>
        );
      })}

      <button
        onClick={onIrParaLoja}
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-4 text-center transition-all hover:border-[#F97316] hover:bg-orange-50/50"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-[#F97316]">
          <ShoppingBag size={20} />
        </div>
        <span className="text-sm font-black text-[#F97316]">Ver mais na Loja</span>
      </button>
    </div>
  );
};

/**
 * Componente de pagina da personalizacao de perfil. Carrega o inventario e o
 * catalogo, mantem a selecao em rascunho (staged) e sincroniza com a store
 * global ao salvar.
 */
export const PersonalizarPerfilPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Cosmeticos realmente equipados (store global) e o setter para sincroniza-los.
  const cosmeticosEquipados = useEquippedCosmeticsStore((state) => state.cosmeticos);
  const setCosmeticosGlobais = useEquippedCosmeticsStore((state) => state.setCosmeticos);

  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [catalogo, setCatalogo] = useState<ItemLoja[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<string>('ICONE_PERFIL');

  // Selecao em rascunho (ainda nao persistida) e flags de salvamento/sucesso.
  const [stagedCosmetics, setStagedCosmetics] = useState<SlotsCosmeticos>({});
  const [salvando, setSalvando] = useState(false);

  const [modalSucesso, setModalSucesso] = useState(false);

  // Carrega inventario e catalogo ao montar e inicializa tanto a store global
  // quanto o rascunho com os itens atualmente equipados.
  useEffect(() => {
    let ativo = true;
    const fetchDados = async () => {
      try {
        const [itensDoBackend, catalogoResp] = await Promise.all([
          buscarInventarioCompleto(),
          listarCatalogo({ limit: 100 }),
        ]);

        if (ativo) {
          setInventario(itensDoBackend);
          setCatalogo(catalogoResp.dados);

          const equipadosReais: SlotsCosmeticos = {};

          itensDoBackend.forEach((registro) => {
            if (registro.equipado) {
              equipadosReais[registro.item.tipo] = registro.item;
            }
          });

          setCosmeticosGlobais(equipadosReais);
          setStagedCosmetics(equipadosReais);
        }
      } catch (error) {
        console.error('Erro ao carregar inventário', error);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    void fetchDados();
    return () => {
      ativo = false;
    };
  }, [setCosmeticosGlobais]);

  // Ha alteracoes pendentes quando o rascunho difere do que esta de fato equipado.
  const temAlteracoes = useMemo(() => {
    return JSON.stringify(stagedCosmetics) !== JSON.stringify(cosmeticosEquipados);
  }, [stagedCosmetics, cosmeticosEquipados]);

  if (!user) return null;

  const abaInfo = ABAS.find((a) => a.id === abaAtiva)!;
  const irParaLoja = () => navigate('/aluno/loja');

  /**
   * Seleciona um cosmetico para o slot do seu tipo. Avatar e icone de perfil
   * sao mutuamente exclusivos, entao um substitui o outro no rascunho.
   * @param item item do inventario escolhido
   */
  const handleSelectCosmetic = (item: ItemInventario) => {
    setStagedCosmetics((prev) => {
      const novoStage = { ...prev, [item.tipo]: item };
      if (item.tipo === 'AVATAR') delete novoStage.ICONE_PERFIL;
      if (item.tipo === 'ICONE_PERFIL') delete novoStage.AVATAR;
      return novoStage;
    });
  };

  // Remove o cosmetico de um slot no rascunho (volta ao padrao "Nenhum").
  const removerCosmetico = (tipo: TipoItemLoja) => {
    setStagedCosmetics((prev) => {
      const novoStage = { ...prev };
      delete novoStage[tipo];
      return novoStage;
    });
  };

  // Descarta o rascunho, restaurando a selecao para o que esta equipado de fato.
  const descartarAlteracoes = () => {
    setStagedCosmetics(cosmeticosEquipados);
  };

  /**
   * Persiste o rascunho: para cada tipo, compara com o equipado original e
   * dispara equipar (item novo) ou desequipar (item removido). Conflitos 400 ao
   * equipar sao tolerados (slot ja consistente). Ao final, sincroniza a store.
   */
  const salvarAlteracoes = async () => {
    setSalvando(true);
    try {
      const tipos: TipoItemLoja[] = [
        'ICONE_PERFIL',
        'MOLDURA',
        'AVATAR',
        'ROSTO',
        'CABELO',
        'TITULO',
        'PLANO_FUNDO',
      ];

      const operacoes = tipos.map(async (tipo) => {
        const original = cosmeticosEquipados[tipo];
        const staged = stagedCosmetics[tipo];

        // Equipar: há um item novo/diferente selecionado para o slot.
        if (staged && staged.id !== original?.id) {
          try {
            await httpClient.patch('/inventario/equipar', { itemLojaId: staged.id });
          } catch (error) {
            // Correção de lint: aserção de tipo em vez de 'any'
            const err = error as { response?: { status?: number } };
            if (err.response?.status !== 400) {
              throw error;
            }
          }
          return;
        }

        // Desequipar: o slot tinha um item equipado e foi removido (voltar ao padrão).
        if (!staged && original) {
          await httpClient.patch('/inventario/desequipar', { itemLojaId: original.id });
        }
      });

      await Promise.all(operacoes);

      setCosmeticosGlobais(stagedCosmetics);
      setModalSucesso(true);
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar alterações.');
    } finally {
      setSalvando(false);
    }
  };

  // Dados de identidade exibidos na previa (nickname e linha de curso/instituicao).
  const nickname = user.nickname?.trim();
  const cursoLabel =
    [user.course, user.institution].filter(Boolean).join(' · ') || 'Curso não informado';

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <header>
            <h1 className="text-3xl font-black text-[#00214d]">Personalizar Perfil</h1>
            <p className="mt-1 text-sm font-semibold text-gray-500">
              Use seus itens para montar sua identidade
            </p>
          </header>

          {/* Layout: a esquerda a previa fixa; a direita as abas e a grade de itens. */}
          <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
            {/* Coluna de previa: reflete o rascunho em tempo real (somente leitura). */}
            <div className="sticky top-6 flex flex-col gap-4">
              <div className="rounded-2xl bg-white p-1 text-center shadow-sm">
                <span className="mx-auto mt-3 inline-block rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Pré-visualização
                </span>
                <div className="p-2">
                  <ProfileIdentityCard
                    identidade={{
                      nome: user.name,
                      nickname,
                      curso: cursoLabel,
                    }}
                    cosmeticos={stagedCosmetics}
                    tamanho="lg"
                    readOnly={true}
                  />
                </div>
              </div>
              <p className="text-center text-xs font-medium text-gray-400">
                Aqui aparecem só os itens que <b>você já tem</b>. Faltou algum? Vá à{' '}
                <button onClick={irParaLoja} className="font-bold text-[#14b8a6] hover:underline">
                  Loja
                </button>
                .
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-6">
              {/* Seletor de abas, com a contagem de itens possuidos. */}
              <div className="flex flex-wrap gap-2">
                {ABAS.map((aba) => {
                  const isActive = aba.id === abaAtiva;
                  const count = inventario.filter((registro) =>
                    aba.tipos.includes(registro.item.tipo),
                  ).length;
                  return (
                    <button
                      key={aba.id}
                      onClick={() => setAbaAtiva(aba.id)}
                      className={`inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-black transition-colors ${
                        isActive
                          ? 'border-[#0A1128] bg-[#0A1128] text-white'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-[#14b8a6] hover:text-[#0d9488]'
                      }`}
                    >
                      {aba.label}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#00214d]">{abaInfo.label}</h2>
                  <p className="text-sm font-semibold text-gray-500">{abaInfo.descricao}</p>
                </div>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-500">
                  {inventario.filter((registro) => abaInfo.tipos.includes(registro.item.tipo)).length}{' '}
                  que você tem
                </span>
              </div>

              {carregando ? (
                <div className="h-32 animate-pulse rounded-xl bg-gray-200" />
              ) : (
                <div className="flex flex-col gap-6">
                  {abaInfo.tipos.map((tipo) => (
                    <div key={tipo} className="flex flex-col gap-3">
                      {abaInfo.tipos.length > 1 && (
                        <h3 className="text-sm font-black uppercase tracking-wide text-gray-400">
                          {LABEL_TIPO[tipo] ?? tipo}
                        </h3>
                      )}
                      <GradeDoTipo
                        tipo={tipo}
                        itensCatalogo={catalogo}
                        inventario={inventario}
                        stagedCosmetics={stagedCosmetics}
                        onSelecionar={handleSelectCosmetic}
                        onRemover={removerCosmetico}
                        onIrParaLoja={irParaLoja}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Barra de acoes que so aparece quando ha alteracoes pendentes no rascunho. */}
              {temAlteracoes && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
                    <Info size={18} /> Você tem alterações não salvas
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={descartarAlteracoes}
                      disabled={salvando}
                      className="rounded-lg px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={salvarAlteracoes}
                      disabled={salvando}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#14b8a6] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0d9488] disabled:opacity-50"
                    >
                      <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmacao exibido apos salvar com sucesso. */}
      {modalSucesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm transform rounded-3xl bg-white p-8 text-center shadow-2xl transition-all">
            <button
              onClick={() => setModalSucesso(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 shadow-inner">
              <Check size={40} strokeWidth={3.5} />
            </div>

            <h3 className="mb-2 text-2xl font-black text-[#00214d]">Sucesso!</h3>
            <p className="mb-6 text-sm font-semibold text-gray-500">
              Seu perfil foi atualizado e seus novos itens já estão em exibição para os seus amigos.
            </p>

            <button
              onClick={() => setModalSucesso(false)}
              className="w-full rounded-xl bg-[#0A1128] py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#00214d]"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
