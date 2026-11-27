import { useEffect, useState } from 'react';
import { buscarHistoricoAluno, type ItemHistoricoAluno } from '../../../entities/dashboardTurma/api/dashboardTurmaApi';

type Estado =
  | { tipo: 'carregando' | 'erro' }
  | { tipo: 'pronto'; listas: ItemHistoricoAluno[] };

const dataPublicacao = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

export const HistoricoListasAluno = ({ turmaId, alunoId, onVerEntrega }: {
  turmaId: string;
  alunoId: string;
  onVerEntrega?: (listaId: string) => void;
}) => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const [semestre, setSemestre] = useState(hoje.getMonth() < 6 ? 1 : 2);
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });

  useEffect(() => {
    let ativo = true;
    const inicio = new Date(ano, semestre === 1 ? 0 : 6, 1);
    const fim = new Date(new Date(ano, semestre === 1 ? 6 : 12, 1).getTime() - 1);

    void buscarHistoricoAluno(turmaId, alunoId, {
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
    }).then(
      (listas) => { if (ativo) setEstado({ tipo: 'pronto', listas }); },
      () => { if (ativo) setEstado({ tipo: 'erro' }); },
    );

    return () => { ativo = false; };
  }, [turmaId, alunoId, ano, semestre]);

  return (
    <section className="mt-5 border-t border-gray-200 pt-4" aria-label="Histórico de listas">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-bold text-teal-700">Histórico</h4>
        <div className="flex gap-2" role="group" aria-label={`Período de ${ano}`}>
          {[1, 2].map((opcao) => (
            <button
              key={opcao}
              type="button"
              aria-pressed={semestre === opcao}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${semestre === opcao ? 'border-teal-100 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-700'}`}
              onClick={() => {
                if (opcao === semestre) return;
                setEstado({ tipo: 'carregando' });
                setSemestre(opcao);
              }}
            >
              {opcao}º semestre
            </button>
          ))}
        </div>
      </div>
      {estado.tipo === 'carregando' && <p role="status">Carregando histórico...</p>}
      {estado.tipo === 'erro' && <p role="alert" className="text-red-700">Não foi possível carregar o histórico.</p>}
      {estado.tipo === 'pronto' && (
        estado.listas.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma lista publicada no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th scope="col" className="pb-3 pr-4">Publicação</th>
                  <th scope="col" className="pb-3 pr-4">Lista</th>
                  <th scope="col" className="pb-3">Entrega</th>
                </tr>
              </thead>
              <tbody>
                {estado.listas.map((lista) => (
                  <tr key={lista.listaTurmaId} className="border-t border-gray-100">
                    <td className="whitespace-nowrap py-3 pr-4">{dataPublicacao.format(new Date(lista.publicadaEm))}</td>
                    <td className="py-3 pr-4">{lista.nomeLista}</td>
                    <td>
                      {lista.status === 'ENTREGUE' ? 'Entregue' : 'Pendente'}
                      {lista.status === 'ENTREGUE' && onVerEntrega && (
                        <button type="button" className="ml-3 font-semibold text-teal-700" onClick={() => onVerEntrega(lista.listaTurmaId)}>
                          Ver entrega
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </section>
  );
};
