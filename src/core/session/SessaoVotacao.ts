import type { Cedula } from './Cedula.ts';
import { criarEstado } from './estado/estados.ts';
import type { EstadoSessao } from './estado/EstadoSessao.ts';
import { ListaPresenca } from './ListaPresenca.ts';
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
  private readonly _listaPresenca: ListaPresenca = new ListaPresenca();

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
   * Quantidade de eleitores distintos que já tiveram presença registrada
   * nesta sessão. Fica desvinculada do conteúdo das cédulas na urna.
   */
  public get totalPresencas(): number {
    return this._listaPresenca.total;
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
   * Diz se o eleitor já tem presença registrada nesta sessão, sem revelar
   * nada sobre o conteúdo do voto.
   */
  public jaRegistrouPresenca(identificadorEleitor: string): boolean {
    return this._listaPresenca.contem(identificadorEleitor);
  }

  /**
   * Marca a presença do eleitor, desvinculada da cédula registrada na urna.
   * Rejeita um eleitor que já tenha presença registrada nesta sessão.
   */
  public registrarPresenca(identificadorEleitor: string): void {
    this._listaPresenca.registrar(identificadorEleitor);
  }

  /**
   * Cancela a sessão de votação e descarta todas as cédulas e presenças em memória.
   */
  public cancelar(): void {
    this._estado = criarEstado(this._estado.cancelar());
    this._urna.esvaziar();
    this._listaPresenca.esvaziar();
  }
}
