// Pagina da Loja Virtual do aluno. Lista o catalogo (itens consumiveis — dicas e
// potencializadores — e cosmeticos: icones, molduras, avatares, titulos e fundos)
// e o inventario ja adquirido, permitindo filtrar por categoria, ordenar por
// preco e comprar itens com as moedas ATP do aluno. Toda compra passa pelo modal
// de confirmacao, e o resultado (sucesso ou saldo insuficiente) aparece em outro modal.
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Backpack,
  BadgeCheck,
  Check,
  Coins,
  Frame,
  LayoutGrid,
  Lock,
  Palette,
  ShoppingBag,
  Smile,
  Lightbulb,
  Sparkles,
  UserRound,
  X,
  Zap,
} from "lucide-react";

import {
  comprarItem,
  listarCatalogo,
  listarInventario,
  usarItem,
} from "../../../../features/loja";
import type {
  InventarioItem,
  ItemLoja,
  TipoItemLoja,
} from "../../../../features/loja";
import { ModalConfirmarCompra } from "../../../../features/loja/ui/ModalConfirmarCompra";
import {
  ModalResultadoCompra,
  type ResultadoCompra,
} from "../../../../features/loja/ui/ModalResultadoCompra";
import { useStudentCoinsStore } from "../../../../features/student-coins/model/useStudentCoinsStore";
import { CosmeticPreview } from "../../../../shared/ui/cosmetics";

// Aba ativa: "Todos", uma categoria especifica de item, ou o inventario do aluno.
type Aba = "TODOS" | TipoItemLoja | "INVENTARIO";
// Sentido de ordenacao por preco (crescente ou decrescente).
type Ordenacao = "asc" | "desc";

// Categorias exibidas no menu de filtros, cada uma com rotulo e icone proprios.
const CATEGORIAS: { key: Aba; label: string; icon: LucideIcon }[] = [
  { key: "TODOS", label: "Todos", icon: LayoutGrid },
  { key: "DICA", label: "Dicas", icon: Lightbulb },
  { key: "POTENCIALIZADOR", label: "Potencializadores", icon: Zap },
  { key: "ICONE_PERFIL", label: "Ícones", icon: Smile },
  { key: "MOLDURA", label: "Molduras", icon: Frame },
  { key: "AVATAR", label: "Avatares", icon: UserRound },
  { key: "TITULO", label: "Títulos", icon: BadgeCheck },
  { key: "PLANO_FUNDO", label: "Fundos", icon: Palette },
  { key: "INVENTARIO", label: "Meu Inventário", icon: Backpack },
];

// Mensagem de erro exibida no banner quando a compra falha por outro motivo
// que nao saldo (ex.: item indisponivel, falha de rede).
type Feedback = { tipo: "erro" | "sucesso"; texto: string };

// O backend responde 422 com esta mensagem quando falta saldo; nesse caso
// mostramos o modal de "Saldo insuficiente" em vez do banner de erro.
const ehErroDeSaldo = (mensagem: string) => /saldo/i.test(mensagem);

/**
 * Etiqueta de preco padronizada (icone de moeda + valor em ATP).
 * @param preco preco do item em moedas ATP
 */
const PrecoEtiqueta = ({ preco }: { preco: number }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F59E0B]/15 px-3 py-1 text-sm font-black text-[#B45309]">
    <Coins size={15} />
    {preco} ATP
  </span>
);

/**
 * Componente raiz da Loja. Carrega catalogo e inventario, controla a aba/ordem
 * selecionadas e o fluxo de compra (modais de confirmacao e de resultado).
 */
