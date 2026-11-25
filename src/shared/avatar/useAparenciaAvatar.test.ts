import { APARENCIA_PADRAO, type AparenciaAvatar } from './aparencia';
import { carregarAparencia, salvarAparencia } from './useAparenciaAvatar';

describe('armazenamento da aparência do avatar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('valida todos os campos antes de gravar dados externos no localStorage', () => {
    const aparenciaExterna = {
      corCerebro: '<script>',
      cabelo: 'valor-invalido',
      acessorio: { nome: 'coroa' },
      luva: 'luva-boxe',
      calcado: 'tenis-esportivo',
      campoInesperado: 'nao deve ser persistido',
    } as unknown as AparenciaAvatar;

    salvarAparencia('aluna-1', aparenciaExterna);

    expect(JSON.parse(localStorage.getItem('anatoquizup:avatar:aluna-1') ?? '{}')).toEqual({
      ...APARENCIA_PADRAO,
      luva: 'luva-boxe',
      calcado: 'tenis-esportivo',
    });
    expect(carregarAparencia('aluna-1')).toEqual({
      ...APARENCIA_PADRAO,
      luva: 'luva-boxe',
      calcado: 'tenis-esportivo',
    });
  });

  it('recusa identificadores inválidos antes de acessar o localStorage', () => {
    salvarAparencia('../outro-registro', APARENCIA_PADRAO);

    expect(localStorage).toHaveLength(0);
    expect(carregarAparencia('../outro-registro')).toEqual(APARENCIA_PADRAO);
  });

  it.each([
    'loiro-castanho', 'loiro-ruivo', 'cacheado-loiro', 'cacheado-castanho',
    'moicano-loiro', 'moicano-ruivo', 'curto-cacheado', 'trancas',
    'curto-grisalho', 'curto-cacheado-loiro',
  ] as const)('aceita o cabelo novo %s ao salvar e carregar', (cabelo) => {
    salvarAparencia('aluna-1', { ...APARENCIA_PADRAO, cabelo });

    expect(carregarAparencia('aluna-1')).toEqual({ ...APARENCIA_PADRAO, cabelo });
  });

  it.each([
    'bone', 'tiara', 'oculos-sol', 'chapeu-festa',
    'capacete', 'chapeu-mago', 'chapeu-chef', 'chapeu-palha',
    'mascara-carnaval', 'chapeu-cowboy',
  ] as const)('aceita o acessório novo %s ao salvar e carregar', (acessorio) => {
    salvarAparencia('aluna-1', { ...APARENCIA_PADRAO, acessorio });

    expect(carregarAparencia('aluna-1')).toEqual({ ...APARENCIA_PADRAO, acessorio });
  });

  it.each([
    'tenis-esportivo-vermelho', 'tenis-esportivo-verde', 'tenis-esportivo-amarelo', 'tenis-esportivo-preto',
    'tenis-cano-alto-azul', 'tenis-cano-alto-verde', 'tenis-cano-alto-amarelo', 'tenis-cano-alto-preto',
    'tenis-skate', 'bota-coturno',
  ] as const)('aceita o calçado novo %s ao salvar e carregar', (calcado) => {
    salvarAparencia('aluna-1', { ...APARENCIA_PADRAO, calcado });

    expect(carregarAparencia('aluna-1')).toEqual({ ...APARENCIA_PADRAO, calcado });
  });

  it.each([
    'luva-boxe-azul', 'luva-boxe-verde', 'luva-boxe-dourado', 'luva-boxe-roxo',
    'luva-boxe-preta', 'luva-la-rosa', 'luva-la-verde', 'luva-la-azul',
    'luva-jardinagem', 'luva-goleiro',
  ] as const)('aceita o luva novo %s ao salvar e carregar', (luva) => {
    salvarAparencia('aluna-1', { ...APARENCIA_PADRAO, luva });

    expect(carregarAparencia('aluna-1')).toEqual({ ...APARENCIA_PADRAO, luva });
  });
});
