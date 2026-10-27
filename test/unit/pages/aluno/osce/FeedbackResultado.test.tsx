import { render, screen } from '@testing-library/react';

import { FeedbackResultado } from '../../../../../src/pages/aluno/osce/FeedbackResultado';
import type {
  AvaliacaoOsce,
  ItemAvaliado,
} from '../../../../../src/features/osce/osceService';

const item = (sobrescrita: Partial<ItemAvaliado> = {}): ItemAvaliado => ({
  id: 'caracteriza-dor',
  dominio: 'Identificação do problema',
  descricao: 'Caracteriza a dor',
  ancoras: { competente: 'Obtém localização e qualidade', parcial: 'Só a localização' },
  peso: 2,
  permiteParcial: true,
  nivel: 'competente',
  justificativa: 'Perguntou onde doía',
  pontos: 2,
  pontosMaximos: 2,
  ...sobrescrita,
});

const avaliacao = (sobrescrita: Partial<AvaliacaoOsce> = {}): AvaliacaoOsce => ({
  cenarioId: 'dor-toracica',
  titulo: 'Dor torácica no pronto-socorro',
  diagnosticoEsperado: 'Síndrome coronariana aguda',
  comentarioFinal: 'Boa conduta geral.',
  itens: [item()],
  pontuacao: 2,
  pontuacaoMaxima: 2,
  percentual: 100,
  nivelChecklist: 'excelente',
  rotuloChecklist: 'Excelente',
  notaGlobal: 4,
  rotuloNotaGlobal: 'Aprovação excelente',
  ancoraNotaGlobal: 'Conduziu como um interno competente.',
  justificativaNotaGlobal: 'Linha de raciocínio clara.',
  aprovado: true,
  itensCriticosNaoCumpridos: [],
  divergente: false,
  ...sobrescrita,
});

describe('FeedbackResultado', () => {
  it('mostra as duas medidas, o diagnostico esperado e o veredito', () => {
    render(<FeedbackResultado avaliacao={avaliacao()} />);

    expect(screen.getByText('Feedback do examinador')).toBeInTheDocument();
    expect(screen.getByText(/Síndrome coronariana aguda/)).toBeInTheDocument();
    expect(screen.getByText('Aprovado')).toBeInTheDocument();
    // O bloco do checklist traz pontos, percentual e a faixa.
    const checklist = screen.getByText('Checklist ponderado').parentElement;
    expect(checklist).toHaveTextContent('2 / 2 pts');
    expect(checklist).toHaveTextContent('(100%)');
    expect(checklist).toHaveTextContent('Excelente');
    expect(screen.getByText(/Nota global \(4\/4\)/)).toBeInTheDocument();
    expect(screen.getByText('Aprovação excelente')).toBeInTheDocument();
    expect(screen.getByText('Linha de raciocínio clara.')).toBeInTheDocument();
    expect(screen.getByText('Boa conduta geral.')).toBeInTheDocument();
  });

  it('marca como nao aprovado quando o BFF reprova a estacao', () => {
    render(<FeedbackResultado avaliacao={avaliacao({ aprovado: false })} />);

    expect(screen.getByText('Não aprovado')).toBeInTheDocument();
  });

  it('agrupa os itens por dominio e soma os pontos do grupo', () => {
    const itens = [
      item({ id: 'apresentacao', dominio: 'Comunicação e rapport', peso: 1, pontos: 1, pontosMaximos: 1 }),
      item({ id: 'caracteriza-dor', pontos: 1, pontosMaximos: 2, nivel: 'parcial' }),
      item({ id: 'irradiacao', descricao: 'Investiga irradiação', pontos: 0, pontosMaximos: 1, nivel: 'nao_realizado' }),
    ];

    render(<FeedbackResultado avaliacao={avaliacao({ itens })} />);

    expect(screen.getByText('Comunicação e rapport')).toBeInTheDocument();
    expect(screen.getByText('Identificação do problema')).toBeInTheDocument();
    // O grupo de identificacao soma 1 de 3 pontos nos dois itens.
    expect(screen.getByText('1 / 3 pts')).toBeInTheDocument();
    expect(screen.getByText(/Competente · 1\/1/)).toBeInTheDocument();
    expect(screen.getByText(/Parcialmente · 1\/2/)).toBeInTheDocument();
    expect(screen.getByText(/Não realizado · 0\/1/)).toBeInTheDocument();
  });

  it('exibe meio ponto com uma casa decimal e inteiros sem casa', () => {
    const itens = [item({ nivel: 'parcial', pontos: 1.5, pontosMaximos: 3, peso: 2 })];

    render(<FeedbackResultado avaliacao={avaliacao({ itens, pontuacao: 1.5, pontuacaoMaxima: 3 })} />);

    // Aparece no total do checklist e no subtotal do dominio.
    expect(screen.getAllByText(/1\.5 \/ 3 pts/)).toHaveLength(2);
  });

  it('avisa quando o checklist e a nota global discordam', () => {
    render(<FeedbackResultado avaliacao={avaliacao({ divergente: true })} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/discordaram bastante/);
    expect(screen.getByRole('alert')).toHaveTextContent(/leve o resultado ao professor/);
  });

  it('avisa quando um item critico nao foi cumprido, listando o item', () => {
    render(
      <FeedbackResultado
        avaliacao={avaliacao({
          aprovado: false,
          itensCriticosNaoCumpridos: ['Caracteriza a dor'],
        })}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/Item crítico não cumprido/);
    expect(screen.getByRole('alert')).toHaveTextContent(/Caracteriza a dor/);
  });

  it('mostra o selo de critico e as duas ancoras de credito do item', () => {
    render(<FeedbackResultado avaliacao={avaliacao({ itens: [item({ critico: true })] })} />);

    expect(screen.getByText('Crítico')).toBeInTheDocument();
    expect(screen.getByText(/Crédito cheio: Obtém localização e qualidade/)).toBeInTheDocument();
    expect(screen.getByText(/Crédito parcial: Só a localização/)).toBeInTheDocument();
    expect(screen.getByText('Perguntou onde doía')).toBeInTheDocument();
  });

  it('omite o credito parcial quando o item nao tem meio-termo', () => {
    const semParcial = item({ ancoras: { competente: 'Pergunta se a dor irradia' }, permiteParcial: false });

    render(<FeedbackResultado avaliacao={avaliacao({ itens: [semParcial] })} />);

    expect(screen.queryByText(/Crédito parcial:/)).not.toBeInTheDocument();
  });

  it('deixa claro que o resultado e formativo', () => {
    render(<FeedbackResultado avaliacao={avaliacao()} />);

    expect(screen.getByText(/Resultado formativo/)).toBeInTheDocument();
  });
});
