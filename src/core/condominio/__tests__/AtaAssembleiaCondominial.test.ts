import { describe, expect, it } from 'vitest';
import {
  type AtaAssembleiaCondominial,
  CadastroCondominio,
  formatarAtaAssembleiaComoJson,
  formatarAtaAssembleiaComoTexto,
  gerarAtaAssembleia,
  OpcaoVotoCondominio,
  ParametrosCondominioInvalidosError,
  PautaCondominial,
  PautaNaoEncerradaParaAtaError,
  type UnidadeCondominial,
} from '../index.ts';

describe('Registro de Voto Nominal e Geração de Ata (História 2.3)', () => {
  const DATA_VOTO_1 = new Date('2026-11-24T19:05:00.000Z');
  const DATA_VOTO_2 = new Date('2026-11-24T19:10:00.000Z');
  const DATA_EMISSAO = new Date('2026-11-24T20:00:00.000Z');

  const criarUnidades = (): UnidadeCondominial[] => [
    {
      id: 'A-101',
      numero: '101',
      bloco: 'A',
      proprietarioId: 'prop-1',
      nomeTitular: 'Ana Silva',
      fracaoIdeal: 40,
    },
    {
      id: 'B-202',
      numero: '202',
      bloco: 'B',
      proprietarioId: 'prop-2',
      nomeTitular: 'Bruno Costa',
      fracaoIdeal: 60,
    },
  ];

  describe('Critério 1: Registro expresso de número da unidade, bloco, titular, data/hora e opção votada', () => {
    it('deve registrar expressamente número da unidade, bloco, titular, data/hora e opção em cada voto individual', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Aprovação das contas',
        cadastro,
      );

      const voto = pauta.registrarVotoUnidade(
        'A-101',
        OpcaoVotoCondominio.FAVORAVEL,
        DATA_VOTO_1,
      );

      expect(voto).toEqual(
        expect.objectContaining({
          unidadeId: 'A-101',
          numeroUnidade: '101',
          bloco: 'A',
          nomeTitular: 'Ana Silva',
          opcao: OpcaoVotoCondominio.FAVORAVEL,
          pesoFracaoIdeal: 40,
          registradoEm: '2026-11-24T19:05:00.000Z',
        }),
      );
    });

    it('deve registrar os dados nominais e data/hora em cada voto ao votar em bloco', () => {
      const cadastro = new CadastroCondominio([
        ...criarUnidades(),
        {
          id: 'B-203',
          numero: '203',
          bloco: 'B',
          proprietarioId: 'prop-1',
          nomeTitular: 'Ana Silva',
          fracaoIdeal: 20,
        },
      ]);
      const pauta = new PautaCondominial(
        'pauta-1',
        'Aprovação das contas',
        cadastro,
      );

      const votos = pauta.registrarVotoEmBloco(
        'prop-1',
        OpcaoVotoCondominio.CONTRARIO,
        DATA_VOTO_2,
      );

      expect(votos).toHaveLength(2);
      expect(votos[0]).toEqual(
        expect.objectContaining({
          numeroUnidade: '101',
          bloco: 'A',
          nomeTitular: 'Ana Silva',
          opcao: OpcaoVotoCondominio.CONTRARIO,
          registradoEm: '2026-11-24T19:10:00.000Z',
        }),
      );
      expect(votos[1]).toEqual(
        expect.objectContaining({
          numeroUnidade: '203',
          bloco: 'B',
          nomeTitular: 'Ana Silva',
          opcao: OpcaoVotoCondominio.CONTRARIO,
          registradoEm: '2026-11-24T19:10:00.000Z',
        }),
      );
    });
  });

  describe('Critério 2: Emissão do documento final pauta a pauta', () => {
    it('deve consolidar a ata com o resultado e a listagem nominal de votos pauta a pauta', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pauta1 = new PautaCondominial(
        'pauta-1',
        'Prestação de contas 2026',
        cadastro,
      );
      const pauta2 = new PautaCondominial(
        'pauta-2',
        'Pintura do hall de entrada',
        cadastro,
      );

      pauta1.registrarVotoUnidade(
        'A-101',
        OpcaoVotoCondominio.FAVORAVEL,
        DATA_VOTO_1,
      );
      pauta1.registrarVotoUnidade(
        'B-202',
        OpcaoVotoCondominio.CONTRARIO,
        DATA_VOTO_2,
      );
      pauta1.encerrarVotacao();

      pauta2.registrarVotoUnidade(
        'A-101',
        OpcaoVotoCondominio.FAVORAVEL,
        DATA_VOTO_1,
      );
      pauta2.registrarVotoUnidade(
        'B-202',
        OpcaoVotoCondominio.FAVORAVEL,
        DATA_VOTO_2,
      );
      pauta2.encerrarVotacao();

      const ata = gerarAtaAssembleia({
        tituloAssembleia: 'Assembleia Geral Ordinária 2026',
        pautas: [pauta1, pauta2],
        emitidaEm: DATA_EMISSAO,
      });

      expect(ata.tituloAssembleia).toBe('Assembleia Geral Ordinária 2026');
      expect(ata.emitidaEm).toBe('2026-11-24T20:00:00.000Z');
      expect(ata.pautas).toHaveLength(2);
      expect(ata.pautas[0].fracaoFavoravel).toBe(40);
      expect(ata.pautas[0].fracaoContraria).toBe(60);
      expect(ata.pautas[0].votosNominais).toEqual([
        {
          unidadeId: 'A-101',
          numeroUnidade: '101',
          bloco: 'A',
          nomeTitular: 'Ana Silva',
          opcao: 'Favoravel',
          pesoFracaoIdeal: 40,
          registradoEm: '2026-11-24T19:05:00.000Z',
        },
        {
          unidadeId: 'B-202',
          numeroUnidade: '202',
          bloco: 'B',
          nomeTitular: 'Bruno Costa',
          opcao: 'Contrario',
          pesoFracaoIdeal: 60,
          registradoEm: '2026-11-24T19:10:00.000Z',
        },
      ]);
      expect(ata.pautas[1].fracaoFavoravel).toBe(100);
      expect(ata.pautas[1].votosNominais).toHaveLength(2);
    });

    it('deve formatar a ata em texto e JSON contendo cada pauta e seus votos nominais', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Prestação de contas 2026',
        cadastro,
      );
      pauta.registrarVotoUnidade(
        'A-101',
        OpcaoVotoCondominio.FAVORAVEL,
        DATA_VOTO_1,
      );
      pauta.encerrarVotacao();

      const ata = gerarAtaAssembleia({
        tituloAssembleia: 'Assembleia Geral Ordinária 2026',
        pautas: [pauta],
        emitidaEm: DATA_EMISSAO,
      });

      const texto = formatarAtaAssembleiaComoTexto(ata);
      expect(texto).toContain('ATA DE ASSEMBLEIA CONDOMINIAL');
      expect(texto).toContain('Assembleia: Assembleia Geral Ordinária 2026');
      expect(texto).toContain('PAUTA 1: Prestação de contas 2026 (pauta-1)');
      expect(texto).toContain(
        'Bloco A | Unidade 101 | Titular: Ana Silva | Opção: Favoravel | Fração: 40 | Data/Hora: 2026-11-24T19:05:00.000Z',
      );

      const json = formatarAtaAssembleiaComoJson(ata);
      expect(JSON.parse(json) as AtaAssembleiaCondominial).toEqual(ata);
    });

    it('deve rejeitar emissão de ata quando alguma pauta ainda não foi encerrada ou dados são inválidos', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pautaAberta = new PautaCondominial(
        'pauta-1',
        'Prestação de contas 2026',
        cadastro,
      );

      expect(() =>
        gerarAtaAssembleia({
          tituloAssembleia: 'Assembleia 2026',
          pautas: [pautaAberta],
        }),
      ).toThrow(PautaNaoEncerradaParaAtaError);

      expect(() =>
        gerarAtaAssembleia({
          tituloAssembleia: '   ',
          pautas: [pautaAberta],
        }),
      ).toThrow(ParametrosCondominioInvalidosError);

      expect(() =>
        gerarAtaAssembleia({
          tituloAssembleia: 'Assembleia 2026',
          pautas: [],
        }),
      ).toThrow(ParametrosCondominioInvalidosError);
    });
  });
});
