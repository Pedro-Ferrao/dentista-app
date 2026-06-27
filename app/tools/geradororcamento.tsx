"use client";

/**
 * Gerador de Orçamentos e Planos de Tratamento
 * -----------------------------------------------
 * O dentista monta o plano de tratamento clicando no dente (odontograma
 * visual, numeração FDI) ou digitando o número, escolhe o procedimento e o
 * valor. O portal soma tudo, sugere opções de parcelamento e gera uma
 * visualização "timbrada" para a recepção imprimir ou salvar como PDF.
 */

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Printer,
  ArrowLeft,
  FileText,
  AlertTriangle,
} from "lucide-react";

// ---------- Tipos ----------

interface ItemTratamento {
  id: string;
  dente: string; // números FDI acumulados (ex: "11, 12") ou "Geral"
  procedimento: string;
  valor: number;
}

interface DadosClinica {
  nome: string;
  endereco: string;
  telefone: string;
}

// ---------- Odontograma (numeração FDI) ----------

const SUPERIOR_DIREITO = [18, 17, 16, 15, 14, 13, 12, 11];
const SUPERIOR_ESQUERDO = [21, 22, 23, 24, 25, 26, 27, 28];
const INFERIOR_DIREITO = [48, 47, 46, 45, 44, 43, 42, 41];
const INFERIOR_ESQUERDO = [31, 32, 33, 34, 35, 36, 37, 38];

const PROCEDIMENTOS_COMUNS = [
  "Limpeza (profilaxia)",
  "Restauração",
  "Canal (tratamento endodôntico)",
  "Extração",
  "Coroa protética",
  "Clareamento dental",
  "Avaliação ortodôntica",
  "Manutenção de aparelho",
  "Raspagem periodontal",
  "Outro (digitar abaixo)",
];

// ---------- Helpers ----------

function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// FORMATADOR DA DATA POR EXTENSO: Evita quebras de fusos locais convertendo a string diretamente
function formatarDataExtenso(isoDate: string): string {
  if (!isoDate) return "";
  const partes = isoDate.split("-");
  if (partes.length !== 3) return isoDate;

  const ano = partes[0];
  const mesIdx = parseInt(partes[1], 10) - 1;
  const dia = partes[2];

  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  return `${dia} de ${meses[mesIdx]} de ${ano}`;
}

