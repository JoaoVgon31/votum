import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState, type ReactNode } from 'react';
import { OpcaoEspecial } from '../core/apuracao';
import { formatarAtaComoTexto } from '../core/ata';
import { ColegioEleitoralCA } from '../core/electorate';
import eleitoresAptosCA from '../core/electorate/ca/eleitores_aptos_ca.json';
import { ProcessoEleitoral, type ResultadoProcesso } from '../core/processo';
import { SessaoVotacao } from '../core/session';

export const Route = createFileRoute('/')({
  component: EleicaoCA,
});

type Etapa = 'configuracao' | 'votacao' | 'resultado';

const TOTAL_ELEITORES = eleitoresAptosCA.eleitoresAptos.length;

function EleicaoCA() {
  const processo = useRef(new ProcessoEleitoral(new ColegioEleitoralCA()));
  const sessao = useRef<SessaoVotacao | null>(null);

  const [etapa, setEtapa] = useState<Etapa>('configuracao');
  const [titulo, setTitulo] = useState('Eleição Centro Acadêmico 2026');
  const [chapasTexto, setChapasTexto] = useState('Chapa Integra, Chapa Avante');
  const [chapas, setChapas] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [ra, setRa] = useState('');
  const [escolha, setEscolha] = useState<string | null>(null);
  const [comprovante, setComprovante] = useState<string | null>(null);
  const [presencas, setPresencas] = useState(0);

  const [resultado, setResultado] = useState<ResultadoProcesso | null>(null);

  function tratar(acao: () => void) {
    try {
      setErro(null);
      acao();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }

  function abrirSessao() {
    tratar(() => {
      const lista = chapasTexto
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      if (lista.length === 0) throw new Error('Informe ao menos uma chapa.');
      const nova = new SessaoVotacao(crypto.randomUUID(), titulo.trim());
      nova.agendar();
      nova.abrir();
      sessao.current = nova;
      setChapas(lista);
      setPresencas(0);
      setEtapa('votacao');
    });
  }

  function votar() {
    const atual = sessao.current;
    if (!atual || !escolha) return;
    tratar(() => {
      const recibo = processo.current.registrarVoto(atual, ra, {
        id: crypto.randomUUID(),
        conteudo: escolha,
        registradoEm: new Date(),
      });
      setComprovante(recibo);
      setPresencas(atual.totalPresencas);
      setRa('');
      setEscolha(null);
    });
  }

  function encerrar() {
    const atual = sessao.current;
    if (!atual) return;
    tratar(() => {
      atual.iniciarApuracao();
      const apurado = processo.current.apurarResultado(
        atual,
        chapas,
        TOTAL_ELEITORES,
      );
      atual.encerrarApuracao();
      setResultado(apurado);
      setEtapa('resultado');
    });
  }

  function reiniciar() {
    sessao.current = null;
    setResultado(null);
    setComprovante(null);
    setErro(null);
    setEtapa('configuracao');
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-8">
          <p className="text-sm font-medium text-indigo-600">votum</p>
          <h1 className="text-2xl font-semibold">
            {etapa === 'configuracao' ? 'Nova sessão de votação' : titulo}
          </h1>
          <Passos etapa={etapa} />
        </header>

        {erro && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {erro}
          </div>
        )}

        {etapa === 'configuracao' && (
          <Cartao>
            <Campo label="Título da sessão">
              <input
                className={entrada}
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                }}
              />
            </Campo>
            <Campo label="Chapas concorrentes (separadas por vírgula)">
              <input
                className={entrada}
                value={chapasTexto}
                onChange={(e) => {
                  setChapasTexto(e.target.value);
                }}
              />
            </Campo>
            <p className="text-sm text-slate-500">
              Colégio eleitoral: {TOTAL_ELEITORES} eleitores aptos. Quórum
              mínimo de 20%.
            </p>
            <button className={botaoPrimario} onClick={abrirSessao}>
              Abrir sessão
            </button>
          </Cartao>
        )}

        {etapa === 'votacao' && (
          <div className="space-y-6">
            <Cartao>
              <Campo label="RA do eleitor">
                <input
                  className={entrada}
                  value={ra}
                  inputMode="numeric"
                  placeholder="Ex.: 202601"
                  onChange={(e) => {
                    setRa(e.target.value);
                    setComprovante(null);
                  }}
                />
              </Campo>
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">Cédula</legend>
                {[...chapas, OpcaoEspecial.BRANCO, OpcaoEspecial.NULO].map(
                  (opcao) => (
                    <label
                      key={opcao}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                        escolha === opcao
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cedula"
                        checked={escolha === opcao}
                        onChange={() => {
                          setEscolha(opcao);
                        }}
                      />
                      {rotuloOpcao(opcao)}
                    </label>
                  ),
                )}
              </fieldset>
              <button
                className={botaoPrimario}
                disabled={!ra.trim() || !escolha}
                onClick={votar}
              >
                Confirmar voto
              </button>
            </Cartao>

            {comprovante && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Voto registrado. Comprovante:{' '}
                <code className="font-mono break-all">{comprovante}</code>
              </div>
            )}

            <Cartao>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  Presenças: {presencas} de {TOTAL_ELEITORES}
                </span>
                <button className={botaoSecundario} onClick={encerrar}>
                  Encerrar e apurar
                </button>
              </div>
            </Cartao>
          </div>
        )}

        {etapa === 'resultado' && resultado && (
          <Resultado resultado={resultado} onReiniciar={reiniciar} />
        )}
      </div>
    </main>
  );
}

