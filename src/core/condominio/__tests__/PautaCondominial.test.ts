import { describe, expect, it } from 'vitest';
import {
  CadastroCondominio,
  OpcaoVotoCondominio,
  ParametrosCondominioInvalidosError,
  PautaCondominial,
  PautaEncerradaError,
  ProprietarioSemUnidadesError,
  UnidadeJaVotouError,
  UnidadeNaoEncontradaError,
  type UnidadeCondominial,
} from '../index.ts';

describe('PautaCondominial - Votação ponderada por fração ideal (História 2.1)', () => {
  const criarUnidadesBase = (): UnidadeCondominial[] => [
    {
      id: 'A-101',
      numero: '101',
      bloco: 'A',
      proprietarioId: 'prop-1',
      nomeTitular: 'Ana Silva',
      fracaoIdeal: 15.5,
    },
    {
      id: 'A-102',
      numero: '102',
      bloco: 'A',
      proprietarioId: 'prop-2',
      nomeTitular: 'Bruno Costa',
      fracaoIdeal: 24.5,
    },
    {
      id: 'B-201',
      numero: '201',
      bloco: 'B',
      proprietarioId: 'prop-1',
      nomeTitular: 'Ana Silva',
      fracaoIdeal: 30,
    },
    {
      id: 'B-202',
      numero: '202',
      bloco: 'B',
      proprietarioId: 'prop-3',
      nomeTitular: 'Carla Souza',
      fracaoIdeal: 30,
    },
  ];

  describe('Critério 1: Recuperação da fração ideal na abertura da cédula', () => {
    it('deve recuperar a fração ideal cadastrada da unidade ao abrir a cédula', () => {
      const cadastro = new CadastroCondominio(criarUnidadesBase());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Reforma da fachada',
        cadastro,
      );

      const cedula = pauta.abrirCedulaUnidade('A-101');

      expect(cedula.fracaoIdealTotal).toBe(15.5);
      expect(cedula.unidades).toHaveLength(1);
      expect(cedula.unidades[0].id).toBe('A-101');
    });

    it('deve aplicar a fração ideal da unidade automaticamente ao registrar o voto', () => {
      const cadastro = new CadastroCondominio(criarUnidadesBase());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Reforma da fachada',
        cadastro,
      );

      const voto = pauta.registrarVotoUnidade(
        'A-102',
        OpcaoVotoCondominio.FAVORAVEL,
      );

      expect(voto.pesoFracaoIdeal).toBe(24.5);
      expect(voto.opcao).toBe(OpcaoVotoCondominio.FAVORAVEL);
    });

    it('deve lançar erro ao abrir cédula para unidade inexistente', () => {
      const cadastro = new CadastroCondominio(criarUnidadesBase());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Reforma da fachada',
        cadastro,
      );

      expect(() => pauta.abrirCedulaUnidade('C-999')).toThrow(
        UnidadeNaoEncontradaError,
      );
    });
  });

  describe('Critério 2: Soma acumulada de frações favoráveis, contrárias e abstenções', () => {
    it('deve somar as frações e percentuais acumulados no resultado preliminar e no resultado final', () => {
      const cadastro = new CadastroCondominio(criarUnidadesBase());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Aprovação do orçamento anual',
        cadastro,
      );

      pauta.registrarVotoUnidade('A-101', OpcaoVotoCondominio.FAVORAVEL); // 15.5
      pauta.registrarVotoUnidade('A-102', OpcaoVotoCondominio.CONTRARIO); // 24.5

      const preliminar = pauta.obterResultadoPreliminar();
      expect(preliminar.encerrada).toBe(false);
      expect(preliminar.fracaoFavoravel).toBe(15.5);
      expect(preliminar.fracaoContraria).toBe(24.5);
      expect(preliminar.fracaoAbstencao).toBe(0);
      expect(preliminar.fracaoTotalVotante).toBe(40);
      expect(preliminar.percentualFavoravel).toBe(38.75);
      expect(preliminar.percentualContrario).toBe(61.25);
      expect(preliminar.percentualAbstencao).toBe(0);

      pauta.registrarVotoUnidade('B-201', OpcaoVotoCondominio.FAVORAVEL); // +30 -> 45.5
      pauta.registrarVotoUnidade('B-202', OpcaoVotoCondominio.ABSTENCAO); // +30 -> 30

      const final = pauta.encerrarVotacao();
      expect(final.encerrada).toBe(true);
      expect(final.fracaoFavoravel).toBe(45.5);
      expect(final.fracaoContraria).toBe(24.5);
      expect(final.fracaoAbstencao).toBe(30);
      expect(final.fracaoTotalVotante).toBe(100);
      expect(final.fracaoTotalCondominio).toBe(100);
      expect(final.percentualFavoravel).toBe(45.5);
      expect(final.percentualContrario).toBe(24.5);
      expect(final.percentualAbstencao).toBe(30);
      expect(final.totalUnidadesVotantes).toBe(4);
    });

    it('deve retornar percentuais zerados quando nenhum voto foi registrado', () => {
      const cadastro = new CadastroCondominio(criarUnidadesBase());
      const pauta = new PautaCondominial('pauta-1', 'Pauta sem votos', cadastro);

      const resultado = pauta.obterResultadoPreliminar();
      expect(resultado.fracaoTotalVotante).toBe(0);
      expect(resultado.percentualFavoravel).toBe(0);
      expect(resultado.percentualContrario).toBe(0);
      expect(resultado.percentualAbstencao).toBe(0);
    });
  });

  describe('Critério 3: Votação em bloco para proprietário com múltiplas unidades', () => {
    it('deve somar as frações ideais das unidades do proprietário ao abrir cédula em bloco', () => {
      const cadastro = new CadastroCondominio(criarUnidadesBase());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Instalação de painéis solares',
        cadastro,
      );

      const cedulaBloco = pauta.abrirCedulaProprietario('prop-1');

      expect(cedulaBloco.unidades.map((u) => u.id)).toEqual(['A-101', 'B-201']);
      expect(cedulaBloco.fracaoIdealTotal).toBe(45.5);
    });

    it('deve registrar voto em bloco somando as frações ideais de todas as unidades do proprietário', () => {
      const cadastro = new CadastroCondominio(criarUnidadesBase());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Instalação de painéis solares',
        cadastro,
      );

      const votos = pauta.registrarVotoEmBloco(
        'prop-1',
        OpcaoVotoCondominio.FAVORAVEL,
      );

      expect(votos).toHaveLength(2);
      const resultado = pauta.obterResultadoPreliminar();
      expect(resultado.fracaoFavoravel).toBe(45.5);
      expect(resultado.totalUnidadesVotantes).toBe(2);
    });

    it('deve impedir voto em bloco se alguma unidade do proprietário já tiver votado', () => {
      const cadastro = new CadastroCondominio(criarUnidadesBase());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Instalação de painéis solares',
        cadastro,
      );

      pauta.registrarVotoUnidade('A-101', OpcaoVotoCondominio.FAVORAVEL);

      expect(() =>
        pauta.registrarVotoEmBloco('prop-1', OpcaoVotoCondominio.CONTRARIO),
      ).toThrow(UnidadeJaVotouError);
    });

    it('deve lançar erro quando o proprietário não possui unidades cadastradas', () => {
      const cadastro = new CadastroCondominio(criarUnidadesBase());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Instalação de painéis solares',
        cadastro,
      );

      expect(() =>
        pauta.registrarVotoEmBloco('prop-inexistente', OpcaoVotoCondominio.FAVORAVEL),
      ).toThrow(ProprietarioSemUnidadesError);
    });
  });

  describe('Regras de integridade e validação', () => {
    it('deve impedir voto duplicado da mesma unidade na mesma pauta', () => {
      const cadastro = new CadastroCondominio(criarUnidadesBase());
      const pauta = new PautaCondominial('pauta-1', 'Reforma', cadastro);

      pauta.registrarVotoUnidade('A-101', OpcaoVotoCondominio.FAVORAVEL);

      expect(() =>
        pauta.registrarVotoUnidade('A-101', OpcaoVotoCondominio.CONTRARIO),
      ).toThrow(UnidadeJaVotouError);
    });

    it('deve impedir novos votos ou reencerramento após o encerramento da pauta', () => {
      const cadastro = new CadastroCondominio(criarUnidadesBase());
      const pauta = new PautaCondominial('pauta-1', 'Reforma', cadastro);

      pauta.encerrarVotacao();

      expect(() =>
        pauta.registrarVotoUnidade('A-101', OpcaoVotoCondominio.FAVORAVEL),
      ).toThrow(PautaEncerradaError);
      expect(() => pauta.encerrarVotacao()).toThrow(PautaEncerradaError);
    });

    it('deve rejeitar cadastro vazio, unidade duplicada ou fração ideal não positiva', () => {
      expect(() => new CadastroCondominio([])).toThrow(
        ParametrosCondominioInvalidosError,
      );

      const duplicadas = [criarUnidadesBase()[0], criarUnidadesBase()[0]];
      expect(() => new CadastroCondominio(duplicadas)).toThrow(
        ParametrosCondominioInvalidosError,
      );

      const fracaoInvalida = [{ ...criarUnidadesBase()[0], fracaoIdeal: 0 }];
      expect(() => new CadastroCondominio(fracaoInvalida)).toThrow(
        ParametrosCondominioInvalidosError,
      );
    });
  });
});
