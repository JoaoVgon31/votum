/** Representa uma cédula eletrônica registrada na urna de votação. */
export interface Cedula {
  /** Identificador único da cédula. */
  id: string;
  /** Conteúdo do voto registrado. */
  conteudo: string;
  /** Timestamp de registro da cédula na urna. */
  registradoEm: Date;
}
