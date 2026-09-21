import type { EstrategiaQuorum, ResultadoQuorum } from './EstrategiaQuorum.ts';
import { QuorumMinimoPercentual } from './QuorumMinimoPercentual.ts';
import { StatusFinalSessao } from './StatusFinalSessao.ts';

/**
 * Implementa o que o avaliador precisa conhecer de uma sessão.
 */
export interface SessaoAvaliavelPorQuorum {
  /** Tamanho da "lista de presença" (quem já votou). */
  obterTotalPresencas(): number;
  /** Total de eleitores importados para o colégio eleitoral. */
  obterTotalEleitores(): number;
  /** Registra o estado final da sessão. */
  declararStatusFinal(status: StatusFinalSessao): void;
}

/**
 * Contexto do padrão Strategy: delega o cálculo do quórum a uma estratégia
 * e aplica o resultado no estado final da sessão.
 */
export class AvaliadorQuorum {
  private readonly estrategia: EstrategiaQuorum;

  constructor(estrategia: EstrategiaQuorum = new QuorumMinimoPercentual()) {
    this.estrategia = estrategia;
  }

  /**
   * Verifica o quórum e declara a sessão como Deserta (quórum não atingido)
   * ou Concluida (quórum atingido).
   */
  public avaliar(sessao: SessaoAvaliavelPorQuorum): ResultadoQuorum {
    const resultado = this.estrategia.verificar(
      sessao.obterTotalPresencas(),
      sessao.obterTotalEleitores(),
    );

    sessao.declararStatusFinal(
      resultado.atingido
        ? StatusFinalSessao.CONCLUIDA
        : StatusFinalSessao.DESERTA,
    );

    return resultado;
  }
}
