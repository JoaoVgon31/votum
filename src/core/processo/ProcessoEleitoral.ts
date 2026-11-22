import {
  ApuradorTurnoUnico,
  type ResultadoApuracao,
} from '../apuracao/ApuradorTurnoUnico.ts';
import type { AtaResultado } from '../ata/AtaResultado.ts';
import { gerarAta } from '../ata/gerarAta.ts';
import type { ColegioEleitoral } from '../electorate/ColegioEleitoral.ts';
import { gerarMural } from '../mural/gerarMural.ts';
import type { ItemMural } from '../mural/ItemMural.ts';
import {
  AvaliadorQuorum,
  type SessaoAvaliavelPorQuorum,
} from '../quorum/AvaliadorQuorum.ts';
import type { ResultadoQuorum } from '../quorum/EstrategiaQuorum.ts';
import type { StatusFinalSessao } from '../quorum/StatusFinalSessao.ts';
import { gerarRecibo } from '../recibo/gerarRecibo.ts';
import type { Cedula } from '../session/Cedula.ts';
import { EleitorJaVotouError } from '../session/errors/SessaoError.ts';
import type { SessaoVotacao } from '../session/SessaoVotacao.ts';

export interface ResultadoProcesso {
  resultadoQuorum: ResultadoQuorum;
  resultadoApuracao: ResultadoApuracao;
  ata: AtaResultado;
}

export class ProcessoEleitoral {
  private readonly colegioEleitoral: ColegioEleitoral;
  private readonly avaliadorQuorum: AvaliadorQuorum;
  private readonly apurador: ApuradorTurnoUnico;

  constructor(
    colegioEleitoral: ColegioEleitoral,
    avaliadorQuorum: AvaliadorQuorum = new AvaliadorQuorum(),
    apurador: ApuradorTurnoUnico = new ApuradorTurnoUnico(),
  ) {
    this.colegioEleitoral = colegioEleitoral;
    this.avaliadorQuorum = avaliadorQuorum;
    this.apurador = apurador;
  }

  /**
   * Registra o voto e devolve um comprovante: um hash derivado da própria
   * cédula selada, desvinculado do eleitor, que serve só para o eleitor
   * conferir depois que seu voto foi depositado.
   */
  public async registrarVoto(
    sessao: SessaoVotacao,
    identificadorEleitor: string,
    cedula: Cedula,
  ): Promise<string> {
    this.colegioEleitoral.verificarAptidao(identificadorEleitor);
    if (sessao.jaRegistrouPresenca(identificadorEleitor)) {
      throw new EleitorJaVotouError(identificadorEleitor);
    }
    sessao.registrarVoto(cedula);
    sessao.registrarPresenca(identificadorEleitor);
    return gerarRecibo(cedula);
  }

  public apurarResultado(
    sessao: SessaoVotacao,
    chapas: readonly string[],
    totalEleitores: number,
  ): ResultadoProcesso {
    let statusFinal!: StatusFinalSessao;
    const sessaoParaQuorum: SessaoAvaliavelPorQuorum = {
      obterTotalPresencas: () => sessao.totalCedulas,
      obterTotalEleitores: () => totalEleitores,
      declararStatusFinal: (status) => {
        statusFinal = status;
      },
    };

    const resultadoQuorum = this.avaliadorQuorum.avaliar(sessaoParaQuorum);
    const resultadoApuracao = this.apurador.apurar(
      chapas,
      sessao.cedulas.map((cedula) => cedula.conteudo),
    );

    const ata = gerarAta({
      titulo: sessao.titulo,
      status: statusFinal,
      vencedor: resultadoApuracao.vencedora,
      totalVotos: resultadoApuracao.votosValidos,
      totalEleitores,
      totalPresencas: sessao.totalCedulas,
      resultadoQuorum,
    });

    return { resultadoQuorum, resultadoApuracao, ata };
  }

  public gerarMuralPublico(
    sessao: SessaoVotacao,
  ): Promise<readonly ItemMural[]> {
    return gerarMural(sessao.cedulas);
  }
}
