import { describe, expect, it } from 'vitest';
import { StatusFinalSessao } from '../../quorum/index.ts';
import {
  type AtaResultado,
  type DadosAta,
  DadosAtaInvalidosError,
  formatarAtaComoJson,
  formatarAtaComoTexto,
  gerarAta,
} from '../index.ts';

describe('Ata de resultado', () => {
  const DATA_FIXA = new Date('2026-11-20T15:30:00.000Z');

  const criarDados = (sobrescrever: Partial<DadosAta> = {}): DadosAta => ({
    titulo: 'Eleição Centro Acadêmico 2026',
    status: StatusFinalSessao.CONCLUIDA,
    vencedor: 'Chapa 1',
    totalVotos: 40,
    totalEleitores: 100,
    totalPresencas: 40,
    geradaEm: DATA_FIXA,
    ...sobrescrever,
  });

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
        criarDados({ totalPresencas: 1, totalEleitores: 6 }),
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
