import { StatusFinalSessao } from '../quorum/StatusFinalSessao.ts';
import type { AtaResultado, DadosAta } from './AtaResultado.ts';
import { DadosAtaInvalidosError } from './errors/AtaError.ts';

/**
 * Exige um inteiro maior ou igual a `minimo`. As três contagens da ata
 * repetiam essa checagem, cada uma com a sua cópia da condição.
 */
function exigirInteiro(
  valor: number,
  minimo: number,
  nomeDoCampo: string,
): void {
  if (!Number.isInteger(valor) || valor < minimo) {
    const limite = minimo === 0 ? 'maior ou igual a zero' : 'maior que zero';
    throw new DadosAtaInvalidosError(
      `O ${nomeDoCampo} deve ser um número inteiro ${limite}.`,
    );
  }
}

function validarDados(dados: DadosAta): void {
  if (dados.titulo.trim() === '') {
    throw new DadosAtaInvalidosError('O título da sessão é obrigatório.');
  }
  exigirInteiro(dados.totalEleitores, 1, 'total de eleitores');
  exigirInteiro(dados.totalPresencas, 0, 'total de presenças');
  if (dados.totalPresencas > dados.totalEleitores) {
    throw new DadosAtaInvalidosError(
      'O total de presenças não pode exceder o total de eleitores.',
    );
  }
  exigirInteiro(dados.totalVotos, 0, 'total de votos');
  if (dados.totalVotos > dados.totalPresencas) {
    throw new DadosAtaInvalidosError(
      'O total de votos não pode exceder o total de presenças: cada eleitor presente registra no máximo uma cédula.',
    );
  }
}

/**
 * Consolida status da sessão, vencedor e total de votos na ata do resultado.
 * Uma sessão Deserta nunca declara vencedor.
 */
export function gerarAta(dados: DadosAta): AtaResultado {
  validarDados(dados);

  return {
    titulo: dados.titulo,
    status: dados.status,
    vencedor:
      dados.status === StatusFinalSessao.DESERTA ? null : dados.vencedor,
    totalVotos: dados.totalVotos,
    totalEleitores: dados.totalEleitores,
    totalPresencas: dados.totalPresencas,
    // Reaproveita o cálculo do AvaliadorQuorum em vez de recalcular a
    // participação aqui, para não manter duas fórmulas em sincronia.
    participacao: Math.round(dados.resultadoQuorum.participacao * 100) / 100,
    geradaEm: (dados.geradaEm ?? new Date()).toISOString(),
  };
}

/** Formata a ata como texto*/
export function formatarAtaComoTexto(ata: AtaResultado): string {
  const linhas = [
    'ATA DE RESULTADO',
    `Sessão: ${ata.titulo}`,
    `Emitida em: ${ata.geradaEm}`,
    `Status final: ${ata.status}`,
    `Vencedor: ${ata.vencedor ?? 'Não há vencedor declarado'}`,
    `Total de votos: ${String(ata.totalVotos)}`,
    `Eleitores aptos: ${String(ata.totalEleitores)}`,
    `Presenças registradas: ${String(ata.totalPresencas)}`,
    `Participação: ${ata.participacao.toFixed(2).replace('.', ',')}%`,
  ];

  if (ata.status === StatusFinalSessao.DESERTA) {
    linhas.push(
      'Observação: sessão declarada deserta por não atingir o quórum mínimo de participação.',
    );
  }

  return linhas.join('\n');
}

/** Formata a ata como JSON*/
export function formatarAtaComoJson(ata: AtaResultado): string {
  return JSON.stringify(ata, null, 2);
}
