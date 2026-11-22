import { describe, expect, it } from 'vitest';
import type { ItemMural } from '../ItemMural.ts';
import { formatarMuralComoJson } from '../formatarMuralComoJson.ts';

describe('formatarMuralComoJson', () => {
  it('serializa todos os itens do mural, incluindo recibo e horário', () => {
    const mural: readonly ItemMural[] = [
      { recibo: 'hash-1', registradoEm: new Date('2026-11-20T15:30:00.000Z') },
      { recibo: 'hash-2', registradoEm: new Date('2026-11-20T15:31:00.000Z') },
    ];

    const json = formatarMuralComoJson(mural);

    expect(JSON.parse(json)).toEqual([
      { recibo: 'hash-1', registradoEm: '2026-11-20T15:30:00.000Z' },
      { recibo: 'hash-2', registradoEm: '2026-11-20T15:31:00.000Z' },
    ]);
  });
});
