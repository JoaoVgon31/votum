import {
  OperacaoInvalidaError,
  SessaoNaoAbertaError,
  TransicaoInvalidaError,
} from '../errors/SessaoError.ts';
import { StatusSessao } from '../StatusSessao.ts';

export abstract class EstadoSessao {
  public abstract readonly status: StatusSessao;

  public agendar(): StatusSessao {
    throw this.transicaoInvalida('agendar');
  }

  public revisarConfiguracao(): StatusSessao {
    throw this.transicaoInvalida('revisar a configuração');
  }

  public abrir(): StatusSessao {
    throw this.transicaoInvalida('abrir');
  }

  public iniciarApuracao(): StatusSessao {
    throw this.transicaoInvalida('iniciar a apuração');
  }

  public encerrarApuracao(): StatusSessao {
    throw this.transicaoInvalida('encerrar a apuração');
  }

  public cancelar(): StatusSessao {
    return StatusSessao.CANCELADA;
  }

  public garantirRegistroPermitido(): void {
    throw new SessaoNaoAbertaError(
      `Tentativa de registrar voto rejeitada: a sessão está no estado "${this.status}". O voto só pode ser registrado quando a sessão estiver Aberta.`,
    );
  }

  protected operacaoInvalida(mensagem: string): OperacaoInvalidaError {
    return new OperacaoInvalidaError(mensagem);
  }

  private transicaoInvalida(acao: string): TransicaoInvalidaError {
    return new TransicaoInvalidaError(
      `Transição inválida: não é possível ${acao} com a sessão no estado "${this.status}".`,
    );
  }
}
