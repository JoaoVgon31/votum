import type { EstrategiaQuorum, ResultadoQuorum } from './EstrategiaQuorum.ts';
import { ParametrosQuorumInvalidosError } from './errors/QuorumError.ts';

/** Percentual mínimo de participação exigido na eleição de Centro Acadêmico. */
export const PERCENTUAL_MINIMO_CENTRO_ACADEMICO = 20;

/**
 * Estratégia de quórum baseada em um percentual mínimo do corpo de eleitores.
 * Por padrão exige 20% de participação (regra do Centro Acadêmico).
 */
export class QuorumMinimoPercentual implements EstrategiaQuorum {
  private readonly percentualMinimo: number;

  constructor(percentualMinimo = PERCENTUAL_MINIMO_CENTRO_ACADEMICO) {
    if (
      !Number.isFinite(percentualMinimo) ||
      percentualMinimo < 0 ||
      percentualMinimo > 100
    ) {
      throw new ParametrosQuorumInvalidosError(
        `O percentual mínimo deve estar entre 0 e 100. Recebido: ${String(percentualMinimo)}.`,
      );
    }
    this.percentualMinimo = percentualMinimo;
  }

  public verificar(
    totalPresencas: number,
    totalEleitores: number,
  ): ResultadoQuorum {
    this.validarContagens(totalPresencas, totalEleitores);

    return {
      // Multiplicação cruzada evita erros de arredondamento da divisão em ponto flutuante.
      atingido: totalPresencas * 100 >= totalEleitores * this.percentualMinimo,
      participacao: (totalPresencas / totalEleitores) * 100,
      percentualMinimo: this.percentualMinimo,
    };
  }

  private validarContagens(
    totalPresencas: number,
    totalEleitores: number,
  ): void {
    if (!Number.isInteger(totalEleitores) || totalEleitores <= 0) {
      throw new ParametrosQuorumInvalidosError(
        `O total de eleitores deve ser um número inteiro maior que zero. Recebido: ${String(totalEleitores)}.`,
      );
    }
    if (!Number.isInteger(totalPresencas) || totalPresencas < 0) {
      throw new ParametrosQuorumInvalidosError(
        `O total de presenças deve ser um número inteiro maior ou igual a zero. Recebido: ${String(totalPresencas)}.`,
      );
    }
    if (totalPresencas > totalEleitores) {
      throw new ParametrosQuorumInvalidosError(
        `O total de presenças (${String(totalPresencas)}) não pode exceder o total de eleitores (${String(totalEleitores)}).`,
      );
    }
  }
}
