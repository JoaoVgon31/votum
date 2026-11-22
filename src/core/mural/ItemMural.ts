/**
 * Entrada pública do mural de auditoria: só o recibo e o horário do
 * depósito. Nunca o conteúdo do voto nem o identificador do eleitor, que
 * continuam desvinculados da cédula no restante do núcleo.
 */
export interface ItemMural {
  recibo: string;
  registradoEm: Date;
}
