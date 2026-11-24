import {
  ParametrosCondominioInvalidosError,
  PautaEncerradaError,
  UnidadeJaVotouError,
} from './errors/CondominioError.ts';
import {
  ehOpcaoVotoCondominio,
  OpcaoVotoCondominio,
} from './OpcaoVotoCondominio.ts';
import {
  arredondarFracao,
  type CadastroCondominio,
  type CedulaCondominialAberta,
  type UnidadeCondominial,
} from './UnidadeCondominial.ts';

export interface VotoUnidadeCondominial {
  readonly unidade: UnidadeCondominial;
  readonly opcao: OpcaoVotoCondominio;
  readonly pesoFracaoIdeal: number;
}

export interface ResultadoPonderadoPauta {
  readonly pautaId: string;
  readonly titulo: string;
  readonly encerrada: boolean;
  /** Soma das frações ideais das unidades que votaram Favorável. */
  readonly fracaoFavoravel: number;
  /** Soma das frações ideais das unidades que votaram Contrário. */
  readonly fracaoContraria: number;
  /** Soma das frações ideais das unidades que se abstiveram. */
  readonly fracaoAbstencao: number;
  /** Soma das frações ideais de todas as unidades que já votaram na pauta. */
  readonly fracaoTotalVotante: number;
  /** Fração ideal total cadastrada no condomínio. */
  readonly fracaoTotalCondominio: number;
  /** Percentual acumulado das frações favoráveis em relação ao total votante (0 a 100). */
  readonly percentualFavoravel: number;
  /** Percentual acumulado das frações contrárias em relação ao total votante (0 a 100). */
  readonly percentualContrario: number;
  /** Percentual acumulado das frações de abstenção em relação ao total votante (0 a 100). */
  readonly percentualAbstencao: number;
  readonly totalUnidadesVotantes: number;
}

/**
 * Gerencia a votação ponderada por fração ideal de uma pauta de assembleia
 * condominial, incluindo abertura de cédula, voto individual por unidade,
 * voto em bloco por proprietário e apuração preliminar/final.
 */
export class PautaCondominial {
  public readonly id: string;
  public readonly titulo: string;
  private readonly cadastro: CadastroCondominio;
  private readonly votosPorUnidade: Map<string, VotoUnidadeCondominial> =
    new Map<string, VotoUnidadeCondominial>();
  private _encerrada = false;

  constructor(id: string, titulo: string, cadastro: CadastroCondominio) {
    const idLimpo = id.trim();
    const tituloLimpo = titulo.trim();

    if (idLimpo === '' || tituloLimpo === '') {
      throw new ParametrosCondominioInvalidosError(
        'A pauta deve ter id e título não vazios.',
      );
    }

    this.id = idLimpo;
    this.titulo = tituloLimpo;
    this.cadastro = cadastro;
  }

  public get encerrada(): boolean {
    return this._encerrada;
  }

  /**
   * Recupera a fração ideal cadastrada da unidade no momento da abertura
   * da cédula.
   */
  public abrirCedulaUnidade(unidadeId: string): CedulaCondominialAberta {
    this.garantirPautaAberta();
    const unidade = this.cadastro.obterUnidade(unidadeId);
    if (this.votosPorUnidade.has(unidade.id)) {
      throw new UnidadeJaVotouError(unidade.id);
    }

    return {
      unidades: [unidade],
      fracaoIdealTotal: arredondarFracao(unidade.fracaoIdeal),
    };
  }

  /**
   * Recupera todas as unidades do proprietário e a soma de suas frações ideais
   * no momento da abertura da cédula para votação em bloco.
   */
  public abrirCedulaProprietario(
    proprietarioId: string,
  ): CedulaCondominialAberta {
    this.garantirPautaAberta();
    const unidades = this.cadastro.obterUnidadesDoProprietario(proprietarioId);

    for (const unidade of unidades) {
      if (this.votosPorUnidade.has(unidade.id)) {
        throw new UnidadeJaVotouError(unidade.id);
      }
    }

    const fracaoIdealTotal = arredondarFracao(
      unidades.reduce((soma, u) => soma + u.fracaoIdeal, 0),
    );

    return {
      unidades,
      fracaoIdealTotal,
    };
  }

