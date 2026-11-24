import {
  ParametrosCondominioInvalidosError,
  PautaEncerradaError,
  UnidadeInadimplenteError,
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

export const ModoAcessoPauta = {
  VOTANTE: 'Votante',
  OUVINTE: 'Ouvinte',
} as const;

export type ModoAcessoPauta =
  (typeof ModoAcessoPauta)[keyof typeof ModoAcessoPauta];

export interface AcessoPautaCondominial {
  readonly pautaId: string;
  readonly titulo: string;
  readonly modoAcesso: ModoAcessoPauta;
  readonly podeVotar: boolean;
  readonly aviso: string | null;
  readonly unidadesAptas: readonly UnidadeCondominial[];
  readonly unidadesInadimplentes: readonly UnidadeCondominial[];
}

export interface VotoUnidadeCondominial {
  readonly unidade: UnidadeCondominial;
  readonly unidadeId: string;
  readonly numeroUnidade: string;
  readonly bloco: string;
  readonly nomeTitular: string;
  readonly opcao: OpcaoVotoCondominio;
  readonly pesoFracaoIdeal: number;
  readonly registradoEm: string;
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
 * condominial, incluindo verificação de adimplência, abertura de cédula,
 * voto individual por unidade, voto em bloco por proprietário e apuração.
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
   * Valida a situação de adimplência da unidade ao acessar a pauta.
   * Caso a unidade esteja inadimplente, restringe a votação, devolve aviso
   * explicativo e permite acesso apenas como ouvinte.
   */
  public acessarPautaUnidade(unidadeId: string): AcessoPautaCondominial {
    const unidade = this.cadastro.obterUnidade(unidadeId);

    if (unidade.adimplente === false) {
      return {
        pautaId: this.id,
        titulo: this.titulo,
        modoAcesso: ModoAcessoPauta.OUVINTE,
        podeVotar: false,
        aviso: `A unidade "${unidade.id}" possui pendências financeiras em aberto e está restrita ao acompanhamento da discussão como ouvinte, sem direito a voto.`,
        unidadesAptas: [],
        unidadesInadimplentes: [unidade],
      };
    }

    return {
      pautaId: this.id,
      titulo: this.titulo,
      modoAcesso: ModoAcessoPauta.VOTANTE,
      podeVotar: true,
      aviso: null,
      unidadesAptas: [unidade],
      unidadesInadimplentes: [],
    };
  }

  /**
   * Valida a situação de adimplência de todas as unidades vinculadas a um
   * proprietário ao acessar a pauta.
   */
  public acessarPautaProprietario(
    proprietarioId: string,
  ): AcessoPautaCondominial {
    const unidades = this.cadastro.obterUnidadesDoProprietario(proprietarioId);
    const unidadesAptas = unidades.filter((u) => u.adimplente !== false);
    const unidadesInadimplentes = unidades.filter(
      (u) => u.adimplente === false,
    );

    if (unidadesAptas.length === 0) {
      const ids = unidadesInadimplentes.map((u) => u.id).join(', ');
      return {
        pautaId: this.id,
        titulo: this.titulo,
        modoAcesso: ModoAcessoPauta.OUVINTE,
        podeVotar: false,
        aviso: `As unidades (${ids}) possuem pendências financeiras em aberto e estão restritas ao acompanhamento da discussão como ouvinte, sem direito a voto.`,
        unidadesAptas: [],
        unidadesInadimplentes,
      };
    }

    const aviso =
      unidadesInadimplentes.length > 0
        ? `As unidades (${unidadesInadimplentes.map((u) => u.id).join(', ')}) possuem pendências financeiras em aberto e foram bloqueadas para votação, permanecendo apenas como ouvintes.`
        : null;

    return {
      pautaId: this.id,
      titulo: this.titulo,
      modoAcesso: ModoAcessoPauta.VOTANTE,
      podeVotar: true,
      aviso,
      unidadesAptas,
      unidadesInadimplentes,
    };
  }

  /**
   * Permite ao administrador da sessão atualizar manualmente o status de
   * adimplência de uma unidade.
   */
  public atualizarAdimplenciaUnidade(
    unidadeId: string,
    adimplente: boolean,
  ): UnidadeCondominial {
    return this.cadastro.atualizarAdimplenciaUnidade(unidadeId, adimplente);
  }

  /**
   * Recupera a fração ideal cadastrada da unidade no momento da abertura
   * da cédula, bloqueando unidades inadimplentes.
   */
  public abrirCedulaUnidade(unidadeId: string): CedulaCondominialAberta {
    this.garantirPautaAberta();
    const unidade = this.cadastro.obterUnidade(unidadeId);
    if (unidade.adimplente === false) {
      throw new UnidadeInadimplenteError(unidade.id);
    }
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
   * no momento da abertura da cédula para votação em bloco, bloqueando caso
   * haja unidade inadimplente.
   */
  public abrirCedulaProprietario(
    proprietarioId: string,
  ): CedulaCondominialAberta {
    this.garantirPautaAberta();
    const unidades = this.cadastro.obterUnidadesDoProprietario(proprietarioId);

    for (const unidade of unidades) {
      if (unidade.adimplente === false) {
        throw new UnidadeInadimplenteError(unidade.id);
      }
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
   * fração ideal e contendo os dados nominais da unidade e titular.
   */
  public registrarVotoUnidade(
    unidadeId: string,
    opcao: OpcaoVotoCondominio,
    registradoEm: Date = new Date(),
  ): VotoUnidadeCondominial {
    this.validarOpcao(opcao);
    const cedula = this.abrirCedulaUnidade(unidadeId);
    const unidade = cedula.unidades[0];

    const registro: VotoUnidadeCondominial = {
      unidade,
      unidadeId: unidade.id,
      numeroUnidade: unidade.numero,
      bloco: unidade.bloco,
      nomeTitular: unidade.nomeTitular,
      opcao,
      pesoFracaoIdeal: cedula.fracaoIdealTotal,
      registradoEm: registradoEm.toISOString(),
    };

    this.votosPorUnidade.set(unidade.id, registro);
    return registro;
  }

  /**
   * Registra o voto em bloco para todas as unidades pertencentes ao mesmo
   * proprietário, somando suas frações ideais correspondentes e registrando
   * nominalmente cada unidade.
   */
  public registrarVotoEmBloco(
    proprietarioId: string,
    opcao: OpcaoVotoCondominio,
    registradoEm: Date = new Date(),
  ): readonly VotoUnidadeCondominial[] {
    this.validarOpcao(opcao);
    const cedula = this.abrirCedulaProprietario(proprietarioId);
    const dataIso = registradoEm.toISOString();

    const registros: VotoUnidadeCondominial[] = cedula.unidades.map(
      (unidade) => {
        const registro: VotoUnidadeCondominial = {
          unidade,
          unidadeId: unidade.id,
          numeroUnidade: unidade.numero,
          bloco: unidade.bloco,
          nomeTitular: unidade.nomeTitular,
          opcao,
          pesoFracaoIdeal: arredondarFracao(unidade.fracaoIdeal),
          registradoEm: dataIso,
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
