import type {
  ContagemChapa,
  DecisaoApuracao,
  EstrategiaApuracao,
} from './EstrategiaApuracao.ts';

/**
 * Regra de maioria simples do turno único do Centro Acadêmico: elege a chapa
 * mais votada, sem exigir metade mais um dos votos válidos.
 * Duas chapas na frente com a mesma votação não elegem ninguém, e uma eleição
 * sem nenhum voto válido também não, mesmo com chapa concorrendo sozinha.
 */
export class MaioriaSimples implements EstrategiaApuracao {
  public decidir(contagens: readonly ContagemChapa[]): DecisaoApuracao {
    const maiorVotacao = Math.max(0, ...contagens.map((c) => c.votos));
    const lideres = contagens.filter((c) => c.votos === maiorVotacao);

    if (maiorVotacao === 0 || lideres.length > 1) {
      return {
        vencedora: null,
        empate: true,
        chapasEmpatadas: lideres.map((c) => c.chapa),
      };
    }

    return {
      vencedora: lideres[0].chapa,
      empate: false,
      chapasEmpatadas: [],
    };
  }
}
