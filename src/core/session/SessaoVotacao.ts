import type { Cedula } from './Cedula.ts';
import {
  OperacaoInvalidaError,
  SessaoNaoAbertaError,
  TransicaoInvalidaError,
} from './errors/SessaoError.ts';
import { StatusSessao } from './StatusSessao.ts';

/**
 * Representa uma sessão de votação eletrônica.
 * Gerencia o ciclo de vida da sessão e o registro de votos.
 */
export class SessaoVotacao {
  public readonly id: string;
  public readonly titulo: string;
  private _status: StatusSessao;
  private _cedulas: Cedula[] = [];

  constructor(id: string, titulo: string) {
    this.id = id;
    this.titulo = titulo;
    this._status = StatusSessao.EM_CONFIGURACAO;
  }

  public get status(): StatusSessao {
    return this._status;
  }

  public get totalCedulas(): number {
    return this._cedulas.length;
  }

  /**
   * Retorna uma cópia imutável das cédulas registradas na urna.
   */
  public get cedulas(): readonly Cedula[] {
    return [...this._cedulas];
  }


  /**
   * Transiciona a sessão de EmConfiguracao para Agendada.
   */
  public agendar(): void {
    if (this._status !== StatusSessao.EM_CONFIGURACAO) {
      throw new TransicaoInvalidaError(
        `Transição inválida: não é possível agendar uma sessão com status "${this._status}".`
      );
    }
    this._status = StatusSessao.AGENDADA;
  }

  /**
   * Retorna a sessão para EmConfiguracao para ajuste de parâmetros.
   */
  public revisarConfiguracao(): void {
    if (this._status !== StatusSessao.AGENDADA) {
      throw new TransicaoInvalidaError(
        `Transição inválida: só é possível revisar configurações de uma sessão com status "${StatusSessao.AGENDADA}".`
      );
    }
    this._status = StatusSessao.EM_CONFIGURACAO;
  }

  /**
   * Transiciona a sessão de Agendada para Aberta.
   */
  public abrir(): void {
    if (this._status !== StatusSessao.AGENDADA) {
      throw new TransicaoInvalidaError(
        `Transição inválida: não é possível abrir uma sessão com status "${this._status}". A sessão deve estar agendada.`
      );
    }
    this._status = StatusSessao.ABERTA;
  }

  /**
   * Transiciona a sessão de Aberta para EmApuracao.
   */
  public iniciarApuracao(): void {
    if (this._status !== StatusSessao.ABERTA) {
      throw new TransicaoInvalidaError(
        `Transição inválida: não é possível iniciar apuração em uma sessão com status "${this._status}". A sessão precisa estar aberta.`
      );
    }
    this._status = StatusSessao.EM_APURACAO;
  }

  /**
   * Registra uma cédula de voto na urna.
   * Só é permitido quando a sessão está no estado Aberta.
   */
  public registrarVoto(cedula: Cedula): void {
    if (this._status !== StatusSessao.ABERTA) {
      throw new SessaoNaoAbertaError(
        `Tentativa de registrar voto rejeitada: a sessão está no estado "${this._status}". O voto só pode ser registrado quando a sessão estiver Aberta.`
      );
    }
    this._cedulas.push({
      ...cedula,
    });
  }

  /**
   * Cancela a sessão de votação e descarta todas as cédulas em memória.
   */
  public cancelar(): void {
    if (this._status === StatusSessao.CANCELADA) {
      throw new OperacaoInvalidaError('A sessão de votação já está cancelada.');
    }

    if (this._status === StatusSessao.EM_APURACAO) {
      throw new OperacaoInvalidaError(
        'Não é permitido cancelar uma sessão que já se encontra em apuração.'
      );
    }

    this._status = StatusSessao.CANCELADA;
    this._cedulas = [];
  }
}
