import { describe, expect, it } from 'vitest';
import type { Cedula } from '../../session/Cedula.ts';
import { gerarRecibo } from '../gerarRecibo.ts';

describe('gerarRecibo', () => {
  const criarCedula = (sobrescrever: Partial<Cedula> = {}): Cedula => ({
    id: 'cedula-1',
    conteudo: 'CHAPA_A',
    registradoEm: new Date('2026-11-20T15:30:00.000Z'),
    ...sobrescrever,
  });

  it('gera um recibo hexadecimal de 64 caracteres (SHA-256) para a cédula', async () => {
    const recibo = await gerarRecibo(criarCedula());

    expect(recibo).toMatch(/^[0-9a-f]{64}$/);
  });

  it('é determinístico: a mesma cédula sempre gera o mesmo recibo', async () => {
    const cedula = criarCedula();

    const recibo1 = await gerarRecibo(cedula);
    const recibo2 = await gerarRecibo(cedula);

    expect(recibo1).toBe(recibo2);
  });

  it('gera recibos diferentes para cédulas com o mesmo conteúdo mas ids diferentes', async () => {
    const recibo1 = await gerarRecibo(criarCedula({ id: 'cedula-1' }));
    const recibo2 = await gerarRecibo(criarCedula({ id: 'cedula-2' }));

    expect(recibo1).not.toBe(recibo2);
  });

  it('não deve ser reproduzível a partir do conteúdo isolado, para não expor a escolha do eleitor', async () => {
    const recibo = await gerarRecibo(criarCedula({ conteudo: 'CHAPA_A' }));

    const digestDoConteudoIsolado = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode('CHAPA_A'),
    );
    const hashDoConteudoIsolado = [...new Uint8Array(digestDoConteudoIsolado)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');

    expect(recibo).not.toBe(hashDoConteudoIsolado);
  });
});
