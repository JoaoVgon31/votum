import { describe, expect, it, vi } from 'vitest';
import {
  ApuradorTurnoUnico,
  CedulaInvalidaError,
  type DecisaoApuracao,
  type EstrategiaApuracao,
  OpcaoEspecial,
  ParametrosApuracaoInvalidosError,
} from '../index.ts';

describe('ApuradorTurnoUnico - Apuração paritária e isolamento de brancos e nulos', () => {
  /** Cria uma estratégia falsa (mock) que devolve sempre a mesma decisão. */
  const criarEstrategiaMock = (
    decisao: DecisaoApuracao = {
      vencedora: 'A',
      empate: false,
      chapasEmpatadas: [],
    },
  ) => {
    const decidir = vi.fn<EstrategiaApuracao['decidir']>();
    decidir.mockReturnValue(decisao);
    const estrategia: EstrategiaApuracao = { decidir };
    return { estrategia, decidir };
  };

  describe('Contagem paritária das cédulas', () => {
    it('deve contar um voto por cédula, com peso igual para cada chapa', () => {
      const resultado = new ApuradorTurnoUnico().apurar(
        ['A', 'B'],
        ['A', 'B', 'A', 'A', 'B'],
      );

      expect(resultado.contagens).toEqual([
        { chapa: 'A', votos: 3 },
        { chapa: 'B', votos: 2 },
      ]);
      expect(resultado.votosValidos).toBe(5);
    });

    it('deve manter na apuração a chapa que não recebeu nenhum voto', () => {
      const resultado = new ApuradorTurnoUnico().apurar(['A', 'B'], ['A', 'A']);

      expect(resultado.contagens).toEqual([
        { chapa: 'A', votos: 2 },
        { chapa: 'B', votos: 0 },
      ]);
    });

    it('deve eleger a chapa mais votada e devolver o total de cédulas lidas', () => {
      const resultado = new ApuradorTurnoUnico().apurar(
        ['A', 'B'],
        ['B', 'B', 'A', OpcaoEspecial.BRANCO],
      );

      expect(resultado.vencedora).toBe('B');
      expect(resultado.totalCedulas).toBe(4);
    });

    it('deve apurar urna vazia sem eleger ninguém', () => {
      const resultado = new ApuradorTurnoUnico().apurar(['A', 'B'], []);

      expect(resultado.vencedora).toBeNull();
      expect(resultado.votosValidos).toBe(0);
      expect(resultado.totalCedulas).toBe(0);
    });
  });

  describe('Isolamento de brancos e nulos', () => {
    it('deve somar brancos e nulos em contadores próprios', () => {
      const resultado = new ApuradorTurnoUnico().apurar(
        ['A', 'B'],
        [
          'A',
          OpcaoEspecial.BRANCO,
          OpcaoEspecial.NULO,
          OpcaoEspecial.BRANCO,
          'B',
        ],
      );

      expect(resultado.brancos).toBe(2);
      expect(resultado.nulos).toBe(1);
    });

    it('não deve somar brancos e nulos na contagem das chapas', () => {
      const resultado = new ApuradorTurnoUnico().apurar(
        ['A', 'B'],
        ['A', OpcaoEspecial.BRANCO, OpcaoEspecial.NULO],
      );

      expect(resultado.contagens).toEqual([
        { chapa: 'A', votos: 1 },
        { chapa: 'B', votos: 0 },
      ]);
      expect(resultado.votosValidos).toBe(1);
    });

    it('não deve deixar branco ou nulo vencer a eleição', () => {
      const resultado = new ApuradorTurnoUnico().apurar(
        ['A', 'B'],
        [
          OpcaoEspecial.BRANCO,
          OpcaoEspecial.BRANCO,
          OpcaoEspecial.BRANCO,
          OpcaoEspecial.NULO,
          'A',
        ],
      );

      expect(resultado.vencedora).toBe('A');
      expect(resultado.brancos).toBe(3);
    });

    it('não deve eleger ninguém em urna só de brancos e nulos', () => {
      const resultado = new ApuradorTurnoUnico().apurar(
        ['A', 'B'],
        [OpcaoEspecial.BRANCO, OpcaoEspecial.NULO],
      );

      expect(resultado.vencedora).toBeNull();
      expect(resultado.votosValidos).toBe(0);
      expect(resultado.totalCedulas).toBe(2);
    });

    it('deve fechar a conta: válidos mais brancos mais nulos somam as cédulas lidas', () => {
      const resultado = new ApuradorTurnoUnico().apurar(
        ['A', 'B', 'C'],
        ['A', 'C', OpcaoEspecial.NULO, 'B', OpcaoEspecial.BRANCO, 'A'],
      );

      expect(resultado.votosValidos + resultado.brancos + resultado.nulos).toBe(
        resultado.totalCedulas,
      );
    });
  });

  describe('Padrão Strategy: estratégia substituível', () => {
    it('deve delegar a decisão à estratégia informada, com as contagens por chapa', () => {
      const { estrategia, decidir } = criarEstrategiaMock();

      new ApuradorTurnoUnico(estrategia).apurar(
        ['A', 'B'],
        ['A', OpcaoEspecial.BRANCO, 'B', 'A'],
      );

      expect(decidir).toHaveBeenCalledTimes(1);
      expect(decidir).toHaveBeenCalledWith([
        { chapa: 'A', votos: 2 },
        { chapa: 'B', votos: 1 },
      ]);
    });

    it('não deve mostrar brancos e nulos para a estratégia', () => {
      const { estrategia, decidir } = criarEstrategiaMock();

      new ApuradorTurnoUnico(estrategia).apurar(
        ['A'],
        [OpcaoEspecial.BRANCO, OpcaoEspecial.NULO, 'A'],
      );

      expect(decidir).toHaveBeenCalledWith([{ chapa: 'A', votos: 1 }]);
    });

    it('deve devolver a decisão que veio da estratégia', () => {
      const { estrategia } = criarEstrategiaMock({
        vencedora: null,
        empate: true,
        chapasEmpatadas: ['A', 'B'],
      });

      const resultado = new ApuradorTurnoUnico(estrategia).apurar(
        ['A', 'B'],
        ['A', 'B'],
      );

      expect(resultado.vencedora).toBeNull();
      expect(resultado.empate).toBe(true);
      expect(resultado.chapasEmpatadas).toEqual(['A', 'B']);
    });
  });

  describe('Dados inválidos', () => {
    it('deve recusar cédula com chapa que não concorre', () => {
      expect(() =>
        new ApuradorTurnoUnico().apurar(['A', 'B'], ['A', 'Z']),
      ).toThrow(CedulaInvalidaError);
    });

    it('deve recusar apuração sem chapa concorrente', () => {
      expect(() => new ApuradorTurnoUnico().apurar([], ['A'])).toThrow(
        ParametrosApuracaoInvalidosError,
      );
    });

    it('deve recusar chapa repetida na lista de concorrentes', () => {
      expect(() => new ApuradorTurnoUnico().apurar(['A', 'A'], ['A'])).toThrow(
        ParametrosApuracaoInvalidosError,
      );
    });

    it('deve recusar chapa que usa o nome de voto branco ou nulo', () => {
      expect(() =>
        new ApuradorTurnoUnico().apurar(['A', OpcaoEspecial.NULO], ['A']),
      ).toThrow(ParametrosApuracaoInvalidosError);
    });

    it('não deve consultar a estratégia quando as chapas são inválidas', () => {
      const { estrategia, decidir } = criarEstrategiaMock();

      expect(() => new ApuradorTurnoUnico(estrategia).apurar([], [])).toThrow(
        ParametrosApuracaoInvalidosError,
      );
      expect(decidir).not.toHaveBeenCalled();
    });
  });
});
