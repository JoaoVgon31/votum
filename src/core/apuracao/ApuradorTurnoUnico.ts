import type {
  ContagemChapa,
  DecisaoApuracao,
  EstrategiaApuracao,
} from './EstrategiaApuracao.ts';
import {
  CedulaInvalidaError,
  ParametrosApuracaoInvalidosError,
} from './errors/ApuracaoError.ts';
import { MaioriaSimples } from './MaioriaSimples.ts';
import {
  ehOpcaoEspecial,
  OpcaoEspecial,
  type Cedula,
} from './OpcaoEspecial.ts';

/** Resultado fechado de uma apuração de turno único. */
export interface ResultadoApuracao extends DecisaoApuracao {
  /** Votos por chapa, na ordem em que as chapas foram registradas. */
  contagens: readonly ContagemChapa[];
  /** Cédulas atribuídas a alguma chapa. */
  votosValidos: number;
  /** Cédulas em branco, contadas à parte. */
  brancos: number;
  /** Cédulas nulas, contadas à parte. */
  nulos: number;
  /** Cédulas lidas na urna, somando válidas, brancas e nulas. */
  totalCedulas: number;
}

/**
 * Contexto do padrão Strategy: lê as cédulas, separa brancos e nulos em
 * contadores próprios, conta um voto por cédula válida e passa só as
 * contagens para a estratégia decidir quem venceu.
 */
export class ApuradorTurnoUnico {
  private readonly estrategia: EstrategiaApuracao;

  constructor(estrategia: EstrategiaApuracao = new MaioriaSimples()) {
    this.estrategia = estrategia;
  }

  /**
   * @param chapas Chapas concorrentes. Chapa sem nenhum voto continua na lista.
   * @param cedulas Cédulas da urna, cada uma com a sigla de uma chapa, BRANCO ou NULO.
   */
  public apurar(
    chapas: readonly string[],
    cedulas: readonly Cedula[],
  ): ResultadoApuracao {
    this.validarChapas(chapas);

    const votosPorChapa = new Map(chapas.map((chapa) => [chapa, 0]));
    let brancos = 0;
    let nulos = 0;

    for (const cedula of cedulas) {
      if (cedula === OpcaoEspecial.BRANCO) {
        brancos += 1;
        continue;
      }
      if (cedula === OpcaoEspecial.NULO) {
        nulos += 1;
        continue;
      }

      const votosAtuais = votosPorChapa.get(cedula);
      if (votosAtuais === undefined) {
        throw new CedulaInvalidaError(
          `A cédula "${cedula}" não corresponde a nenhuma chapa concorrente nem a BRANCO ou NULO.`,
        );
      }
      // Peso igual: toda cédula válida vale um voto, seja de quem for.
      votosPorChapa.set(cedula, votosAtuais + 1);
    }

    // O Map preserva a ordem de inserção, então as contagens saem na ordem
    // em que as chapas foram registradas.
    const contagens: readonly ContagemChapa[] = [...votosPorChapa].map(
      ([chapa, votos]) => ({ chapa, votos }),
    );

    return {
      ...this.estrategia.decidir(contagens),
      contagens,
      votosValidos: contagens.reduce((total, c) => total + c.votos, 0),
      brancos,
      nulos,
      totalCedulas: cedulas.length,
    };
  }

  private validarChapas(chapas: readonly string[]): void {
    if (chapas.length === 0) {
      throw new ParametrosApuracaoInvalidosError(
        'A apuração exige ao menos uma chapa concorrente.',
      );
    }
    if (new Set(chapas).size !== chapas.length) {
      throw new ParametrosApuracaoInvalidosError(
        'A lista de chapas concorrentes não pode ter identificadores repetidos.',
      );
    }
    const especial = chapas.find(ehOpcaoEspecial);
    if (especial !== undefined) {
      throw new ParametrosApuracaoInvalidosError(
        `Nenhuma chapa pode se chamar "${especial}", que já identifica voto branco ou nulo.`,
      );
    }
  }
}
