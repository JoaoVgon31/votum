import { describe, expect, it } from 'vitest';
import { gerarRecibo } from '../../recibo/gerarRecibo.ts';
import type { Cedula } from '../../session/Cedula.ts';
import { gerarMural } from '../gerarMural.ts';

describe('gerarMural', () => {
  const criarCedula = (id: string, conteudo: string): Cedula => ({
    id,
    conteudo,
    registradoEm: new Date('2026-11-20T15:30:00.000Z'),
  });

  it('gera um item do mural (recibo e horário) para cada cédula da urna, na mesma ordem', async () => {
    const cedulas = [
      criarCedula('cedula-1', 'CHAPA_A'),
      criarCedula('cedula-2', 'CHAPA_B'),
    ];

    const mural = await gerarMural(cedulas);

    expect(mural).toEqual([
      {
        recibo: await gerarRecibo(cedulas[0]),
        registradoEm: cedulas[0].registradoEm,
      },
      {
        recibo: await gerarRecibo(cedulas[1]),
        registradoEm: cedulas[1].registradoEm,
      },
    ]);
  });

  it('gera um mural vazio quando a urna não tem cédulas', async () => {
    const mural = await gerarMural([]);

    expect(mural).toEqual([]);
  });

  it('não expõe o conteúdo do voto no item do mural', async () => {
    const mural = await gerarMural([criarCedula('cedula-1', 'CHAPA_A')]);

    expect(mural[0]).not.toHaveProperty('conteudo');
    expect(Object.keys(mural[0])).toEqual(['recibo', 'registradoEm']);
  });
});