function Resultado({
  resultado,
  onReiniciar,
}: {
  resultado: ResultadoProcesso;
  onReiniciar: () => void;
}) {
  const {
    resultadoApuracao: apuracao,
    resultadoQuorum: quorum,
    ata,
  } = resultado;
  const maior = Math.max(1, ...apuracao.contagens.map((c) => c.votos));

  return (
    <div className="space-y-6">
      <Cartao>
        <p className="text-sm text-slate-500">Status final</p>
        <p className="text-xl font-semibold">{ata.status}</p>
        <p className="text-sm text-slate-600">
          Participação de {quorum.participacao.toFixed(2).replace('.', ',')}%
          (mínimo {quorum.percentualMinimo}%).{' '}
          {quorum.atingido ? 'Quórum atingido.' : 'Quórum não atingido.'}
        </p>
        <p className="font-medium">
          {apuracao.empate
            ? `Empate entre ${apuracao.chapasEmpatadas.join(' e ')}`
            : `Vencedora: ${ata.vencedor ?? 'nenhuma'}`}
        </p>
      </Cartao>

      <Cartao>
        <h2 className="font-medium">Apuração</h2>
        {apuracao.contagens.map((c) => (
          <div key={c.chapa}>
            <div className="flex justify-between text-sm">
              <span>{c.chapa}</span>
              <span>{c.votos}</span>
            </div>
            <div className="h-2 rounded bg-slate-100">
              <div
                className="h-2 rounded bg-indigo-500"
                style={{ width: `${String((c.votos / maior) * 100)}%` }}
              />
            </div>
          </div>
        ))}
        <p className="text-sm text-slate-600">
          Brancos: {apuracao.brancos} · Nulos: {apuracao.nulos} · Cédulas:{' '}
          {apuracao.totalCedulas}
        </p>
      </Cartao>

      <Cartao>
        <h2 className="font-medium">Ata</h2>
        <pre className="rounded bg-slate-100 p-3 text-xs whitespace-pre-wrap">
          {formatarAtaComoTexto(ata)}
        </pre>
      </Cartao>

      <button className={botaoSecundario} onClick={onReiniciar}>
        Nova sessão
      </button>
    </div>
  );
}

function Passos({ etapa }: { etapa: Etapa }) {
  const passos: [Etapa, string][] = [
    ['configuracao', 'Configuração'],
    ['votacao', 'Votação'],
    ['resultado', 'Resultado'],
  ];
  const atual = passos.findIndex(([e]) => e === etapa);
  return (
    <ol className="mt-4 flex gap-2 text-xs">
      {passos.map(([e, nome], i) => (
        <li
          key={e}
          className={`rounded-full px-3 py-1 ${
            i <= atual
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          {nome}
        </li>
      ))}
    </ol>
  );
}

function Cartao({ children }: { children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {children}
    </section>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function rotuloOpcao(opcao: string) {
  if (opcao === OpcaoEspecial.BRANCO) return 'Voto em branco';
  if (opcao === OpcaoEspecial.NULO) return 'Voto nulo';
  return opcao;
}

const entrada =
  'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none';
const botaoPrimario =
  'w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40';
const botaoSecundario =
  'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50';
