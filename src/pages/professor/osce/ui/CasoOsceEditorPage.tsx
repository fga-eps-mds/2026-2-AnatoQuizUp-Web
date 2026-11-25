import { Check, Plus, Stethoscope, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  atualizarCasoOsce,
  buscarCasoOscePorId,
  criarCasoOsce,
} from '../../../../features/manage-casos-osce/model/casoOsceService';
import type {
  CasoOsce,
  CasoOsceDificuldade,
  CasoOsceFormValues,
  ExameCasoOsce,
} from '../../../../features/manage-casos-osce/model/types';
import { CampoComIA } from '../../../../features/melhorar-texto-ia/ui/CampoComIA';

// Editor do caso OSCE (US26): pagina propria em 4 passos (padrao do prototipo da
// Doc#197), substituindo o modal anterior. /novo cria o rascunho e redireciona
// para /:id/editar; a partir dai sempre edita pelo id. Passos 1-3 tem autosave
// (payloadDoPasso) no Quiz-Service; o passo 4 (Avaliacao) ainda nao tem contrato
// definido no backend, entao fica so como espaco reservado no stepper.

const STEPS = ['Dados gerais', 'Contextualização', 'Roteiro do paciente', 'Avaliação'];
const TOTAL_STEPS = STEPS.length;

const DIFICULDADES: { valor: CasoOsceDificuldade; rotulo: string }[] = [
  { valor: 'FACIL', rotulo: 'Fácil' },
  { valor: 'MEDIA', rotulo: 'Médio' },
  { valor: 'DIFICIL', rotulo: 'Difícil' },
];

const emptyFormValues: CasoOsceFormValues = {
  titulo: '',
  especialidade: '',
  dificuldade: '',
  diagnosticoEsperado: '',
  local: '',
  papelEstudante: '',
  idadePaciente: '',
  sexoPaciente: '',
  queixaPaciente: '',
  perfilPaciente: '',
  historiaSintomas: '',
  exameFisico: '',
  exames: [],
};

// Converte o caso (vindo da API, com nulls) nos valores do formulario.
const casoParaFormValues = (caso: CasoOsce): CasoOsceFormValues => ({
  titulo: caso.titulo ?? '',
  especialidade: caso.especialidade ?? '',
  dificuldade: caso.dificuldade ?? '',
  diagnosticoEsperado: caso.diagnosticoEsperado ?? '',
  local: caso.local ?? '',
  papelEstudante: caso.papelEstudante ?? '',
  idadePaciente: caso.idadePaciente != null ? String(caso.idadePaciente) : '',
  sexoPaciente: caso.sexoPaciente ?? '',
  queixaPaciente: caso.queixaPaciente ?? '',
  perfilPaciente: caso.perfilPaciente ?? '',
  historiaSintomas: caso.historiaSintomas ?? '',
  exameFisico: caso.exameFisico ?? '',
  exames: caso.exames,
});

// Payload de cada passo: so os campos daquele passo (autosave parcial). O passo
// 4 (Avaliacao) nao tem campos proprios ainda, entao nao tem payload.
const payloadDoPasso = (values: CasoOsceFormValues, passo: number) => {
  if (passo === 1) {
    return {
      titulo: values.titulo,
      especialidade: values.especialidade,
      dificuldade: values.dificuldade || undefined,
      diagnosticoEsperado: values.diagnosticoEsperado,
    };
  }

  if (passo === 2) {
    return {
      local: values.local,
      papelEstudante: values.papelEstudante,
      idadePaciente: values.idadePaciente ? Number(values.idadePaciente) : undefined,
      sexoPaciente: values.sexoPaciente,
      queixaPaciente: values.queixaPaciente,
    };
  }

  return {
    perfilPaciente: values.perfilPaciente,
    historiaSintomas: values.historiaSintomas,
    exameFisico: values.exameFisico,
    exames: values.exames,
  };
};

const FieldLabel = ({ children, required = false }: { children: string; required?: boolean }) => (
  <span className="mb-1 flex text-xs font-bold text-[#334155]">
    {children}
    {required ? <span className="ml-1 text-[#e14b4b]">*</span> : null}
  </span>
);

const Hint = ({ children }: { children: string }) => (
  <span className="mt-1 block text-[10px] text-[#8a9ab8]">{children}</span>
);

const inputClassName =
  'h-8 w-full rounded-md border border-[#d8dee9] bg-white px-3 text-xs text-[#0b1840] outline-none transition-colors focus:border-[#00e5cc]';

