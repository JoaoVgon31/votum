import { StatusSessao } from '../StatusSessao.ts';
import { EstadoSessao } from './EstadoSessao.ts';

class EmConfiguracaoState extends EstadoSessao {
  public readonly status = StatusSessao.EM_CONFIGURACAO;

  public override agendar(): StatusSessao {
    return StatusSessao.AGENDADA;
  }
}

class AgendadaState extends EstadoSessao {
  public readonly status = StatusSessao.AGENDADA;

  public override revisarConfiguracao(): StatusSessao {
    return StatusSessao.EM_CONFIGURACAO;
  }

  public override abrir(): StatusSessao {
    return StatusSessao.ABERTA;
  }
}

class AbertaState extends EstadoSessao {
  public readonly status = StatusSessao.ABERTA;

  public override iniciarApuracao(): StatusSessao {
    return StatusSessao.EM_APURACAO;
  }

  public override garantirRegistroPermitido(): void {
    // Sessão Aberta: registro de voto é permitido.
  }
}

class EmApuracaoState extends EstadoSessao {
  public readonly status = StatusSessao.EM_APURACAO;

  public override encerrarApuracao(): StatusSessao {
    return StatusSessao.CONCLUIDA;
  }

  public override cancelar(): StatusSessao {
    throw this.operacaoInvalida(
      'Não é permitido cancelar uma sessão que já se encontra em apuração.',
    );
  }
}

class ConcluidaState extends EstadoSessao {
  public readonly status = StatusSessao.CONCLUIDA;

  public override cancelar(): StatusSessao {
    throw this.operacaoInvalida(
      'Não é permitido cancelar uma sessão que já foi concluída.',
    );
  }
}

class CanceladaState extends EstadoSessao {
  public readonly status = StatusSessao.CANCELADA;

  public override cancelar(): StatusSessao {
    throw this.operacaoInvalida('A sessão de votação já está cancelada.');
  }
}

const estadosPorStatus: Record<StatusSessao, () => EstadoSessao> = {
  [StatusSessao.EM_CONFIGURACAO]: () => new EmConfiguracaoState(),
  [StatusSessao.AGENDADA]: () => new AgendadaState(),
  [StatusSessao.ABERTA]: () => new AbertaState(),
  [StatusSessao.EM_APURACAO]: () => new EmApuracaoState(),
  [StatusSessao.CONCLUIDA]: () => new ConcluidaState(),
  [StatusSessao.CANCELADA]: () => new CanceladaState(),
};

export function criarEstado(status: StatusSessao): EstadoSessao {
  return estadosPorStatus[status]();
}
