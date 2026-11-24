import {
  ParametrosCondominioInvalidosError,
  ProprietarioSemUnidadesError,
  UnidadeNaoEncontradaError,
} from './errors/CondominioError.ts';

export interface UnidadeCondominial {
  readonly id: string;
  readonly numero: string;
  readonly bloco: string;
  readonly proprietarioId: string;
  readonly nomeTitular: string;
  /** Fração ideal da unidade (ex.: percentual ou peso patrimonial > 0). */
  readonly fracaoIdeal: number;
}

export interface CedulaCondominialAberta {
  readonly unidades: readonly UnidadeCondominial[];
  readonly fracaoIdealTotal: number;
}

export function arredondarFracao(valor: number): number {
  return Math.round(valor * 10000) / 10000;
}

/**
 * Cadastro das unidades condominiais e suas respectivas frações ideais.
 */
export class CadastroCondominio {
  private readonly unidadesPorId: Map<string, UnidadeCondominial>;

  constructor(unidades: readonly UnidadeCondominial[]) {
    if (unidades.length === 0) {
      throw new ParametrosCondominioInvalidosError(
        'O cadastro do condomínio exige ao menos uma unidade.',
      );
    }

    const mapa = new Map<string, UnidadeCondominial>();

    for (const unidade of unidades) {
      const id = unidade.id.trim();
      const numero = unidade.numero.trim();
      const bloco = unidade.bloco.trim();
      const proprietarioId = unidade.proprietarioId.trim();
      const nomeTitular = unidade.nomeTitular.trim();

      if (id === '' || numero === '' || bloco === '') {
        throw new ParametrosCondominioInvalidosError(
          'Toda unidade deve informar id, número e bloco não vazios.',
        );
      }

      if (proprietarioId === '' || nomeTitular === '') {
        throw new ParametrosCondominioInvalidosError(
          'Toda unidade deve informar proprietário e nome do titular.',
        );
      }

      if (
        !Number.isFinite(unidade.fracaoIdeal) ||
        unidade.fracaoIdeal <= 0
      ) {
        throw new ParametrosCondominioInvalidosError(
          `A fração ideal da unidade "${id}" deve ser um número positivo.`,
        );
      }

      if (mapa.has(id)) {
        throw new ParametrosCondominioInvalidosError(
          `A unidade "${id}" está duplicada no cadastro do condomínio.`,
        );
      }

      mapa.set(id, {
        ...unidade,
        id,
        numero,
        bloco,
        proprietarioId,
        nomeTitular,
      });
    }

    this.unidadesPorId = mapa;
  }

  public get totalUnidades(): number {
    return this.unidadesPorId.size;
  }

  public get fracaoIdealTotal(): number {
    let soma = 0;
    for (const unidade of this.unidadesPorId.values()) {
      soma += unidade.fracaoIdeal;
    }
    return arredondarFracao(soma);
  }

  public listarUnidades(): readonly UnidadeCondominial[] {
    return [...this.unidadesPorId.values()];
  }

  public obterUnidade(unidadeId: string): UnidadeCondominial {
    const idLimpo = unidadeId.trim();
    const unidade = this.unidadesPorId.get(idLimpo);
    if (unidade === undefined) {
      throw new UnidadeNaoEncontradaError(idLimpo);
    }
    return unidade;
  }

  public obterUnidadesDoProprietario(
    proprietarioId: string,
  ): readonly UnidadeCondominial[] {
    const idLimpo = proprietarioId.trim();
    const unidades = [...this.unidadesPorId.values()].filter(
      (u) => u.proprietarioId === idLimpo,
    );
    if (unidades.length === 0) {
      throw new ProprietarioSemUnidadesError(idLimpo);
    }
    return unidades;
  }
}
