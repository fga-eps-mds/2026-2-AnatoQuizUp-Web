import type { DesempenhoLista } from '../../../../../src/entities/dashboardTurma/model/types';
import {
  filtrarListasPorNome,
  normalizarTextoBusca,
} from '../../../../../src/features/dashboard-turmas/model/filtrarListasDesempenho';

const criarLista = (id: string, nomeLista: string): DesempenhoLista => ({
  listaTurmaId: id,
  nomeLista,
  totalAlunos: 10,
  totalSubmeteram: 5,
  totalPendentes: 5,
  taxaMediaAcerto: 75,
  prazo: null,
});

describe('filtrarListasDesempenho', () => {
  const listasMock: DesempenhoLista[] = [
    criarLista('l1', 'A ser manipulada'),
    criarLista('l2', 'Aquecimento Geral (Nível Fácil)'),
    criarLista('l3', 'Simulado de Neuroanatomia - 2026.1'),
    criarLista('l4', 'Revisão de Sistema Esquelético'),
  ];

  describe('normalizarTextoBusca', () => {
    it('remove acentos, converte para minusculas e remove espacos externos', () => {
      expect(normalizarTextoBusca('  Nível Fácil — Tórax  ')).toBe('nivel facil — torax');
      expect(normalizarTextoBusca('NEUROANATOMIA')).toBe('neuroanatomia');
      expect(normalizarTextoBusca('Revisão de Órgãos')).toBe('revisao de orgaos');
    });
  });

  describe('filtrarListasPorNome', () => {
    it('retorna todas as listas quando o termo esta vazio ou contem apenas espacos', () => {
      expect(filtrarListasPorNome(listasMock, '')).toEqual(listasMock);
      expect(filtrarListasPorNome(listasMock, '   ')).toEqual(listasMock);
    });

    it('filtra por correspondencia parcial ignorando maiusculas e minusculas', () => {
      const resultado = filtrarListasPorNome(listasMock, 'NEURO');

      expect(resultado).toHaveLength(1);
      expect(resultado[0].listaTurmaId).toBe('l3');
    });

    it('ignora diferencas entre caracteres acentuados e nao acentuados', () => {
      expect(filtrarListasPorNome(listasMock, 'nivel facil').map((l) => l.listaTurmaId)).toEqual(['l2']);
      expect(filtrarListasPorNome(listasMock, 'revisao').map((l) => l.listaTurmaId)).toEqual(['l4']);
      expect(filtrarListasPorNome(listasMock, 'esqueletico').map((l) => l.listaTurmaId)).toEqual(['l4']);
      expect(filtrarListasPorNome(listasMock, 'FÁCIL').map((l) => l.listaTurmaId)).toEqual(['l2']);
    });

    it('retorna lista vazia quando nao ha correspondencia', () => {
      expect(filtrarListasPorNome(listasMock, 'Cardiovascular')).toEqual([]);
    });

    it('nao altera nem muta os dados das listas originais', () => {
      const copiaOriginal = listasMock.map((lista) => ({ ...lista }));
      const filtradas = filtrarListasPorNome(listasMock, 'Neuroanatomia');

      expect(listasMock).toEqual(copiaOriginal);
      expect(filtradas).not.toBe(listasMock);
      expect(filtradas[0]).toEqual(copiaOriginal[2]);
    });
  });
});
