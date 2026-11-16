import { describe, expect, it, vi } from 'vitest';
import {
  ApuradorTurnoUnico,
  CedulaInvalidaError,
  type DecisaoApuracao,
  type EstrategiaApuracao,
  OpcaoEspecial,
  ParametrosApuracaoInvalidosError,
} from '../index.ts';

describe('ApuradorTurnoUnico - Particionamento em classes de equivalência', () => {
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

  describe('Classes de equivalência de cédulas (entrada de apurar)', () => {
    it('[Classe válida: cédula de chapa concorrente] deve contar um voto por cédula, com peso igual para cada chapa', () => {
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

    it('[Classe válida: cédula de chapa concorrente] deve manter na apuração a chapa que não recebeu nenhum voto', () => {
      const resultado = new ApuradorTurnoUnico().apurar(['A', 'B'], ['A', 'A']);

      expect(resultado.contagens).toEqual([
        { chapa: 'A', votos: 2 },
        { chapa: 'B', votos: 0 },
      ]);
    });

    it('[Classe válida: cédula de chapa concorrente] deve eleger a chapa mais votada e devolver o total de cédulas lidas', () => {
      const resultado = new ApuradorTurnoUnico().apurar(
        ['A', 'B'],
        ['B', 'B', 'A', OpcaoEspecial.BRANCO],
      );

      expect(resultado.vencedora).toBe('B');
      expect(resultado.totalCedulas).toBe(4);
    });

    it('[Classe válida: cédula BRANCO] deve somar cédulas BRANCO em contador próprio sem atribuir voto às chapas', () => {
      const resultado = new ApuradorTurnoUnico().apurar(
        ['A', 'B'],
        ['A', OpcaoEspecial.BRANCO, OpcaoEspecial.BRANCO],
      );

      expect(resultado.brancos).toBe(2);
      expect(resultado.nulos).toBe(0);
      expect(resultado.contagens).toEqual([
        { chapa: 'A', votos: 1 },
        { chapa: 'B', votos: 0 },
      ]);
      expect(resultado.votosValidos).toBe(1);
    });

    it('[Classe válida: cédula NULO] deve somar cédulas NULO em contador próprio sem atribuir voto às chapas', () => {
      const resultado = new ApuradorTurnoUnico().apurar(
        ['A', 'B'],
        ['A', OpcaoEspecial.NULO, OpcaoEspecial.NULO],
      );

      expect(resultado.nulos).toBe(2);
      expect(resultado.brancos).toBe(0);
      expect(resultado.contagens).toEqual([
        { chapa: 'A', votos: 1 },
        { chapa: 'B', votos: 0 },
      ]);
      expect(resultado.votosValidos).toBe(1);
    });

    it('[Classe válida: cédulas BRANCO e NULO] deve isolar brancos e nulos em contadores próprios', () => {
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

    it('[Classe válida: cédulas BRANCO e NULO] não deve somar brancos e nulos na contagem das chapas', () => {
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

    it('[Classe válida: cédulas BRANCO e NULO] não deve deixar branco ou nulo vencer a eleição', () => {
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

    it('[Classe válida: cédulas BRANCO e NULO] não deve eleger ninguém em urna só de brancos e nulos', () => {
      const resultado = new ApuradorTurnoUnico().apurar(
        ['A', 'B'],
        [OpcaoEspecial.BRANCO, OpcaoEspecial.NULO],
      );

      expect(resultado.vencedora).toBeNull();
      expect(resultado.votosValidos).toBe(0);
      expect(resultado.totalCedulas).toBe(2);
    });

    it('[Classe válida: cédulas mistas] deve fechar a conta: válidos mais brancos mais nulos somam as cédulas lidas', () => {
      const resultado = new ApuradorTurnoUnico().apurar(
        ['A', 'B', 'C'],
        ['A', 'C', OpcaoEspecial.NULO, 'B', OpcaoEspecial.BRANCO, 'A'],
      );

      expect(resultado.votosValidos + resultado.brancos + resultado.nulos).toBe(
        resultado.totalCedulas,
      );
    });

    it('[Classe válida: lista de cédulas vazia] deve apurar urna vazia sem eleger ninguém', () => {
      const resultado = new ApuradorTurnoUnico().apurar(['A', 'B'], []);

      expect(resultado.vencedora).toBeNull();
      expect(resultado.votosValidos).toBe(0);
      expect(resultado.totalCedulas).toBe(0);
    });

    it('[Classe inválida: cédula fora das chapas, BRANCO ou NULO] deve recusar cédula com chapa que não concorre', () => {
      expect(() =>
        new ApuradorTurnoUnico().apurar(['A', 'B'], ['A', 'Z']),
      ).toThrow(CedulaInvalidaError);
    });
  });

  describe('Classes de equivalência de chapas (entrada de apurar)', () => {
    it('[Classe válida: lista com chapas únicas, não vazias e não reservadas] deve apurar normalmente', () => {
      const resultado = new ApuradorTurnoUnico().apurar(
        ['A', 'B'],
        ['A', 'A', 'B'],
      );

      expect(resultado.vencedora).toBe('A');
      expect(resultado.votosValidos).toBe(3);
    });

    it('[Classe inválida: lista vazia] deve recusar apuração sem chapa concorrente', () => {
      expect(() => new ApuradorTurnoUnico().apurar([], ['A'])).toThrow(
        ParametrosApuracaoInvalidosError,
      );
    });

    it('[Classe inválida: chapa repetida] deve recusar chapa repetida na lista de concorrentes', () => {
      expect(() => new ApuradorTurnoUnico().apurar(['A', 'A'], ['A'])).toThrow(
        ParametrosApuracaoInvalidosError,
      );
    });

    it('[Classe inválida: nome reservado BRANCO ou NULO] deve recusar chapa que usa o nome de voto branco ou nulo', () => {
      expect(() =>
        new ApuradorTurnoUnico().apurar(['A', OpcaoEspecial.NULO], ['A']),
      ).toThrow(ParametrosApuracaoInvalidosError);
    });

    it('[Classe inválida: nome reservado BRANCO] deve recusar chapa com a string literal "BRANCO"', () => {
      expect(() =>
        new ApuradorTurnoUnico().apurar(['A', 'BRANCO'], ['A']),
      ).toThrow(ParametrosApuracaoInvalidosError);
    });

    it('[Classe inválida: nome reservado NULO] deve recusar chapa com a string literal "NULO"', () => {
      expect(() =>
        new ApuradorTurnoUnico().apurar(['A', 'NULO'], ['A']),
      ).toThrow(ParametrosApuracaoInvalidosError);
    });

    it('[Classe inválida: identificador vazio] deve recusar chapa com identificador vazio', () => {
      expect(() => new ApuradorTurnoUnico().apurar(['', 'B'], ['', 'B'])).toThrow(
        ParametrosApuracaoInvalidosError,
      );
    });

    it('[Classe inválida: identificador composto só de espaços] deve recusar chapa com identificador composto apenas por espaços', () => {
      expect(() =>
        new ApuradorTurnoUnico().apurar(['   ', 'B'], ['B']),
      ).toThrow(ParametrosApuracaoInvalidosError);
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

    it('não deve consultar a estratégia quando as chapas são inválidas', () => {
      const { estrategia, decidir } = criarEstrategiaMock();

      expect(() => new ApuradorTurnoUnico(estrategia).apurar([], [])).toThrow(
        ParametrosApuracaoInvalidosError,
      );
      expect(decidir).not.toHaveBeenCalled();
    });
  });
});
