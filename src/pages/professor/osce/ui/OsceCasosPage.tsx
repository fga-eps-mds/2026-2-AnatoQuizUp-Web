import { Edit2, Loader2, Plus, Stethoscope, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { excluirCasoOsce, listarCasosOsce } from '../../../../features/manage-casos-osce/model/casoOsceService';
import type { CasoOsce, CasoOsceDificuldade } from '../../../../features/manage-casos-osce/model/types';

// Pagina "Casos OSCE" do professor (US26): lista os casos cadastrados. Criar e
// editar um caso abrem a pagina do editor em 4 passos (CasoOsceEditorPage), nas
// rotas /professor/osce/novo e /professor/osce/:id/editar.

const dificuldadeStyles: Record<CasoOsceDificuldade, string> = {
  FACIL: 'bg-[#e1f5ee] text-[#0b6b5a]',
  MEDIA: 'bg-[#f7ecd8] text-[#633806]',
  DIFICIL: 'bg-[#fef0f0] text-[#a32d2d]',
};

const dificuldadeRotulo: Record<CasoOsceDificuldade, string> = {
  FACIL: 'Fácil',
  MEDIA: 'Médio',
  DIFICIL: 'Difícil',
};

type ModalExcluirCasoOsceProps = {
  caso: CasoOsce;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// Confirmacao de exclusao: tentativas dos alunos nao sao apagadas (soft delete no Quiz-Service).
const ModalExcluirCasoOsce = ({ caso, isDeleting, onCancel, onConfirm }: ModalExcluirCasoOsceProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1840]/40 px-4 py-6">
    <dialog
      open
      aria-labelledby="excluir-caso-osce-title"
      className="m-0 w-full max-w-[420px] rounded-xl border-0 bg-white p-6 shadow-2xl"
    >
      <h2 id="excluir-caso-osce-title" className="text-base font-bold text-[#0b1840]">
        Excluir o caso &quot;{caso.titulo || 'Sem título'}&quot;?
      </h2>
      <p className="mt-2 text-xs leading-5 text-[#64748b]">
        As tentativas dos alunos são preservadas. Esta ação não pode ser desfeita.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="h-8 rounded-md border border-[#d8dee9] px-4 text-xs font-bold text-[#4a5578] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#a32d2d] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Trash2 size={13} aria-hidden="true" />}
          {isDeleting ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </dialog>
  </div>
);

export const OsceCasosPage = () => {
  const navigate = useNavigate();
  const [casos, setCasos] = useState<CasoOsce[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [casoParaExcluir, setCasoParaExcluir] = useState<CasoOsce | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCasos = async () => {
      try {
        const loadedCasos = await listarCasosOsce();
        if (isMounted) setCasos(loadedCasos);
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os casos.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadCasos();

    return () => {
      isMounted = false;
    };
  }, []);

  const confirmarExclusao = async () => {
    if (!casoParaExcluir) return;

    setIsDeleting(true);
    setError('');

    try {
      await excluirCasoOsce(casoParaExcluir.id);
      setCasos((currentCasos) => currentCasos.filter((item) => item.id !== casoParaExcluir.id));
      setCasoParaExcluir(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir o caso.');
    } finally {
      setIsDeleting(false);
    }
  };

  const publicados = casos.filter((caso) => caso.status === 'PUBLICADO').length;

  let conteudoCasos;
  if (isLoading) {
    conteudoCasos = (
      <section className="flex min-h-[338px] items-center justify-center rounded-xl border border-[#e0e5ef] bg-white text-sm font-bold text-[#4a5578]">
        Carregando casos...
      </section>
    );
  } else if (casos.length === 0) {
    conteudoCasos = (
      <section className="flex min-h-[338px] w-full items-center justify-center rounded-xl border border-[#e0e5ef] bg-white px-6 py-10 text-center">
        <div className="flex max-w-[300px] flex-col items-center">
          <Stethoscope size={34} className="mb-4 text-[#0b1840]" aria-hidden="true" />
          <h2 className="text-base font-bold text-[#0b1840]">Nenhum caso cadastrado</h2>
          <p className="mt-3 text-xs leading-5 text-[#8a9ab8]">
            Cadastre o primeiro caso clínico da simulação OSCE.
          </p>
        </div>
      </section>
    );
  } else {
    conteudoCasos = (
      <section className="w-full overflow-hidden rounded-xl border border-[#e0e5ef] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="bg-[#f8f9fc]">
              <tr className="border-b border-[#e8eaf2]">
                {['Título', 'Especialidade', 'Dificuldade', 'Status', 'Ações'].map((heading) => (
                  <th key={heading} scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.06em] text-[#8a9ab8]">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {casos.map((caso) => (
                <tr key={caso.id} className="border-b border-[#f2f4f8] last:border-b-0">
                  <td className="max-w-[260px] px-4 py-4 text-xs text-[#4a5578]">
                    {caso.titulo || <span className="italic text-[#aaaabb]">Sem título</span>}
                  </td>
                  <td className="px-4 py-4 text-[11px] text-[#4a5578]">{caso.especialidade || '—'}</td>
                  <td className="px-4 py-4 align-top">
                    {caso.dificuldade ? (
                      <span className={`inline-flex w-fit items-center rounded px-2 py-1 text-[10px] font-bold ${dificuldadeStyles[caso.dificuldade]}`}>
                        {dificuldadeRotulo[caso.dificuldade]}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-4 text-[11px] text-[#8a9ab8]">
                    {caso.status === 'PUBLICADO' ? 'Publicado' : 'Rascunho'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/professor/osce/${caso.id}/editar`)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#c8d6f8] bg-[#f8f9fc] px-3 py-2 text-[11px] font-bold text-[#185fa5] transition-colors hover:bg-[#e0e8ff]"
                      >
                        <Edit2 size={12} aria-hidden="true" />
                        {caso.status === 'PUBLICADO' ? 'Ver' : 'Continuar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCasoParaExcluir(caso)}
                        aria-label={`Excluir caso ${caso.titulo || 'sem título'}`}
                        title="Excluir"
                        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#f7c1c1] text-[#a32d2d] transition-colors hover:bg-[#fef0f0]"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f3f6fb]">
      <header className="flex items-center justify-between gap-4 border-b border-[#e1f5ee] bg-white px-5 py-3">
        <div>
          <h1 className="text-base font-bold text-[#0b1840]">Casos OSCE</h1>
          <p className="text-[11px] text-[#8a9ab8]">Cadastre os casos clínicos da simulação OSCE</p>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col gap-4 overflow-auto px-5 py-4">
        {error ? (
          <div role="alert" className="rounded-lg border border-[#f7c1c1] bg-[#fef0f0] px-4 py-3 text-sm font-bold text-[#a32d2d]">
            {error}
          </div>
        ) : null}

        <section className="flex w-full flex-col gap-4 rounded-xl border border-[#e0e5ef] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0b1840]">Seus casos</h2>
            <p className="text-xs text-[#8a9ab8]">
              {casos.length > 0
                ? `${casos.length} caso(s) · ${publicados} publicado(s)`
                : 'Nenhum caso cadastrado ainda'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/professor/osce/novo')}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#00e5cc] px-5 py-3 text-xs font-bold text-[#0b1840] transition-colors hover:brightness-95"
          >
            <Plus size={15} aria-hidden="true" />
            Novo caso
          </button>
        </section>

        {conteudoCasos}
      </main>

      {casoParaExcluir ? (
        <ModalExcluirCasoOsce
          caso={casoParaExcluir}
          isDeleting={isDeleting}
          onCancel={() => setCasoParaExcluir(null)}
          onConfirm={() => void confirmarExclusao()}
        />
      ) : null}
    </div>
  );
};
