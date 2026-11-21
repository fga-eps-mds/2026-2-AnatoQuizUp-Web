import { useEffect, useState } from 'react';
import { buscarTopErrosLista } from '../../../entities/dashboardTurma/api/dashboardTurmaApi';
import type { TopErrosLista } from '../../../entities/dashboardTurma/model/types';

interface ModalTopErrosProps {
  turmaId: string;
  listaId: string;
  nomeLista: string;
  onClose: () => void;
}

export function ModalTopErros({ turmaId, listaId, nomeLista, onClose }: ModalTopErrosProps) {
  const [dados, setDados] = useState<TopErrosLista | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function carregarDados() {
      try {
        const response = await buscarTopErrosLista(turmaId, listaId);
        if (isMounted) setDados(response);
      } catch (error) {
        console.error("Erro ao buscar top erros:", error);
        if (isMounted) setErro(true);
      } finally {
        if (isMounted) setCarregando(false);
      }
    }
    
    void carregarDados();
    return () => { isMounted = false; };
  }, [turmaId, listaId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        
        <div className="flex justify-between items-start p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Questões com mais erros</h2>
            <p className="text-sm text-gray-500 mt-1">{nomeLista}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 font-bold text-xl">
            ✕
          </button>
        </div>

        <div className="p-6">
          {carregando ? (
            <p className="text-center text-gray-500 py-10">Carregando...</p>
          ) : erro ? (
            <p className="text-center text-red-500 py-10">Erro ao carregar dados.</p>
          ) : dados && dados.questoes.length === 0 ? (
            <p className="text-center text-gray-600 py-10">Nenhuma questão recebeu respostas erradas nesta lista.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 font-medium">
                {dados?.totalAlunosResponderam} {dados?.totalAlunosResponderam === 1 ? 'aluno respondeu' : 'alunos responderam'} · Ordenado por quantidade de erros
              </p>
              <div className="space-y-3">
                {dados?.questoes.map((q) => (
                  <div key={q.questaoId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="font-bold text-gray-800">Questão {q.numeroQuestao} - {q.tema}</div>
                    <div className="text-sm text-gray-600 line-clamp-2">{q.enunciado}</div>
                    <div className="text-sm font-semibold text-red-500 mt-2">
                      {q.totalErros} de {q.totalRespostas} alunos erraram · {q.percentualErro}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">Empates pelo número da questão.</p>
        </div>
      </div>
    </div>
  );
}