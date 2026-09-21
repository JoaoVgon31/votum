import { describe, expect, it } from 'vitest';
import type { ResultadoQuorum } from '../../quorum/EstrategiaQuorum.ts';
import { StatusFinalSessao } from '../../quorum/index.ts';
import {
  type AtaResultado,
  type DadosAta,
  DadosAtaInvalidosError,
  formatarAtaComoJson,
  formatarAtaComoTexto,
  gerarAta,
} from '../index.ts';

/**
 * Monta um ResultadoQuorum equivalente ao que o AvaliadorQuorum produziria,
 * sem passar pelas validações da estratégia. Os testes de dados inválidos
 * desta suíte querem que a validação aconteça dentro de gerarAta, não aqui
 * no preparo da massa de teste.
 */
function calcularResultadoQuorum(
  totalPresencas: number,
  totalEleitores: number,
  percentualMinimo = 20,
): ResultadoQuorum {
  const participacao =
    totalEleitores > 0 ? (totalPresencas / totalEleitores) * 100 : 0;

  return {
    atingido: participacao >= percentualMinimo,
    participacao,
    percentualMinimo,
  };
}

describe('Ata de resultado', () => {
  const DATA_FIXA = new Date('2026-11-20T15:30:00.000Z');

  const criarDados = (sobrescrever: Partial<DadosAta> = {}): DadosAta => {
    const totalPresencas = sobrescrever.totalPresencas ?? 40;
    const totalEleitores = sobrescrever.totalEleitores ?? 100;

    return {
      titulo: 'Eleição Centro Acadêmico 2026',
      status: StatusFinalSessao.CONCLUIDA,
      vencedor: 'Chapa 1',
      totalVotos: 40,
      totalEleitores,
      totalPresencas,
      resultadoQuorum: calcularResultadoQuorum(totalPresencas, totalEleitores),
      geradaEm: DATA_FIXA,
      ...sobrescrever,
    };
  };

  describe('gerarAta - consolidação dos dados', () => {
    it('deve consolidar status, vencedor e total de votos', () => {
      const ata = gerarAta(criarDados());

      expect(ata).toEqual({
        titulo: 'Eleição Centro Acadêmico 2026',
        status: 'Concluida',
        vencedor: 'Chapa 1',
        totalVotos: 40,
        totalEleitores: 100,
        totalPresencas: 40,
        participacao: 40,
        geradaEm: '2026-11-20T15:30:00.000Z',
      });
    });

    it('deve calcular a participação com duas casas decimais', () => {
      const ata = gerarAta(
        criarDados({ totalPresencas: 1, totalEleitores: 6, totalVotos: 1 }),
      );

      expect(ata.participacao).toBe(16.67);
    });

    it('não deve declarar vencedor quando a sessão é Deserta', () => {
      const ata = gerarAta(
        criarDados({
          status: StatusFinalSessao.DESERTA,
          vencedor: 'Chapa 1',
          totalPresencas: 5,
          totalVotos: 5,
        }),
      );

      expect(ata.status).toBe('Deserta');
      expect(ata.vencedor).toBeNull();
    });

    it('deve preencher a data de emissão quando não informada', () => {
      const ata = gerarAta(criarDados({ geradaEm: undefined }));

      expect(Number.isNaN(Date.parse(ata.geradaEm))).toBe(false);
    });
  });

  describe('gerarAta - validação', () => {
    it('deve rejeitar título vazio', () => {
      expect(() => gerarAta(criarDados({ titulo: '   ' }))).toThrow(
        DadosAtaInvalidosError,
      );
    });

    it('deve rejeitar colégio eleitoral vazio', () => {
      expect(() => gerarAta(criarDados({ totalEleitores: 0 }))).toThrow(
        DadosAtaInvalidosError,
      );
    });

    it('deve rejeitar presenças maiores que o total de eleitores', () => {
      expect(() =>
        gerarAta(criarDados({ totalPresencas: 101, totalEleitores: 100 })),
      ).toThrow(DadosAtaInvalidosError);
    });

    it('deve rejeitar total de presenças negativo', () => {
      expect(() => gerarAta(criarDados({ totalPresencas: -1 }))).toThrow(
        DadosAtaInvalidosError,
      );
    });

    it('deve rejeitar total de votos negativo', () => {
      expect(() => gerarAta(criarDados({ totalVotos: -1 }))).toThrow(
        DadosAtaInvalidosError,
      );
    });

    it('deve rejeitar total de votos maior que o total de presenças', () => {
      // Cada eleitor presente registra no máximo uma cédula (Issue 3).
      expect(() =>
        gerarAta(
          criarDados({ totalPresencas: 30, totalVotos: 31, totalEleitores: 100 }),
        ),
      ).toThrow(DadosAtaInvalidosError);
    });

    it('deve aceitar total de votos igual ao total de presenças', () => {
      expect(() =>
        gerarAta(
          criarDados({ totalPresencas: 30, totalVotos: 30, totalEleitores: 100 }),
        ),
      ).not.toThrow();
    });
  });

  describe('integração com o AvaliadorQuorum', () => {
    it('deve usar a mesma participação calculada pelo AvaliadorQuorum, sem recalcular', () => {
      const resultadoQuorum = calcularResultadoQuorum(1, 6);
      const ata = gerarAta(
        criarDados({
          totalPresencas: 1,
          totalEleitores: 6,
          totalVotos: 1,
          resultadoQuorum,
        }),
      );

      expect(ata.participacao).toBe(
        Math.round(resultadoQuorum.participacao * 100) / 100,
      );
    });
  });

  describe('formatarAtaComoTexto', () => {
    it('deve produzir um relatório textual com todas as informações da ata', () => {
      const texto = formatarAtaComoTexto(gerarAta(criarDados()));

      expect(texto).toContain('ATA DE RESULTADO');
      expect(texto).toContain('Sessão: Eleição Centro Acadêmico 2026');
      expect(texto).toContain('Status final: Concluida');
      expect(texto).toContain('Vencedor: Chapa 1');
      expect(texto).toContain('Total de votos: 40');
      expect(texto).toContain('Eleitores aptos: 100');
      expect(texto).toContain('Presenças registradas: 40');
      expect(texto).toContain('Participação: 40,00%');
    });

    it('deve informar a ausência de vencedor e a observação de sessão deserta', () => {
      const texto = formatarAtaComoTexto(
        gerarAta(
          criarDados({
            status: StatusFinalSessao.DESERTA,
            totalPresencas: 10,
            totalVotos: 10,
          }),
        ),
      );

      expect(texto).toContain('Status final: Deserta');
      expect(texto).toContain('Vencedor: Não há vencedor declarado');
      expect(texto).toContain('quórum mínimo');
    });

    it('não deve incluir a observação de sessão deserta em sessões concluídas', () => {
      const texto = formatarAtaComoTexto(gerarAta(criarDados()));

      expect(texto).not.toContain('Observação');
    });
  });

  describe('formatarAtaComoJson', () => {
    it('deve gerar um JSON válido equivalente à ata', () => {
      const ata = gerarAta(criarDados());

      const json = formatarAtaComoJson(ata);

      expect(JSON.parse(json) as AtaResultado).toEqual(ata);
    });
  });
});
