// Detecta, no cliente, quando a fala do aluno encerra a consulta (despedida ou
// pedido de encerramento). E deterministica e nao muda o contrato da API: a tela
// usa o resultado para abrir a confirmacao "Encerrar e ver avaliação?".
//
// Os padroes sao conservadores de proposito. Falso positivo interrompe a anamnese
// com um modal; falso negativo so obriga o aluno a usar o atalho fixo. Por isso:
//  - "ate mais", "ate logo" etc. so contam no FIM da mensagem e como frase propria
//    ("doi ate mais quando ando" nao e despedida);
//  - "obrigado" sozinho nao conta (aparece no meio de perguntas: "obrigado, e a dor
//    piora?"); so em combinacoes claras como "obrigado, era isso".

// Minusculas, sem acentos e com espacos normalizados.
const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

// Valem em qualquer posicao da mensagem: sao inequivocos.
const PADROES_EXPLICITOS: RegExp[] = [
  /\btchau+\b/,
  /\badeus\b/,
  // "podemos encerrar", "vou finalizar", "vamos encerrar por aqui"
  /\b(podemos|vamos|vou|posso|irei|preciso) (encerrar|finalizar)\b/,
  // "encerrar a consulta", "finalizar o atendimento", "terminamos a consulta"
  /\b(encerr|finaliz|termin)[a-z]* (a|o|nossa|nosso|esta|este) (consulta|atendimento)\b/,
  // "encerramos por aqui", "terminamos por hoje"
  /\b(encerr|finaliz|termin)amos (por aqui|por hoje)\b/,
  // "obrigado, era isso", "obrigada, por hoje e so"
  /\bobrigad[oa]\b[ ,.!]*(era (so )?isso|e (so )?isso|por hoje|por enquanto e (so )?isso)\b/,
  /\bpor hoje e (so|isso)\b/,
];

// Despedidas que so contam no fim da mensagem, como frase propria: precedidas pelo
// inicio do texto, por pontuacao ou por "obrigado"/"e".
const DESPEDIDA_FINAL =
  /(^|[,.!;] ?|obrigad[oa] |\be )(ate (mais|logo|breve|amanha|a proxima)|melhoras|fique bem|se cuide)[ .!]*$/;

export const detectarDespedida = (texto: string): boolean => {
  const normalizado = normalizar(texto);
  if (!normalizado) return false;

  return (
    PADROES_EXPLICITOS.some((padrao) => padrao.test(normalizado)) ||
    DESPEDIDA_FINAL.test(normalizado)
  );
};
