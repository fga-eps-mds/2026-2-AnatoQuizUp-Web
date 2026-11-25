jest.mock('../../../../src/shared/api/httpClient', () => ({
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../../../../src/features/manage-questions/model/questionService', () => ({
  extractErrorMessage: jest.fn(() => 'Erro simulado pelo mock'),
}));

import {
  enviarMensagemOsce,
  finalizarOsce,
  listarCenariosOsce,
  type AvaliacaoOsce,
  type TurnoOsce,
} from '../../../../src/features/osce/osceService';
import { httpClient } from '../../../../src/shared/api/httpClient';

const httpClientMock = httpClient as unknown as { get: jest.Mock; post: jest.Mock };

const historico: TurnoOsce[] = [
  { autor: 'aluno', texto: 'O que o senhor sente?' },
  { autor: 'paciente', texto: 'Dor no peito.' },
];

describe('osceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarCenariosOsce', () => {
    it('devolve a lista de cenarios publicos com o contexto inicial', async () => {
      const cenarios = [
        {
          id: 'dor-toracica',
          titulo: 'Dor torácica',
          especialidade: 'Cardiologia',
          dificuldade: 'Médio',
          contextoInicial: {
            local: 'Pronto-socorro',
            papelEstudante: 'Médico(a) responsável pelo primeiro atendimento',
            idade: 58,
            sexo: 'Masculino',
            queixa: 'Dor torácica',
          },
        },
      ];
      httpClientMock.get.mockResolvedValue({ data: { cenarios } });

      const resultado = await listarCenariosOsce();

      expect(httpClientMock.get).toHaveBeenCalledWith('/ia/osce/cenarios');
      expect(resultado).toEqual(cenarios);
    });

    it('relanca o erro traduzido quando a chamada falha', async () => {
      httpClientMock.get.mockRejectedValue(new Error('rede fora'));

      await expect(listarCenariosOsce()).rejects.toThrow('Erro simulado pelo mock');
    });
  });

  describe('enviarMensagemOsce', () => {
    it('envia a fala do aluno com o historico e devolve os turnos da resposta', async () => {
      const turnos: TurnoOsce[] = [
        { autor: 'paciente', texto: 'Tudo bem, doutor.' },
        { autor: 'exame', exame: 'Eletrocardiograma', texto: 'Ritmo sinusal.' },
        { autor: 'indisponivel', exame: 'Tomografia', texto: 'Não disponível neste caso.' },
      ];
      httpClientMock.post.mockResolvedValue({ data: { resposta: 'Tudo bem, doutor.', turnos } });

      const resultado = await enviarMensagemOsce('dor-toracica', 'Peço um ECG.', historico);

      expect(httpClientMock.post).toHaveBeenCalledWith('/ia/osce/dor-toracica/mensagem', {
        mensagem: 'Peço um ECG.',
        historico,
      });
      expect(resultado).toEqual(turnos);
    });

    it('trata a resposta sem turnos (ChatbotOSCE anterior a US25) como fala do paciente', async () => {
      httpClientMock.post.mockResolvedValue({ data: { resposta: 'Dói desde ontem.' } });

      const resultado = await enviarMensagemOsce('dor-toracica', 'Desde quando dói?', historico);

      expect(resultado).toEqual([{ autor: 'paciente', texto: 'Dói desde ontem.' }]);
    });

    it('relanca o erro traduzido quando a chamada falha', async () => {
      httpClientMock.post.mockRejectedValue(new Error('502'));

      await expect(enviarMensagemOsce('dor-toracica', 'Onde dói?', [])).rejects.toThrow(
        'Erro simulado pelo mock',
      );
    });
  });

  describe('finalizarOsce', () => {
    it('encerra a estacao e devolve a avaliacao pontuada pelo BFF', async () => {
      const avaliacao = { cenarioId: 'dor-toracica', percentual: 74 } as AvaliacaoOsce;
      httpClientMock.post.mockResolvedValue({ data: { avaliacao } });

      const resultado = await finalizarOsce('dor-toracica', historico);

      expect(httpClientMock.post).toHaveBeenCalledWith('/ia/osce/dor-toracica/finalizar', {
        historico,
      });
      expect(resultado).toBe(avaliacao);
    });

    it('relanca o erro traduzido quando a chamada falha', async () => {
      httpClientMock.post.mockRejectedValue(new Error('timeout'));

      await expect(finalizarOsce('dor-toracica', [])).rejects.toThrow('Erro simulado pelo mock');
    });
  });
});
