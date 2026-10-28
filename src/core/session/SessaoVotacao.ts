import type { Cedula } from './Cedula.ts';
import { criarEstado } from './estado/estados.ts';
import type { EstadoSessao } from './estado/EstadoSessao.ts';
import { Urna } from './Urna.ts';
import { StatusSessao } from './StatusSessao.ts';

/**
 * Representa uma sessão de votação eletrônica.
 * Gerencia o ciclo de vida da sessão e o registro de votos.
 */
export class SessaoVotacao {
  public readonly id: string;
  public readonly titulo: string;
  private _estado: EstadoSessao;
  private readonly _urna: Urna = new Urna();

  constructor(id: string, titulo: string) {
    this.id = id;
    this.titulo = titulo;
    this._estado = criarEstado(StatusSessao.EM_CONFIGURACAO);
  }

  public get status(): StatusSessao {
    return this._estado.status;
  }

  public get totalCedulas(): number {
    return this._urna.total;
  }

  /**
   * Retorna uma cópia imutável das cédulas registradas na urna.
   */
  public get cedulas(): readonly Cedula[] {
    return this._urna.listar();
  }

  /**
   * Transiciona a sessão de EmConfiguracao para Agendada.
   */
  public agendar(): void {
    this._estado = criarEstado(this._estado.agendar());
  }

  /**
   * Retorna a sessão para EmConfiguracao para ajuste de parâmetros.
   */
  public revisarConfiguracao(): void {
    this._estado = criarEstado(this._estado.revisarConfiguracao());
  }

  /**
   * Transiciona a sessão de Agendada para Aberta.
   */
  public abrir(): void {
    this._estado = criarEstado(this._estado.abrir());
  }

  /**
   * Transiciona a sessão de Aberta para EmApuracao.
   */
  public iniciarApuracao(): void {
    this._estado = criarEstado(this._estado.iniciarApuracao());
  }

  /**
   * Transiciona a sessão de EmApuracao para Concluida.
   */
  public encerrarApuracao(): void {
    this._estado = criarEstado(this._estado.encerrarApuracao());
  }

  /**
   * Registra uma cédula de voto na urna.
   * Só é permitido quando a sessão está no estado Aberta.
   * Rejeita cédulas duplicadas cujo ID já conste na sessão.
   */
  public registrarVoto(cedula: Cedula): void {
    this._estado.garantirRegistroPermitido();
    this._urna.registrar(cedula);
  }

  /**
   * Cancela a sessão de votação e descarta todas as cédulas em memória.
   */
  public cancelar(): void {
    this._estado = criarEstado(this._estado.cancelar());
    this._urna.esvaziar();
  }
}