const stepCircleClassName = (isComplete: boolean, isCurrent: boolean) => {
  if (isComplete) return 'bg-[#00e5cc] text-[#0b1840]';
  if (isCurrent) return 'border-2 border-[#00e5cc] bg-[#0b1840] text-white';
  return 'bg-[#e5e9f0] text-[#aaaabb]';
};

// Indicador dos 4 passos (mesmo padrao visual do Stepper de questoes).
const Stepper = ({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center justify-center gap-2 border-y border-[#e5e9f0] bg-[#f8f9fc] px-5 py-3">
    {STEPS.map((title, index) => {
      const step = index + 1;
      const isComplete = currentStep > step;
      const isCurrent = currentStep === step;

      return (
        <div key={title} className="flex items-center gap-2">
          <div className="flex items-center gap-[7px]">
            <span
              className={
                'flex size-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none ' +
                stepCircleClassName(isComplete, isCurrent)
              }
            >
              {isComplete ? <Check size={12} aria-hidden="true" /> : step}
            </span>
            <span
              className={`hidden text-[11px] font-bold sm:inline ${isCurrent || isComplete ? 'text-[#0b1840]' : 'text-[#aaaabb]'}`}
            >
              {title}
            </span>
          </div>
          {step < STEPS.length ? (
            <span className="h-[1.5px] w-6 rounded-full bg-[#e0e5ef]" aria-hidden="true" />
          ) : null}
        </div>
      );
    })}
  </div>
);

export const CasoOsceEditorPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formValues, setFormValues] = useState<CasoOsceFormValues>(emptyFormValues);
  // Chaves estaveis pros itens de `exames` (o payload do backend nao tem id).
  const [exameChaves, setExameChaves] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<CasoOsce['status']>('RASCUNHO');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Sem id na rota (/novo): cria o rascunho e troca a URL pra /:id/editar, que
  // reexecuta este efeito e cai no ramo de edicao abaixo.
  useEffect(() => {
    let isMounted = true;

    const carregar = async () => {
      setIsLoading(true);
      setError('');

      try {
        if (!id) {
          const casoCriado = await criarCasoOsce({});
          if (isMounted) void navigate(`/professor/osce/${casoCriado.id}/editar`, { replace: true });
          return;
        }

        const caso = await buscarCasoOscePorId(id);
        if (isMounted) {
          setFormValues(casoParaFormValues(caso));
          setExameChaves(caso.exames.map(() => crypto.randomUUID()));
          setEditingId(caso.id);
          setStatus(caso.status);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o caso.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void carregar();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const updateValue = <K extends keyof CasoOsceFormValues>(key: K, value: CasoOsceFormValues[K]) => {
    setFormValues((atual) => ({ ...atual, [key]: value }));
  };

  const atualizarExame = (index: number, campo: keyof ExameCasoOsce, valor: string) => {
    setFormValues((atual) => ({
      ...atual,
      exames: atual.exames.map((exame, i) => (i === index ? { ...exame, [campo]: valor } : exame)),
    }));
  };

  const removerExame = (index: number) => {
    setFormValues((atual) => ({ ...atual, exames: atual.exames.filter((_, i) => i !== index) }));
    setExameChaves((atual) => atual.filter((_, i) => i !== index));
  };

  const adicionarExame = () => {
    setFormValues((atual) => ({ ...atual, exames: [...atual.exames, { nome: '', resultado: '' }] }));
    setExameChaves((atual) => [...atual, crypto.randomUUID()]);
  };

  // Autosave do passo (so os passos 1-3 tem campos proprios).
  const salvarPasso = async (passo: number) => {
    if (!editingId || passo > 3) return;

    setIsSaving(true);
    setError('');

    try {
      await atualizarCasoOsce(editingId, payloadDoPasso(formValues, passo));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o rascunho.');
    } finally {
      setIsSaving(false);
    }
  };

  const avancarPasso = () => {
    void salvarPasso(step);
    setStep((atual) => Math.min(atual + 1, TOTAL_STEPS));
  };

  const voltarPasso = () => {
    setStep((atual) => Math.max(atual - 1, 1));
  };

  const cancelar = () => {
    void salvarPasso(step);
    void navigate('/professor/osce');
  };

  const concluir = () => {
    void navigate('/professor/osce');
  };

  // Texto exatamente como o aluno vai ler na tela de cenario (US24).
  const previewContextualizacao = [
    formValues.local && `Local: ${formValues.local}.`,
    formValues.papelEstudante && `Seu papel: ${formValues.papelEstudante}.`,
    (formValues.idadePaciente || formValues.sexoPaciente || formValues.queixaPaciente) &&
      `Paciente: ${formValues.idadePaciente || '?'} anos, ${formValues.sexoPaciente || '?'}, com queixa de "${formValues.queixaPaciente || '?'}".`,
  ]
    .filter(Boolean)
    .join(' ');

  // Contexto enviado em toda chamada de "Melhorar com IA", pra manter coerencia
  // com o resto do caso mesmo reescrevendo um campo isolado.
  const contextoIa = {
    titulo: formValues.titulo,
    especialidade: formValues.especialidade,
    diagnosticoEsperado: formValues.diagnosticoEsperado,
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f3f6fb] text-sm font-bold text-[#4a5578]">
        Carregando caso...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f3f6fb]">
      <header className="flex items-center justify-between gap-3 border-b border-[#e1f5ee] bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg border border-[#c8d6f8] bg-[#f8f9fc] text-[#185fa5]">
            <Stethoscope size={16} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-base font-bold text-[#0b1840]">{formValues.titulo || 'Novo caso OSCE'}</h1>
            <p className="text-[11px] text-[#8a9ab8]">
              Casos OSCE · {isSaving ? 'Salvando rascunho...' : 'Salvo automaticamente como rascunho'}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#e5e9f0] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#4a5578]">
          {status === 'PUBLICADO' ? 'Publicado' : 'Rascunho'}
        </span>
      </header>

      {error ? (
        <div role="alert" className="mx-5 mt-4 rounded-lg border border-[#f7c1c1] bg-[#fef0f0] px-4 py-3 text-sm font-bold text-[#a32d2d]">
          {error}
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[660px] flex-1 px-4 py-6">
        <section className="flex max-h-[80vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-sm">
          <Stepper currentStep={step} />

          <div className="overflow-y-auto">
            {step === 1 ? (
              <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <CampoComIA
                    campo="titulo"
                    label="Título (queixa principal)"
                    required
                    value={formValues.titulo}
                    onChange={(value) => updateValue('titulo', value)}
                    placeholder="ex: Dor torácica no pronto-socorro"
                    hint="Não cite o diagnóstico aqui — o aluno vai ler este título."
                    contexto={contextoIa}
                  />
                </div>
                <label>
                  <FieldLabel required>Especialidade</FieldLabel>
                  <input
                    value={formValues.especialidade}
                    onChange={(event) => updateValue('especialidade', event.target.value)}
                    placeholder="ex: Cardiologia"
                    className={inputClassName}
                  />
                </label>
                <label>
                  <FieldLabel required>Dificuldade</FieldLabel>
                  <select
                    value={formValues.dificuldade}
                    onChange={(event) => updateValue('dificuldade', event.target.value as CasoOsceDificuldade)}
                    className={inputClassName}
                  >
                    <option value="">Selecione</option>
                    {DIFICULDADES.map((dificuldade) => (
                      <option key={dificuldade.valor} value={dificuldade.valor}>
                        {dificuldade.rotulo}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <CampoComIA
                    campo="diagnosticoEsperado"
                    label="Diagnóstico esperado"
                    required
                    value={formValues.diagnosticoEsperado}
                    onChange={(value) => updateValue('diagnosticoEsperado', value)}
                    placeholder="ex: Infarto agudo do miocárdio"
                    hint="Fica oculto para o estudante até o fim do atendimento."
                    contexto={contextoIa}
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4 px-5 py-5">
                <CampoComIA
                  campo="local"
                  label="Local"
                  required
                  value={formValues.local}
                  onChange={(value) => updateValue('local', value)}
                  placeholder="ex: Pronto-socorro de um hospital geral"
                  contexto={contextoIa}
                />
                <CampoComIA
                  campo="papelEstudante"
                  label="Papel do estudante"
                  required
                  value={formValues.papelEstudante}
                  onChange={(value) => updateValue('papelEstudante', value)}
                  placeholder="ex: Médico(a) responsável pelo primeiro atendimento"
                  contexto={contextoIa}
                />
                <div className="grid grid-cols-3 gap-3">
                  <label>
                    <FieldLabel required>Idade</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      value={formValues.idadePaciente}
                      onChange={(event) => updateValue('idadePaciente', event.target.value)}
                      className={inputClassName}
                    />
                  </label>
                  <label>
                    <FieldLabel required>Sexo</FieldLabel>
                    <input
                      value={formValues.sexoPaciente}
                      onChange={(event) => updateValue('sexoPaciente', event.target.value)}
                      placeholder="ex: Feminino"
                      className={inputClassName}
                    />
                  </label>
                  <CampoComIA
                    campo="queixaPaciente"
                    label="Queixa"
                    required
                    value={formValues.queixaPaciente}
                    onChange={(value) => updateValue('queixaPaciente', value)}
                    placeholder="ex: Dor no peito"
                    contexto={contextoIa}
                  />
                </div>

                <div>
                  <FieldLabel>Pré-visualização (o que o aluno vai ler)</FieldLabel>
                  <p className="rounded-lg bg-[#f8f9fc] p-3 text-xs leading-5 text-[#4a5578]">
                    {previewContextualizacao || 'Preencha os campos acima para ver o texto do cenário.'}
                  </p>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4 px-5 py-5">
                <CampoComIA
                  as="textarea"
                  campo="perfilPaciente"
                  label="Perfil do paciente"
                  required
                  value={formValues.perfilPaciente}
                  onChange={(value) => updateValue('perfilPaciente', value)}
                  placeholder="Jeito de falar, profissão, contexto..."
                  rows={2}
                  contexto={contextoIa}
                />
                <CampoComIA
                  as="textarea"
                  campo="historiaSintomas"
                  label="História e sintomas"
                  required
                  value={formValues.historiaSintomas}
                  onChange={(value) => updateValue('historiaSintomas', value)}
                  rows={3}
                  contexto={contextoIa}
                />
                <CampoComIA
                  as="textarea"
                  campo="exameFisico"
                  label="Exame físico"
                  required
                  value={formValues.exameFisico}
                  onChange={(value) => updateValue('exameFisico', value)}
                  rows={2}
                  contexto={contextoIa}
                />

                <div>
                  <FieldLabel>Exames complementares</FieldLabel>
                  <div className="space-y-2">
                    {formValues.exames.map((exame, index) => (
                      <div
                        key={exameChaves[index] ?? index}
                        className="grid grid-cols-[1fr_1fr_auto] items-start gap-2"
                      >
                        <input
                          value={exame.nome}
                          onChange={(event) => atualizarExame(index, 'nome', event.target.value)}
                          placeholder="Nome do exame"
                          aria-label={`Nome do exame ${index + 1}`}
                          className={inputClassName}
                        />
                        <input
                          value={exame.resultado}
                          onChange={(event) => atualizarExame(index, 'resultado', event.target.value)}
                          placeholder="Resultado"
                          aria-label={`Resultado do exame ${index + 1}`}
                          className={inputClassName}
                        />
                        <button
                          type="button"
                          onClick={() => removerExame(index)}
                          aria-label={`Remover exame ${index + 1}`}
                          className="flex size-8 items-center justify-center rounded-md border border-[#f7c1c1] text-[#a32d2d]"
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={adicionarExame}
                    className="mt-3 flex h-8 w-full items-center justify-center gap-1 rounded-md border border-dashed border-[#c8d6f8] text-[11px] font-bold text-[#185fa5]"
                  >
                    <Plus size={13} aria-hidden="true" />
                    Adicionar exame
                  </button>
                  <Hint>Exames fora desta lista aparecem pro aluno como "não disponível neste caso".</Hint>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-4 px-5 py-5">
                <div className="rounded-lg border border-dashed border-[#c8d6f8] bg-[#f8f9fc] p-4 text-xs leading-5 text-[#4a5578]">
                  <p className="font-bold text-[#0b1840]">Checklist e nota (apenas visual, sem funcionalidade)</p>
                  <p className="mt-1">
                    Este passo é só uma pré-visualização do próximo formulário: ainda não salva nada
                    nem depende do que o professor preencher aqui. A rubrica de avaliação (itens do
                    checklist e nota global) fica para a US27, quando o contrato com o Quiz-Service
                    for definido. Por enquanto, o rascunho já salvo nos passos anteriores é
                    suficiente para concluir o cadastro.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="flex items-center justify-between border-t border-[#e8eaf2] px-5 py-4">
            <span className="text-[11px] font-bold text-[#8a9ab8]">
              {isSaving ? 'Salvando rascunho...' : `Passo ${step} de ${TOTAL_STEPS} — salvo automaticamente`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelar}
                className="h-8 rounded-md border border-[#d8dee9] px-4 text-xs font-bold text-[#4a5578]"
              >
                Cancelar
              </button>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={voltarPasso}
                  className="h-8 rounded-md border border-[#d8dee9] px-4 text-xs font-bold text-[#4a5578]"
                >
                  Voltar
                </button>
              ) : null}
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={avancarPasso}
                  className="h-8 rounded-md bg-[#0b1840] px-5 text-xs font-bold text-white"
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={concluir}
                  className="inline-flex h-8 items-center gap-2 rounded-md bg-[#00e5cc] px-5 text-xs font-bold text-[#0b1840]"
                >
                  <Check size={14} aria-hidden="true" />
                  Concluir rascunho
                </button>
              )}
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
};
