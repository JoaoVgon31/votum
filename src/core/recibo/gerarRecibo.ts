import type { Cedula } from '../session/Cedula.ts';

function paraHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Gera o recibo de uma cédula: um hash SHA-256, em hexadecimal, derivado
 * da cédula selada (id, conteúdo e timestamp).
 */
export async function gerarRecibo(cedula: Cedula): Promise<string> {
  const mensagem = `${cedula.id}|${cedula.conteudo}|${cedula.registradoEm.toISOString()}`;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(mensagem),
  );
  return paraHex(digest);
}
