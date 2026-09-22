import { describe, expect, it, vi } from 'vitest';
import {
  AvaliadorQuorum,
  type EstrategiaQuorum,
  ParametrosQuorumInvalidosError,
  type ResultadoQuorum,
  type SessaoAvaliavelPorQuorum,
  StatusFinalSessao,
} from '../index.ts';

describe('AvaliadorQuorum - Mudança de estado da sessão conforme o quórum', () => {
  /** Cria uma sessão falsa (mock) que apenas registra o status final declarado. */
  const criarSessaoMock = (totalPresencas: number, totalEleitores: number) => {
    const declararStatusFinal = vi.fn<(status: StatusFinalSessao) => void>();
    const sessao: SessaoAvaliavelPorQuorum = {
      obterTotalPresencas: () => totalPresencas,
      obterTotalEleitores: () => totalEleitores,
      declararStatusFinal,
    };
    return { sessao, declararStatusFinal };
  };

  describe('Estratégia padrão (20%)', () => {
    it('deve declarar a sessão como Deserta com participação abaixo de 20%', () => {
      const { sessao, declararStatusFinal } = criarSessaoMock(19, 100);

      const resultado = new AvaliadorQuorum().avaliar(sessao);

      expect(declararStatusFinal).toHaveBeenCalledTimes(1);
      expect(declararStatusFinal).toHaveBeenCalledWith(
        StatusFinalSessao.DESERTA,
      );
      expect(resultado.atingido).toBe(false);
    });

    it('deve declarar a sessão como Concluida com participação exatamente igual a 20%', () => {
      const { sessao, declararStatusFinal } = criarSessaoMock(20, 100);

      const resultado = new AvaliadorQuorum().avaliar(sessao);

      expect(declararStatusFinal).toHaveBeenCalledTimes(1);
      expect(declararStatusFinal).toHaveBeenCalledWith(
        StatusFinalSessao.CONCLUIDA,
      );
      expect(resultado.atingido).toBe(true);
    });

    it('deve declarar a sessão como Concluida com participação acima de 20%', () => {
      const { sessao, declararStatusFinal } = criarSessaoMock(75, 100);

      new AvaliadorQuorum().avaliar(sessao);

      expect(declararStatusFinal).toHaveBeenCalledWith(
        StatusFinalSessao.CONCLUIDA,
      );
    });

    it('deve declarar a sessão como Deserta quando ninguém votou', () => {
      const { sessao, declararStatusFinal } = criarSessaoMock(0, 100);

      new AvaliadorQuorum().avaliar(sessao);

      expect(declararStatusFinal).toHaveBeenCalledWith(
        StatusFinalSessao.DESERTA,
      );
    });

    it('deve retornar o resultado detalhado da verificação de quórum', () => {
      const { sessao } = criarSessaoMock(10, 100);

      const resultado = new AvaliadorQuorum().avaliar(sessao);

      expect(resultado.participacao).toBeCloseTo(10);
      expect(resultado.percentualMinimo).toBe(20);
    });
  });

  describe('Padrão Strategy: estratégia substituível', () => {
    const criarEstrategiaMock = (resultado: ResultadoQuorum) => {
      const verificar = vi.fn<EstrategiaQuorum['verificar']>();
      verificar.mockReturnValue(resultado);
      const estrategia: EstrategiaQuorum = { verificar };
      return { estrategia, verificar };
    };

    it('deve delegar o cálculo à estratégia informada, com presenças e total de eleitores', () => {
      const { sessao } = criarSessaoMock(7, 30);
      const { estrategia, verificar } = criarEstrategiaMock({
        atingido: true,
        participacao: 23.33,
        percentualMinimo: 20,
      });

      new AvaliadorQuorum(estrategia).avaliar(sessao);

      expect(verificar).toHaveBeenCalledTimes(1);
      expect(verificar).toHaveBeenCalledWith(7, 30);
    });

    it('deve declarar Concluida quando a estratégia informa quórum atingido', () => {
      const { sessao, declararStatusFinal } = criarSessaoMock(1, 100);
      const { estrategia } = criarEstrategiaMock({
        atingido: true,
        participacao: 1,
        percentualMinimo: 1,
      });

      new AvaliadorQuorum(estrategia).avaliar(sessao);

      expect(declararStatusFinal).toHaveBeenCalledWith(
        StatusFinalSessao.CONCLUIDA,
      );
    });

    it('deve declarar Deserta quando a estratégia informa quórum não atingido', () => {
      const { sessao, declararStatusFinal } = criarSessaoMock(99, 100);
      const { estrategia } = criarEstrategiaMock({
        atingido: false,
        participacao: 99,
        percentualMinimo: 100,
      });

      new AvaliadorQuorum(estrategia).avaliar(sessao);

      expect(declararStatusFinal).toHaveBeenCalledWith(
        StatusFinalSessao.DESERTA,
      );
    });
  });

  describe('Dados inválidos', () => {
    it('não deve alterar o estado da sessão quando o colégio eleitoral está vazio', () => {
      const { sessao, declararStatusFinal } = criarSessaoMock(0, 0);

      expect(() => new AvaliadorQuorum().avaliar(sessao)).toThrow(
        ParametrosQuorumInvalidosError,
      );
      expect(declararStatusFinal).not.toHaveBeenCalled();
    });
  });
});