  /**
   * Registra o voto de uma única unidade ponderado automaticamente pela sua
   * fração ideal.
   */
  public registrarVotoUnidade(
    unidadeId: string,
    opcao: OpcaoVotoCondominio,
  ): VotoUnidadeCondominial {
    this.validarOpcao(opcao);
    const cedula = this.abrirCedulaUnidade(unidadeId);
    const unidade = cedula.unidades[0];

    const registro: VotoUnidadeCondominial = {
      unidade,
      opcao,
      pesoFracaoIdeal: cedula.fracaoIdealTotal,
    };

    this.votosPorUnidade.set(unidade.id, registro);
    return registro;
  }

  /**
   * Registra o voto em bloco para todas as unidades pertencentes ao mesmo
   * proprietário, somando suas frações ideais correspondentes.
   */
  public registrarVotoEmBloco(
    proprietarioId: string,
    opcao: OpcaoVotoCondominio,
  ): readonly VotoUnidadeCondominial[] {
    this.validarOpcao(opcao);
    const cedula = this.abrirCedulaProprietario(proprietarioId);

    const registros: VotoUnidadeCondominial[] = cedula.unidades.map(
      (unidade) => {
        const registro: VotoUnidadeCondominial = {
          unidade,
          opcao,
          pesoFracaoIdeal: arredondarFracao(unidade.fracaoIdeal),
        };
        this.votosPorUnidade.set(unidade.id, registro);
        return registro;
      },
    );

    return registros;
  }

  /**
   * Devolve o resultado parcial acumulado das frações ideais favoráveis,
   * contrárias e abstenções enquanto a pauta está em andamento.
   */
  public obterResultadoPreliminar(): ResultadoPonderadoPauta {
    return this.calcularResultado();
  }

  /**
   * Encerra a votação da pauta e devolve o resultado final ponderado pelas
   * frações ideais.
   */
  public encerrarVotacao(): ResultadoPonderadoPauta {
    this.garantirPautaAberta();
    this._encerrada = true;
    return this.calcularResultado();
  }

  /**
   * Devolve o resultado final consolidado da pauta.
   */
  public obterResultadoFinal(): ResultadoPonderadoPauta {
    return this.calcularResultado();
  }

  public listarVotos(): readonly VotoUnidadeCondominial[] {
    return [...this.votosPorUnidade.values()];
  }

  private garantirPautaAberta(): void {
    if (this._encerrada) {
      throw new PautaEncerradaError(this.id);
    }
  }

  private validarOpcao(opcao: OpcaoVotoCondominio): void {
    if (!ehOpcaoVotoCondominio(opcao)) {
      throw new ParametrosCondominioInvalidosError(
        `A opção de voto "${String(opcao)}" é inválida.`,
      );
    }
  }

  private calcularResultado(): ResultadoPonderadoPauta {
    let favoravel = 0;
    let contrario = 0;
    let abstencao = 0;

    for (const voto of this.votosPorUnidade.values()) {
      if (voto.opcao === OpcaoVotoCondominio.FAVORAVEL) {
        favoravel += voto.pesoFracaoIdeal;
      } else if (voto.opcao === OpcaoVotoCondominio.CONTRARIO) {
        contrario += voto.pesoFracaoIdeal;
      } else {
        abstencao += voto.pesoFracaoIdeal;
      }
    }

    const fracaoFavoravel = arredondarFracao(favoravel);
    const fracaoContraria = arredondarFracao(contrario);
    const fracaoAbstencao = arredondarFracao(abstencao);
    const fracaoTotalVotante = arredondarFracao(
      fracaoFavoravel + fracaoContraria + fracaoAbstencao,
    );

    const calcularPercentual = (fracao: number): number =>
      fracaoTotalVotante > 0
        ? Math.round((fracao / fracaoTotalVotante) * 10000) / 100
        : 0;

    return {
      pautaId: this.id,
      titulo: this.titulo,
      encerrada: this._encerrada,
      fracaoFavoravel,
      fracaoContraria,
      fracaoAbstencao,
      fracaoTotalVotante,
      fracaoTotalCondominio: this.cadastro.fracaoIdealTotal,
      percentualFavoravel: calcularPercentual(fracaoFavoravel),
      percentualContrario: calcularPercentual(fracaoContraria),
      percentualAbstencao: calcularPercentual(fracaoAbstencao),
      totalUnidadesVotantes: this.votosPorUnidade.size,
    };
  }
}