export const LojaPage = () => {
  // Saldo de moedas do aluno, lido da store global (compartilhada entre paginas).
  const saldoMoedas = useStudentCoinsStore((estado) => estado.saldoMoedas);
  const setSaldoMoedas = useStudentCoinsStore(
    (estado) => estado.setSaldoMoedas,
  );

  // Catalogo e inventario carregados, com seus estados de carga/erro.
  const [itens, setItens] = useState<ItemLoja[]>([]);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // Filtro de aba, ordenacao por preco e item aberto no modal de confirmacao.
  const [abaAtiva, setAbaAtiva] = useState<Aba>("TODOS");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("asc");
  const [itemSelecionado, setItemSelecionado] = useState<ItemLoja | null>(null);
  const [itemParaUsar, setItemParaUsar] = useState<InventarioItem | null>(null);
  // Id em compra (trava os botoes), resultado da compra (modal), erro e recarga.
  const [comprandoId, setComprandoId] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoCompra | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [recarregar, setRecarregar] = useState(0);

  // Busca catalogo e inventario em paralelo ao montar e a cada pedido de recarga.
  useEffect(() => {
    let ativo = true;

    const buscarDados = async () => {
      setCarregando(true);
      setErro(null);

      try {
        const [catalogo, meuInventario] = await Promise.all([
          listarCatalogo({ limit: 100 }),
          listarInventario({ limit: 100 }),
        ]);

        if (ativo) {
          setItens(catalogo.dados);
          setInventario(meuInventario.dados);
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error ? error.message : "Erro ao carregar a loja.",
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    };

    void buscarDados();

    return () => {
      ativo = false;
    };
  }, [recarregar]);

  // Forca uma nova busca do catalogo/inventario (botao "Tentar novamente").
  const handleTentarNovamente = () => setRecarregar((valor) => valor + 1);

  // Limpa a mensagem de feedback automaticamente apos alguns segundos.
  useEffect(() => {
    if (!feedback) return;

    const temporizador = setTimeout(() => setFeedback(null), 4500);

    return () => clearTimeout(temporizador);
  }, [feedback]);

  // Conta quantos itens existem por tipo, para exibir o numero em cada aba.
  const contagemPorTipo = useMemo(() => {
    const contagem: Record<string, number> = {};

    for (const item of itens) {
      contagem[item.tipo] = (contagem[item.tipo] ?? 0) + 1;
    }

    return contagem;
  }, [itens]);

  // Itens da aba atual ja filtrados por categoria e ordenados pelo preco escolhido.
  const itensVisiveis = useMemo(() => {
    const base =
      abaAtiva === "TODOS"
        ? itens
        : itens.filter((item) => item.tipo === abaAtiva);

    return [...base].sort((a, b) =>
      ordenacao === "asc"
        ? a.precoMoedas - b.precoMoedas
        : b.precoMoedas - a.precoMoedas,
    );
  }, [itens, abaAtiva, ordenacao]);

  /**
   * Clique em "Comprar" no card: sem saldo nem para uma unidade, explica o motivo
   * no modal de saldo insuficiente; caso contrario abre a confirmacao. A compra
   * so e enviada ao backend depois de confirmada.
   * @param item item do catalogo escolhido
   */
  const handleSelecionarItem = (item: ItemLoja) => {
    setFeedback(null);

    if (!item.adquirido && saldoMoedas < item.precoMoedas) {
      setResultado({
        tipo: "saldo-insuficiente",
        item,
        quantidade: 1,
        saldoMoedas,
      });
      return;
    }

    setItemSelecionado(item);
  };

  /**
   * Compra confirmada: envia ao backend e, ao concluir, sincroniza o saldo, o
   * catalogo (adquirido/quantidade) e o inventario, mostrando o modal de sucesso.
   * Falta de saldo vira o modal de saldo insuficiente; outros erros, o banner.
   * @param item item do catalogo a ser comprado
   * @param quantidade unidades escolhidas no modal (1 para cosmeticos)
   */
  const handleConfirmarCompra = async (item: ItemLoja, quantidade: number) => {
    setComprandoId(item.id);
    setFeedback(null);

    try {
      const resposta = await comprarItem(item.id, quantidade);
      const quantidadeTotal = resposta.item.quantidade ?? 1;

      // Sincroniza o saldo retornado e reflete a compra na UI sem novo fetch.
      setSaldoMoedas(resposta.saldoMoedas);
      setItens((anteriores) =>
        anteriores.map((atual) =>
          atual.id === item.id
            ? {
                ...atual,
                adquirido: !atual.consumivel,
                quantidadePossuida: quantidadeTotal,
              }
            : atual,
        ),
      );
      // Consumivel ja possuido: substitui o registro (quantidade nova); senao, adiciona.
      setInventario((anteriores) => [
        resposta.item,
        ...anteriores.filter(
          (registro) => registro.item.id !== resposta.item.item.id,
        ),
      ]);
      setItemSelecionado(null);
      setResultado({
        tipo: "sucesso",
        item,
        quantidade,
        saldoMoedas: resposta.saldoMoedas,
      });
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível comprar o item.";

      setItemSelecionado(null);

      if (ehErroDeSaldo(mensagem)) {
        setResultado({
          tipo: "saldo-insuficiente",
          item,
          quantidade,
          saldoMoedas,
        });
      } else {
        setFeedback({ tipo: "erro", texto: mensagem });
      }
    } finally {
      setComprandoId(null);
    }
  };

  // A ativacao so e oferecida ao Cafe do Foco: os demais consumiveis continuam
  // no inventario ate que seus efeitos tenham uma regra de negocio propria.
  const handleUsarItem = async (registro: InventarioItem) => {
    setComprandoId(registro.item.id);
    setFeedback(null);
    try {
      const resposta = await usarItem(registro.item.id);
      setInventario((anteriores) =>
        anteriores.map((atual) =>
          atual.id === registro.id
            ? { ...atual, quantidade: resposta.quantidadeRestante }
            : atual,
        ),
      );
      setItens((anteriores) =>
        anteriores.map((atual) =>
          atual.id === registro.item.id
            ? { ...atual, quantidadePossuida: resposta.quantidadeRestante }
            : atual,
        ),
      );
      setFeedback({ tipo: "sucesso", texto: resposta.mensagem });
    } catch (error) {
      setFeedback({
        tipo: "erro",
        texto:
          error instanceof Error
            ? error.message
            : "Não foi possível utilizar o item.",
      });
    } finally {
      setComprandoId(null);
      setItemParaUsar(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F97316] text-white">
              <ShoppingBag size={26} />
            </span>
            <div>
              <h1 className="text-2xl font-black text-[#0A1128]">
                Loja Virtual
              </h1>
              <p className="text-sm font-medium text-[#0A1128]/55">
                Use suas moedas ATP para turbinar seus estudos e personalizar o
                seu perfil.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-5 py-3 sm:self-auto">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F59E0B] text-[#0A1128]">
              <Coins size={18} />
            </span>
            <div className="leading-tight">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#0A1128]/50">
                Seu saldo
              </p>
              <p className="text-lg font-black tabular-nums text-[#0A1128]">
                {saldoMoedas} ATP
              </p>
            </div>
          </div>
        </header>

        {/* Retorno de compra ou uso; some sozinho para nao interromper a navegacao. */}
        {feedback && (
          <div
            role="status"
            className={`mt-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${
              feedback.tipo === "sucesso"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.tipo === "sucesso" ? (
              <Check size={18} />
            ) : (
              <X size={18} />
            )}
            {feedback.texto}
          </div>
        )}

        {/* Barra de categorias, cada chip mostra a contagem de itens correspondente. */}
        <nav className="mt-6 flex flex-wrap gap-2">
          {CATEGORIAS.map((categoria) => {
            const Icon = categoria.icon;
            const ativa = abaAtiva === categoria.key;
            const contagem =
              categoria.key === "INVENTARIO"
                ? inventario.length
                : categoria.key === "TODOS"
                  ? itens.length
                  : (contagemPorTipo[categoria.key] ?? 0);

            return (
              <button
                key={categoria.key}
                type="button"
                onClick={() => setAbaAtiva(categoria.key)}
                aria-current={ativa ? "page" : undefined}
                className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
                  ativa
                    ? "bg-[#0A1128] text-white shadow-md"
                    : "border border-[#0A1128]/10 bg-white text-[#0A1128]/70 hover:bg-[#0A1128]/5"
                }`}
              >
                <Icon size={18} />
                {categoria.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-black tabular-nums ${
                    ativa
                      ? "bg-white/20 text-white"
                      : "bg-[#0A1128]/5 text-[#0A1128]/50"
                  }`}
                >
                  {contagem}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Contagem de itens e botao que alterna a ordenacao por preco. */}
        {!carregando &&
          !erro &&
          abaAtiva !== "INVENTARIO" &&
          itensVisiveis.length > 0 && (
            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm font-bold text-[#0A1128]/50">
                {itensVisiveis.length}{" "}
                {itensVisiveis.length === 1 ? "item" : "itens"}
              </p>
              <button
                type="button"
                onClick={() =>
                  setOrdenacao((atual) => (atual === "asc" ? "desc" : "asc"))
                }
                className="flex cursor-pointer items-center gap-2 rounded-full border border-[#0A1128]/10 bg-white px-4 py-2 text-sm font-bold text-[#0A1128]/70 transition-colors hover:bg-[#0A1128]/5"
              >
                {ordenacao === "asc" ? (
                  <ArrowUpNarrowWide size={16} />
                ) : (
                  <ArrowDownWideNarrow size={16} />
                )}
                Preço: {ordenacao === "asc" ? "mais baratos" : "mais caros"}
              </button>
            </div>
          )}

        {/* Area principal: alterna entre carregando, erro, inventario e catalogo. */}
        <section className="mt-6">
          {carregando ? (
            <p className="py-16 text-center text-sm font-bold text-[#0A1128]/40">
              Carregando a loja...
            </p>
          ) : erro ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <p className="text-sm font-bold text-rose-600">{erro}</p>
              <button
                type="button"
                onClick={handleTentarNovamente}
                className="cursor-pointer rounded-full bg-[#0A1128] px-5 py-2 text-sm font-bold text-white"
              >
                Tentar novamente
              </button>
            </div>
          ) : abaAtiva === "INVENTARIO" ? (
            <InventarioGrid
              inventario={inventario}
              usandoId={comprandoId}
              onUsar={(registro) => setItemParaUsar(registro)}
            />
          ) : (
            <CatalogoGrid
              itens={itensVisiveis}
              saldoMoedas={saldoMoedas}
              comprandoId={comprandoId}
              onSelecionar={handleSelecionarItem}
            />
          )}
        </section>
      </div>

      {itemSelecionado && (
        <ModalConfirmarCompra
          item={itemSelecionado}
          saldoMoedas={saldoMoedas}
          comprando={comprandoId === itemSelecionado.id}
          onCancelar={() => setItemSelecionado(null)}
          onConfirmar={(quantidade) =>
            void handleConfirmarCompra(itemSelecionado, quantidade)
          }
        />
      )}

      {resultado && (
        <ModalResultadoCompra
          resultado={resultado}
          onFechar={() => setResultado(null)}
        />
      )}

      {itemParaUsar && (
        <ModalConfirmarUso
          registro={itemParaUsar}
          usando={comprandoId === itemParaUsar.item.id}
          onCancelar={() => setItemParaUsar(null)}
          onConfirmar={() => void handleUsarItem(itemParaUsar)}
        />
      )}
    </div>
  );
};

/**
 * Grade de itens do catalogo. Cada card mostra preview, preco, o efeito (nos
 * consumiveis) e quantas unidades o aluno ja tem. "Comprar" nunca compra direto:
 * abre a confirmacao (ou o aviso de saldo insuficiente, que explica o motivo).
 */
const CatalogoGrid = ({
  itens,
  saldoMoedas,
  comprandoId,
  onSelecionar,
}: {
  itens: ItemLoja[];
  saldoMoedas: number;
  comprandoId: string | null;
  onSelecionar: (item: ItemLoja) => void;
}) => {
  if (itens.length === 0) {
    return (
      <p className="py-16 text-center text-sm font-bold text-[#0A1128]/40">
        Nenhum item disponível nesta categoria.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {itens.map((item) => {
        // Sem saldo para uma unidade: o botao continua clicavel para explicar o motivo.
        const semSaldo = saldoMoedas < item.precoMoedas;
        const quantidadePossuida = item.quantidadePossuida ?? 0;

        return (
          <article
            key={item.id}
            className="relative flex flex-col items-center gap-3 rounded-2xl border border-[#0A1128]/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            {item.consumivel && quantidadePossuida > 0 && (
              <span className="absolute right-3 top-3 rounded-full bg-[#0A1128] px-2 py-0.5 text-xs font-black tabular-nums text-white">
                Você tem {quantidadePossuida}
              </span>
            )}

            <button
              type="button"
              onClick={() => onSelecionar(item)}
              className="flex h-32 cursor-pointer items-center justify-center"
              aria-label={`Pré-visualizar ${item.nome}`}
            >
              <CosmeticPreview item={item} />
            </button>

            <div className="flex w-full flex-1 flex-col items-center gap-2 text-center">
              <h3 className="line-clamp-2 text-sm font-black text-[#0A1128]">
                {item.nome}
              </h3>
              {item.consumivel && item.efeito && (
                <p className="line-clamp-2 text-xs font-medium text-[#0A1128]/55">
                  {item.efeito}
                </p>
              )}
              <PrecoEtiqueta preco={item.precoMoedas} />
            </div>

            {item.adquirido ? (
              <span className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-600">
                <Check size={16} />
                Adquirido
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSelecionar(item)}
                disabled={comprandoId === item.id}
                className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed ${
                  semSaldo
                    ? "bg-[#0A1128]/10 text-[#0A1128]/45 hover:bg-[#0A1128]/15"
                    : "bg-[#F97316] text-white hover:bg-[#ea670c]"
                }`}
              >
                {comprandoId === item.id ? (
                  "Comprando..."
                ) : semSaldo ? (
                  <>
                    <Lock size={15} />
                    Sem saldo
                  </>
                ) : (
                  "Comprar"
                )}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
};

/**
 * Grade do inventario do aluno (itens ja adquiridos). Consumiveis mostram a
 * quantidade possuida; cosmeticos, o selo "Adquirido". Mostra um estado vazio
 * convidando a comprar quando ainda nao ha nenhum item.
 * @param inventario itens que o aluno ja possui
 */
const InventarioGrid = ({
  inventario,
  usandoId,
  onUsar,
}: {
  inventario: InventarioItem[];
  usandoId: string | null;
  onUsar: (registro: InventarioItem) => void;
}) => {
  if (inventario.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <Sparkles size={32} className="text-[#0A1128]/20" />
        <p className="text-sm font-bold text-[#0A1128]/40">
          Você ainda não possui itens. Compre algo na loja!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {inventario.map((registro) => (
        <article
          key={registro.id}
          className="flex flex-col items-center gap-3 rounded-2xl border border-[#0A1128]/10 bg-white p-4 shadow-sm"
        >
          <div className="flex h-32 items-center justify-center">
            <CosmeticPreview item={registro.item} />
          </div>
          <h3 className="line-clamp-2 text-center text-sm font-black text-[#0A1128]">
            {registro.item.nome}
          </h3>
          {registro.item.consumivel ? (
            <>
              <span className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0A1128]/5 px-3 py-2 text-sm font-bold tabular-nums text-[#0A1128]">
                {registro.quantidade ?? 1}{" "}
                {(registro.quantidade ?? 1) === 1 ? "unidade" : "unidades"}
              </span>
              {registro.item.codigo === "potencializador-cafe-do-foco" && (
                <button
                  type="button"
                  disabled={
                    (registro.quantidade ?? 0) < 1 ||
                    usandoId === registro.item.id
                  }
                  onClick={() => onUsar(registro)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#14D5C2] px-3 py-2 text-sm font-bold text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap size={16} />{" "}
                  {usandoId === registro.item.id ? "Ativando..." : "Usar"}
                </button>
              )}
            </>
          ) : (
            <span className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-600">
              <Check size={16} />
              Adquirido
            </span>
          )}
        </article>
      ))}
    </div>
  );
};

const ModalConfirmarUso = ({
  registro,
  usando,
  onCancelar,
  onConfirmar,
}: {
  registro: InventarioItem;
  usando: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
    <div
      role="dialog"
      aria-modal="true"
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#14D5C2]/15 text-[#0E9384]">
        <Zap size={23} />
      </div>
      <h2 className="text-lg font-black text-[#0A1128]">Usar Café do Foco?</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#0A1128]/65">
        Uma unidade será consumida agora. O próximo acerto que conceder ATP
        valerá o dobro.
      </p>
      <p className="mt-3 text-xs font-bold text-[#0A1128]/45">
        Restarão {Math.max(0, (registro.quantidade ?? 0) - 1)} unidades no
        inventário.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          disabled={usando}
          onClick={onCancelar}
          className="rounded-full px-4 py-2 text-sm font-bold text-[#0A1128]/60"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={usando}
          onClick={onConfirmar}
          className="rounded-full bg-[#14D5C2] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {usando ? "Ativando..." : "Confirmar uso"}
        </button>
      </div>
    </div>
  </div>
);
