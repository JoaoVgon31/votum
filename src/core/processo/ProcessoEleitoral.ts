import {
  ApuradorTurnoUnico,
  type ResultadoApuracao,
} from '../apuracao/ApuradorTurnoUnico.ts';
import { gerarAta } from '../ata/gerarAta.ts';
import type { AtaResultado } from '../ata/AtaResultado.ts';
import type { ColegioEleitoral } from '../electorate/ColegioEleitoral.ts';
import {
  AvaliadorQuorum,
  type SessaoAvaliavelPorQuorum,
} from '../quorum/AvaliadorQuorum.ts';
import type { ResultadoQuorum } from '../quorum/EstrategiaQuorum.ts';
import type { StatusFinalSessao } from '../quorum/StatusFinalSessao.ts';
import type { Cedula } from '../session/Cedula.ts';
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

  public registrarVoto(
    sessao: SessaoVotacao,
    identificadorEleitor: string,
    cedula: Cedula,
  ): void {
    this.colegioEleitoral.verificarAptidao(identificadorEleitor);
    sessao.registrarVoto(cedula);
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
}
