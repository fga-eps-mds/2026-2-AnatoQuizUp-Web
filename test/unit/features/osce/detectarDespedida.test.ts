import { detectarDespedida } from '../../../../src/features/osce/detectarDespedida';

describe('detectarDespedida', () => {
  it.each([
    'tchau',
    'Tchau!',
    'Obrigado, tchau',
    'obrigado, era isso',
    'Obrigada, era só isso.',
    'OBRIGADO, É ISSO',
    'Por hoje é só, obrigado',
    'Podemos encerrar por aqui?',
    'Vou encerrar a consulta agora.',
    'Vamos finalizar',
    'Preciso finalizar a consulta',
    'Encerramos por aqui',
    'Vou terminar o atendimento.',
    'Até mais',
    'Ok, até logo!',
    'Certo. Até a próxima.',
    'Obrigado até mais',
    'Melhoras!',
    'Entendi, fique bem.',
    'adeus',
  ])('reconhece "%s" como despedida', (texto) => {
    expect(detectarDespedida(texto)).toBe(true);
  });

  it.each([
    '',
    '   ',
    'Bom dia, sou o médico de plantão.',
    'dói até mais quando ando',
    'Dói até mais',
    'obrigado, e a dor piora?',
    'Obrigado. Desde quando sente essa dor?',
    'Entendi, obrigado.',
    'Vou examinar o seu abdome.',
    'A dor começa e termina sozinha?',
    'Você quer terminar de contar?',
    'Isso melhora com repouso?',
    'Vamos ver a pressão',
  ])('nao considera "%s" despedida', (texto) => {
    expect(detectarDespedida(texto)).toBe(false);
  });
});
