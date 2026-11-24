import {
  ParametrosCondominioInvalidosError,
  PautaNaoEncerradaParaAtaError,
} from './errors/CondominioError.ts';
import type { OpcaoVotoCondominio } from './OpcaoVotoCondominio.ts';
import type {
  PautaCondominial,
  ResultadoPonderadoPauta,
} from './PautaCondominial.ts';

export interface RegistroVotoNominalAta {
  readonly unidadeId: string;
  readonly numeroUnidade: string;
  readonly bloco: string;
  readonly nomeTitular: string;
  readonly opcao: OpcaoVotoCondominio;
  readonly pesoFracaoIdeal: number;
  readonly registradoEm: string;
}

export interface ResultadoPautaAta extends ResultadoPonderadoPauta {
  readonly votosNominais: readonly RegistroVotoNominalAta[];
}

export interface DadosAtaAssembleia {
  readonly tituloAssembleia: string;
  readonly pautas: readonly PautaCondominial[];
  readonly emitidaEm?: Date;
}

export interface AtaAssembleiaCondominial {
  readonly tituloAssembleia: string;
  readonly emitidaEm: string;
  readonly pautas: readonly ResultadoPautaAta[];
}

/**
 * Consolida o relatório formal da assembleia condominial pauta a pauta,
 * contendo a listagem nominal dos votos de cada unidade (número, bloco,
 * titular, data/hora, opção votada e fração ideal).
 */
export function gerarAtaAssembleia(
  dados: DadosAtaAssembleia,
): AtaAssembleiaCondominial {
  const tituloAssembleia = dados.tituloAssembleia.trim();
  if (tituloAssembleia === '') {
    throw new ParametrosCondominioInvalidosError(
      'O título da assembleia é obrigatório para emissão da ata.',
    );
  }

  if (dados.pautas.length === 0) {
    throw new ParametrosCondominioInvalidosError(
      'A ata da assembleia exige ao menos uma pauta.',
    );
  }

  const pautasConsolidadas: ResultadoPautaAta[] = dados.pautas.map((pauta) => {
    if (!pauta.encerrada) {
      throw new PautaNaoEncerradaParaAtaError(pauta.id);
    }

    const resultado = pauta.obterResultadoFinal();
    const votosNominais: RegistroVotoNominalAta[] = pauta
      .listarVotos()
      .map((voto) => ({
        unidadeId: voto.unidadeId,
        numeroUnidade: voto.numeroUnidade,
        bloco: voto.bloco,
        nomeTitular: voto.nomeTitular,
        opcao: voto.opcao,
        pesoFracaoIdeal: voto.pesoFracaoIdeal,
        registradoEm: voto.registradoEm,
      }));

    return {
      ...resultado,
      votosNominais,
    };
  });

  return {
    tituloAssembleia,
    emitidaEm: (dados.emitidaEm ?? new Date()).toISOString(),
    pautas: pautasConsolidadas,
  };
}

/**
 * Formata a ata da assembleia condominial como documento textual pauta a pauta.
 */
export function formatarAtaAssembleiaComoTexto(
  ata: AtaAssembleiaCondominial,
): string {
  const linhas: string[] = [
    'ATA DE ASSEMBLEIA CONDOMINIAL',
    `Assembleia: ${ata.tituloAssembleia}`,
    `Emitida em: ${ata.emitidaEm}`,
  ];

  for (const [indice, pauta] of ata.pautas.entries()) {
    linhas.push('');
    linhas.push(`PAUTA ${String(indice + 1)}: ${pauta.titulo} (${pauta.pautaId})`);
    linhas.push(
      `Favorável: ${String(pauta.fracaoFavoravel)} (${pauta.percentualFavoravel.toFixed(2).replace('.', ',')}%)`,
    );
    linhas.push(
      `Contrário: ${String(pauta.fracaoContraria)} (${pauta.percentualContrario.toFixed(2).replace('.', ',')}%)`,
    );
    linhas.push(
      `Abstenção: ${String(pauta.fracaoAbstencao)} (${pauta.percentualAbstencao.toFixed(2).replace('.', ',')}%)`,
    );
    linhas.push(
      `Fração votante: ${String(pauta.fracaoTotalVotante)} / ${String(pauta.fracaoTotalCondominio)} (${String(pauta.totalUnidadesVotantes)} unidade(s))`,
    );
    linhas.push('Votos nominais:');

    if (pauta.votosNominais.length === 0) {
      linhas.push('  - Nenhum voto registrado.');
    } else {
      for (const voto of pauta.votosNominais) {
        linhas.push(
          `  - Bloco ${voto.bloco} | Unidade ${voto.numeroUnidade} | Titular: ${voto.nomeTitular} | Opção: ${voto.opcao} | Fração: ${String(voto.pesoFracaoIdeal)} | Data/Hora: ${voto.registradoEm}`,
        );
      }
    }
  }

  return linhas.join('\n');
}

/**
 * Formata a ata da assembleia condominial como JSON estruturado.
 */
export function formatarAtaAssembleiaComoJson(
  ata: AtaAssembleiaCondominial,
): string {
  return JSON.stringify(ata, null, 2);
}
