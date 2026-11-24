import { describe, expect, it } from 'vitest';
import {
  CadastroCondominio,
  OpcaoVotoCondominio,
  PautaCondominial,
  StatusDeliberacaoPauta,
  TipoQuorumCondominial,
  type UnidadeCondominial,
} from '../index.ts';

describe('Controle de Quórum Diferenciado por Pauta (História 2.4)', () => {
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
      id: 'A-102',
      numero: '102',
      bloco: 'A',
      proprietarioId: 'prop-2',
      nomeTitular: 'Bruno Costa',
      fracaoIdeal: 30,
    },
    {
      id: 'B-201',
      numero: '201',
      bloco: 'B',
      proprietarioId: 'prop-3',
      nomeTitular: 'Carla Souza',
      fracaoIdeal: 30,
    },
  ];

  describe('Critério 1: Seleção do tipo de quórum exigido no cadastro da pauta', () => {
    it('deve usar Maioria Simples de presentes por padrão e permitir configurar 2/3 ou Unanimidade por pauta', () => {
      const cadastro = new CadastroCondominio(criarUnidades());

      const pautaMaioria = new PautaCondominial(
        'pauta-1',
        'Aprovação das contas',
        cadastro,
      );
      const pautaDoisTercos = new PautaCondominial(
        'pauta-2',
        'Obra útil no condomínio',
        cadastro,
        TipoQuorumCondominial.DOIS_TERCOS_TOTAL,
      );
      const pautaUnanimidade = new PautaCondominial(
        'pauta-3',
        'Alteração da destinação do edifício',
        cadastro,
        TipoQuorumCondominial.UNANIMIDADE,
      );

      expect(pautaMaioria.tipoQuorum).toBe(
        TipoQuorumCondominial.MAIORIA_SIMPLES_PRESENTES,
      );
      expect(pautaDoisTercos.tipoQuorum).toBe(
        TipoQuorumCondominial.DOIS_TERCOS_TOTAL,
      );
      expect(pautaUnanimidade.tipoQuorum).toBe(
        TipoQuorumCondominial.UNANIMIDADE,
      );
      expect(pautaMaioria.statusDeliberacao).toBe(
        StatusDeliberacaoPauta.EM_VOTACAO,
      );
    });
  });

  describe('Critério 2: Indicação em tempo real do atingimento do quórum mínimo para deliberação', () => {
    it('deve indicar em tempo real quando o quórum de 2/3 do total de frações ideais é atingido', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Alteração da convenção',
        cadastro,
        TipoQuorumCondominial.DOIS_TERCOS_TOTAL,
      );

      expect(pauta.verificarQuorumTempoReal().quorumDeliberacaoAtingido).toBe(
        false,
      );

      pauta.registrarVotoUnidade('A-101', OpcaoVotoCondominio.FAVORAVEL); // 40% (< 66.67%)
      const parcial = pauta.verificarQuorumTempoReal();
      expect(parcial.quorumDeliberacaoAtingido).toBe(false);
      expect(parcial.percentualParticipacaoTotal).toBe(40);
      expect(parcial.fracaoMinimaExigida).toBe(66.6667);

      pauta.registrarVotoUnidade('A-102', OpcaoVotoCondominio.FAVORAVEL); // +30% -> 70% (>= 66.67%)
      const atingido = pauta.verificarQuorumTempoReal();
      expect(atingido.quorumDeliberacaoAtingido).toBe(true);
      expect(atingido.percentualParticipacaoTotal).toBe(70);
    });

    it('deve indicar em tempo real o atingimento do quórum para Maioria Simples e Unanimidade', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pautaMaioria = new PautaCondominial(
        'pauta-1',
        'Manutenção ordinária',
        cadastro,
        TipoQuorumCondominial.MAIORIA_SIMPLES_PRESENTES,
      );
      const pautaUnanimidade = new PautaCondominial(
        'pauta-2',
        'Mudança de fachada',
        cadastro,
        TipoQuorumCondominial.UNANIMIDADE,
      );

      expect(
        pautaMaioria.verificarQuorumTempoReal().quorumDeliberacaoAtingido,
      ).toBe(false);
      pautaMaioria.registrarVotoUnidade('A-101', OpcaoVotoCondominio.FAVORAVEL);
      expect(
        pautaMaioria.verificarQuorumTempoReal().quorumDeliberacaoAtingido,
      ).toBe(true);

      pautaUnanimidade.registrarVotoUnidade(
        'A-101',
        OpcaoVotoCondominio.FAVORAVEL,
      );
      pautaUnanimidade.registrarVotoUnidade(
        'A-102',
        OpcaoVotoCondominio.FAVORAVEL,
      );
      expect(
        pautaUnanimidade.verificarQuorumTempoReal().quorumDeliberacaoAtingido,
      ).toBe(false);

      pautaUnanimidade.registrarVotoUnidade(
        'B-201',
        OpcaoVotoCondominio.FAVORAVEL,
      );
      expect(
        pautaUnanimidade.verificarQuorumTempoReal().quorumDeliberacaoAtingido,
      ).toBe(true);
    });
  });

  describe('Critério 3: Cálculo e atribuição automática do status ("Aprovada", "Rejeitada", "Quórum Insuficiente") ao encerrar', () => {
    it('deve atribuir "Aprovada" ou "Rejeitada" em pauta de Maioria Simples de presentes', () => {
      const cadastro = new CadastroCondominio(criarUnidades());

      const pautaAprovada = new PautaCondominial(
        'pauta-1',
        'Pauta aprovada por maioria simples',
        cadastro,
        TipoQuorumCondominial.MAIORIA_SIMPLES_PRESENTES,
      );
      pautaAprovada.registrarVotoUnidade(
        'A-101',
        OpcaoVotoCondominio.FAVORAVEL,
      ); // 40
      pautaAprovada.registrarVotoUnidade(
        'A-102',
        OpcaoVotoCondominio.CONTRARIO,
      ); // 30
      expect(pautaAprovada.encerrarVotacao().statusDeliberacao).toBe(
        StatusDeliberacaoPauta.APROVADA,
      );

      const pautaRejeitada = new PautaCondominial(
        'pauta-2',
        'Pauta rejeitada por maioria simples',
        cadastro,
        TipoQuorumCondominial.MAIORIA_SIMPLES_PRESENTES,
      );
      pautaRejeitada.registrarVotoUnidade(
        'A-102',
        OpcaoVotoCondominio.FAVORAVEL,
      ); // 30
      pautaRejeitada.registrarVotoUnidade(
        'A-101',
        OpcaoVotoCondominio.CONTRARIO,
      ); // 40
      expect(pautaRejeitada.encerrarVotacao().statusDeliberacao).toBe(
        StatusDeliberacaoPauta.REJEITADA,
      );
    });

    it('deve atribuir "Quórum Insuficiente", "Rejeitada" ou "Aprovada" em pauta de 2/3 do total de frações ideais', () => {
      const cadastro = new CadastroCondominio(criarUnidades());

      const pautaSemQuorum = new PautaCondominial(
        'pauta-1',
        'Obra sem quórum de 2/3',
        cadastro,
        TipoQuorumCondominial.DOIS_TERCOS_TOTAL,
      );
      pautaSemQuorum.registrarVotoUnidade(
        'A-101',
        OpcaoVotoCondominio.FAVORAVEL,
      ); // 40 / 100
      expect(pautaSemQuorum.encerrarVotacao().statusDeliberacao).toBe(
        StatusDeliberacaoPauta.QUORUM_INSUFICIENTE,
      );

      const pautaRejeitada = new PautaCondominial(
        'pauta-2',
        'Obra com quórum de 2/3 presente mas sem 2/3 favoráveis',
        cadastro,
        TipoQuorumCondominial.DOIS_TERCOS_TOTAL,
      );
      pautaRejeitada.registrarVotoUnidade(
        'A-101',
        OpcaoVotoCondominio.FAVORAVEL,
      ); // 40
      pautaRejeitada.registrarVotoUnidade(
        'A-102',
        OpcaoVotoCondominio.CONTRARIO,
      ); // 30 (total votante 70 >= 66.67, favorável 40 < 66.67)
      expect(pautaRejeitada.encerrarVotacao().statusDeliberacao).toBe(
        StatusDeliberacaoPauta.REJEITADA,
      );

      const pautaAprovada = new PautaCondominial(
        'pauta-3',
        'Obra com 2/3 favoráveis',
        cadastro,
        TipoQuorumCondominial.DOIS_TERCOS_TOTAL,
      );
      pautaAprovada.registrarVotoUnidade(
        'A-101',
        OpcaoVotoCondominio.FAVORAVEL,
      ); // 40
      pautaAprovada.registrarVotoUnidade(
        'A-102',
        OpcaoVotoCondominio.FAVORAVEL,
      ); // +30 = 70 >= 66.67
      expect(pautaAprovada.encerrarVotacao().statusDeliberacao).toBe(
        StatusDeliberacaoPauta.APROVADA,
      );
    });

    it('deve atribuir "Quórum Insuficiente", "Rejeitada" ou "Aprovada" em pauta de Unanimidade', () => {
      const cadastro = new CadastroCondominio(criarUnidades());

      const pautaSemQuorum = new PautaCondominial(
        'pauta-1',
        'Unanimidade com ausência',
        cadastro,
        TipoQuorumCondominial.UNANIMIDADE,
      );
      pautaSemQuorum.registrarVotoUnidade(
        'A-101',
        OpcaoVotoCondominio.FAVORAVEL,
      );
      pautaSemQuorum.registrarVotoUnidade(
        'A-102',
        OpcaoVotoCondominio.FAVORAVEL,
      );
      expect(pautaSemQuorum.encerrarVotacao().statusDeliberacao).toBe(
        StatusDeliberacaoPauta.QUORUM_INSUFICIENTE,
      );

      const pautaRejeitada = new PautaCondominial(
        'pauta-2',
        'Unanimidade com todos presentes mas um voto contrário',
        cadastro,
        TipoQuorumCondominial.UNANIMIDADE,
      );
      pautaRejeitada.registrarVotoUnidade(
        'A-101',
        OpcaoVotoCondominio.FAVORAVEL,
      );
      pautaRejeitada.registrarVotoUnidade(
        'A-102',
        OpcaoVotoCondominio.FAVORAVEL,
      );
      pautaRejeitada.registrarVotoUnidade(
        'B-201',
        OpcaoVotoCondominio.CONTRARIO,
      );
      expect(pautaRejeitada.encerrarVotacao().statusDeliberacao).toBe(
        StatusDeliberacaoPauta.REJEITADA,
      );

      const pautaAprovada = new PautaCondominial(
        'pauta-3',
        'Unanimidade com 100% favorável',
        cadastro,
        TipoQuorumCondominial.UNANIMIDADE,
      );
      pautaAprovada.registrarVotoUnidade(
        'A-101',
        OpcaoVotoCondominio.FAVORAVEL,
      );
      pautaAprovada.registrarVotoUnidade(
        'A-102',
        OpcaoVotoCondominio.FAVORAVEL,
      );
      pautaAprovada.registrarVotoUnidade(
        'B-201',
        OpcaoVotoCondominio.FAVORAVEL,
      );
      expect(pautaAprovada.encerrarVotacao().statusDeliberacao).toBe(
        StatusDeliberacaoPauta.APROVADA,
      );
    });
  });
});