// DEFINE A DATA INICIAL CORRETA: Gera a string no formato exato que o input date nativo precisa (AAAA-MM-DD)
function obterDataHojeISO(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

interface ParcelaOpcao {
  parcelas: number;
  valorParcela: number;
  valorTotalComJuros: number;
}

function calcularParcelamento(
  total: number,
  parcelasMax: number,
  jurosPorParcelaPercentual: number,
): ParcelaOpcao[] {
  const opcoes: ParcelaOpcao[] = [];
  for (let n = 1; n <= parcelasMax; n++) {
    const acrescimo = n === 1 ? 0 : (jurosPorParcelaPercentual / 100) * (n - 1);
    const valorTotalComJuros = total * (1 + acrescimo);
    opcoes.push({
      parcelas: n,
      valorParcela: valorTotalComJuros / n,
      valorTotalComJuros,
    });
  }
  return opcoes;
}

// ---------- Componente principal ----------

export default function GeradorOrcamentos() {
  const [clinica, setClinica] = useState<DadosClinica>({
    nome: "Sorriso & Cia",
    endereco: "Rua Exemplo, 123 — São Paulo, SP",
    telefone: "(11) 4000-0000",
  });

  const [pacienteNome, setPacienteNome] = useState("");
  const [dentistaResponsavel, setDentistaResponsavel] = useState("");
  const [dataOrcamento, setDataOrcamento] = useState(obterDataHojeISO());
  const [validadeDias, setValidadeDias] = useState("15");
  const [observacoes, setObservacoes] = useState("");

  const [itens, setItens] = useState<ItemTratamento[]>([]);
  const [dentesSelecionados, setDentesSelecionados] = useState<number[]>([]);

  const [procedimentoForm, setProcedimentoForm] = useState({
    procedimento: PROCEDIMENTOS_COMUNS[0],
    procedimentoCustom: "",
    valor: "",
  });
  const [erroItem, setErroItem] = useState<string | null>(null);

  const [parcelasMax, setParcelasMax] = useState("6");
  const [jurosPorParcela, setJurosPorParcela] = useState("0");

  const [mostrandoOrcamento, setMostrandoOrcamento] = useState(false);
  const [erroGerar, setErroGerar] = useState<string | null>(null);

  const totalGeral = useMemo(
    () => itens.reduce((soma, item) => soma + item.valor, 0),
    [itens],
  );

  const opcoesParcelamento = useMemo(() => {
    const max = Math.max(1, parseInt(parcelasMax, 10) || 1);
    const juros = parseFloat(jurosPorParcela.replace(",", ".")) || 0;
    return calcularParcelamento(totalGeral, max, juros);
  }, [totalGeral, parcelasMax, jurosPorParcela]);

  function alternarDente(numero: number) {
    setDentesSelecionados((prev) =>
      prev.includes(numero)
        ? prev.filter((d) => d !== numero)
        : [...prev, numero].sort((a, b) => a - b),
    );
  }

  function adicionarItem() {
    const valor = parseFloat(procedimentoForm.valor.replace(",", "."));
    const nomeProcedimento =
      procedimentoForm.procedimento === "Outro (digitar abaixo)"
        ? procedimentoForm.procedimentoCustom.trim()
        : procedimentoForm.procedimento;

    if (!nomeProcedimento || isNaN(valor) || valor <= 0) {
      setErroItem("Escolha o procedimento e informe um valor válido.");
      return;
    }

    const novoItem: ItemTratamento = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dente:
        dentesSelecionados.length > 0 ? dentesSelecionados.join(", ") : "Geral",
      procedimento: nomeProcedimento,
      valor,
    };

    setItens((prev) => [...prev, novoItem]);
    setProcedimentoForm({
      procedimento: PROCEDIMENTOS_COMUNS[0],
      procedimentoCustom: "",
      valor: "",
    });
    setDentesSelecionados([]);
    setErroItem(null);
  }

  function removerItem(id: string) {
    setItens((prev) => prev.filter((i) => i.id !== id));
  }

  function gerarOrcamento() {
    if (!pacienteNome.trim()) {
      setErroGerar("Informe o nome do paciente antes de gerar o orçamento.");
      return;
    }
    if (itens.length === 0) {
      setErroGerar("Adicione ao menos um procedimento ao plano de tratamento.");
      return;
    }
    setErroGerar(null);
    setMostrandoOrcamento(true);
  }

  if (mostrandoOrcamento) {
    return (
      <VisualizacaoOrcamento
        clinica={clinica}
        pacienteNome={pacienteNome}
        dentistaResponsavel={dentistaResponsavel}
        dataOrcamento={dataOrcamento}
        validadeDias={validadeDias}
        observacoes={observacoes}
        itens={itens}
        totalGeral={totalGeral}
        opcoesParcelamento={opcoesParcelamento}
        onVoltar={() => setMostrandoOrcamento(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Gerador de Orçamentos e Planos de Tratamento
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Selecione um ou mais dentes, escolha o procedimento e monte o plano
            completo para a recepção apresentar ao paciente.
          </p>
        </div>

        {/* Dados do paciente / orçamento */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Dados do orçamento
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CampoTexto
              label="Nome do paciente *"
              value={pacienteNome}
              placeholder="Ex: Maria Souza"
              onChange={setPacienteNome}
            />
            <CampoTexto
              label="Dentista responsável"
              value={dentistaResponsavel}
              placeholder="Ex: Dra. Carla Mendes"
              onChange={setDentistaResponsavel}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Data do orçamento
              </label>
              <input
                type="date"
                value={dataOrcamento}
                onChange={(e) => setDataOrcamento(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Validade da proposta (dias)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={validadeDias}
                onChange={(e) => setValidadeDias(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Odontograma */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">
            Odontograma
          </h2>
          <p className="mb-3 text-xs text-slate-400">
            Clique nos dentes para selecionar múltiplos de uma vez, ou marque
            "Procedimento geral" para itens corporativos ou sem dente
            específico.
          </p>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <LinhaOdontograma
                grupoEsquerda={SUPERIOR_DIREITO}
                grupoDireita={SUPERIOR_ESQUERDO}
                dentesSelecionados={dentesSelecionados}
                onSelecionar={alternarDente}
              />
              <div className="my-1 h-px bg-slate-200" />
              <LinhaOdontograma
                grupoEsquerda={INFERIOR_DIREITO}
                grupoDireita={INFERIOR_ESQUERDO}
                dentesSelecionados={dentesSelecionados}
                onSelecionar={alternarDente}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Dentes selecionados:</span>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 max-w-md truncate">
              {dentesSelecionados.length > 0
                ? `Dentes: ${dentesSelecionados.join(", ")}`
                : "Nenhum (Geral)"}
            </span>
            <button
              type="button"
              onClick={() => setDentesSelecionados([])}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-50"
            >
              Limpar seleção / Procedimento Geral
            </button>
          </div>

          {/* Formulário de procedimento */}
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Procedimento
              </label>
              <select
                value={procedimentoForm.procedimento}
                onChange={(e) =>
                  setProcedimentoForm((prev) => ({
                    ...prev,
                    procedimento: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {PROCEDIMENTOS_COMUNS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {procedimentoForm.procedimento === "Outro (digitar abaixo)" && (
                <input
                  type="text"
                  placeholder="Nome do procedimento"
                  value={procedimentoForm.procedimentoCustom}
                  onChange={(e) =>
                    setProcedimentoForm((prev) => ({
                      ...prev,
                      procedimentoCustom: e.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Valor (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 350,00"
                value={procedimentoForm.valor}
                onChange={(e) =>
                  setProcedimentoForm((prev) => ({
                    ...prev,
                    valor: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={adicionarItem}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
            </div>
          </div>
          {erroItem && <p className="mt-2 text-xs text-rose-600">{erroItem}</p>}
        </div>

        {/* Lista de itens do plano */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Plano de tratamento ({itens.length}{" "}
            {itens.length === 1 ? "item" : "itens"})
          </h2>

          {itens.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
              Nenhum procedimento adicionado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {itens.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 max-w-[150px] truncate">
                      {item.dente === "Geral"
                        ? "Geral"
                        : `Dentes: ${item.dente}`}
                    </span>
                    <span className="text-sm text-slate-700">
                      {item.procedimento}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-900">
                      {formatBRL(item.valor)}
                    </span>
                    <button
                      onClick={() => removerItem(item.id)}
                      title="Remover item"
                      className="flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-sm font-medium text-slate-500">
                  Total geral
                </span>
                <span className="text-lg font-semibold text-slate-900">
                  {formatBRL(totalGeral)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Parcelamento e observações */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Condições de parcelamento
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Máximo de parcelas
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={parcelasMax}
                  onChange={(e) => setParcelasMax(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Acréscimo por parcela (%)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={jurosPorParcela}
                  onChange={(e) => setJurosPorParcela(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Modelo simplificado: 1x sempre sem acréscimo; a partir da 2ª
              parcela, soma-se esse percentual por parcela adicional.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Observações (aparecem no orçamento)
            </h2>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Pagamento via PIX tem 5% de desconto."
              rows={4}
              className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Gerar orçamento */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
          <div>
            {erroGerar && (
              <p className="flex items-center gap-1.5 text-xs text-rose-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                {erroGerar}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={gerarOrcamento}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" />
            Gerar orçamento
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Odontograma: linha de quadrantes ----------

function LinhaOdontograma({
  grupoEsquerda,
  grupoDireita,
  dentesSelecionados,
  onSelecionar,
}: {
  grupoEsquerda: number[];
  grupoDireita: number[];
  dentesSelecionados: number[];
  onSelecionar: (dente: number) => void;
}) {
  return (
    <div className="flex">
      {grupoEsquerda.map((dente) => (
        <BotaoDente
          key={dente}
          numero={dente}
          ativo={dentesSelecionados.includes(dente)}
          onClick={() => onSelecionar(dente)}
        />
      ))}
      <div className="mx-1 w-px self-stretch bg-slate-300" />
      {grupoDireita.map((dente) => (
        <BotaoDente
          key={dente}
          numero={dente}
          ativo={dentesSelecionados.includes(dente)}
          onClick={() => onSelecionar(dente)}
        />
      ))}
    </div>
  );
}

function BotaoDente({
  numero,
  ativo,
  onClick,
}: {
  numero: number;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`m-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
        ativo
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
      }`}
    >
      {numero}
    </button>
  );
}

// ---------- Campo de texto auxiliar ----------

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

// ---------- Visualização final (tela "timbrada" para imprimir/PDF) ----------

function VisualizacaoOrcamento({
  clinica,
  pacienteNome,
  dentistaResponsavel,
  dataOrcamento,
  validadeDias,
  observacoes,
  itens,
  totalGeral,
  opcoesParcelamento,
  onVoltar,
}: {
  clinica: DadosClinica;
  pacienteNome: string;
  dentistaResponsavel: string;
  dataOrcamento: string;
  validadeDias: string;
  observacoes: string;
  itens: ItemTratamento[];
  totalGeral: number;
  opcoesParcelamento: ParcelaOpcao[];
  onVoltar: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area {
            box-shadow: none !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          body { background: white !important; }
        }
      `}</style>

      {/* Barra de ações (not print) */}
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between">
        <button
          onClick={onVoltar}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar e editar
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          type="button"
        >
          <Printer className="h-4 w-4" />
          Imprimir / Salvar como PDF
        </button>
      </div>

      {/* Documento timbrado */}
      <div className="print-area mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{clinica.nome}</h1>
            <p className="text-xs text-slate-500">{clinica.endereco}</p>
            <p className="text-xs text-slate-500">{clinica.telefone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Plano de tratamento
            </p>
            <p className="text-xs text-slate-500">
              {formatarDataExtenso(dataOrcamento)}
            </p>
          </div>
        </div>

        {/* Dados do paciente */}
        <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">Paciente</p>
            <p className="font-medium text-slate-900">{pacienteNome}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Dentista responsável</p>
            <p className="font-medium text-slate-900">
              {dentistaResponsavel || "—"}
            </p>
          </div>
        </div>

        {/* Tabela de itens */}
        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2">Dente</th>
              <th className="py-2">Procedimento</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 1 ? "bg-slate-50" : ""}>
                <td className="py-2 pr-2 text-slate-600">
                  {item.dente === "Geral" ? "—" : item.dente}
                </td>
                <td className="py-2 pr-2 text-slate-800">
                  {item.procedimento}
                </td>
                <td className="py-2 text-right font-medium text-slate-900">
                  {formatBRL(item.valor)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300">
              <td
                colSpan={2}
                className="py-2 text-right text-sm font-semibold text-slate-700"
              >
                Total geral
              </td>
              <td className="py-2 text-right text-base font-bold text-slate-900">
                {formatBRL(totalGeral)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Parcelamento */}
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Formas de pagamento sugeridas
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {opcoesParcelamento.map((opcao) => (
              <div
                key={opcao.parcelas}
                className="rounded-md border border-slate-200 p-2 text-center"
              >
                <p className="text-xs text-slate-500">{opcao.parcelas}x</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatBRL(opcao.valorParcela)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Observações */}
        {observacoes && (
          <div className="mb-6 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            {observacoes}
          </div>
        )}

        {/* Validade e assinatura */}
        <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-4 text-xs text-slate-400">
          <p>
            Proposta válida por {validadeDias || "—"} dias a partir da data de
            emissão.
          </p>
          <div className="text-center">
            <div className="mb-1 w-40 border-t border-slate-400" />
            <p>Assinatura do responsável</p>
          </div>
        </div>
      </div>
    </div>
  );
}
