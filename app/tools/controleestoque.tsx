"use client";

import { useMemo, useState } from "react";
import {
  Package,
  AlertTriangle,
  MinusCircle,
  CheckCircle,
  Calendar,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  ShoppingCart,
  Layers,
} from "lucide-react";

// ---------- Tipos ----------

type SituacaoEstoque = "ok" | "baixo" | "zerado";
type SituacaoValidade = "valido" | "alerta" | "vencido";

interface MaterialOdonto {
  id: string;
  nome: string;
  categoria: string;
  quantidadeAtual: number;
  quantidadeMinima: number; // Para controle de estoque baixo
  dataVencimento: string; // formato AAAA-MM-DD
  lote: string;
  fornecedor: string;
}

const CATEGORIAS_COMUNS = [
  "Descartáveis (Luvas, Máscaras, Babadores)",
  "Resinas e Adesivos",
  "Anestésicos e Agulhas",
  "Brocas e Pontas Diamantadas",
  "Cimentos e Forramentos",
  "Ortodontia (Braquetes, Fios)",
  "Endodontia (Limas, Cones)",
  "Moldagem (Alginato, Silicone)",
  "Outros",
];

// ---------- Dados Iniciais para o Dashboard (Totalizando 158 itens) ----------

const materiaisIniciais: MaterialOdonto[] = [];

// ---------- Helpers de Data ----------

function formatarDataBR(isoString: string): string {
  if (!isoString) return "";
  const [ano, mes, dia] = isoString.split("-");
  return `${dia}/${mes}/${ano}`;
}

type TipoFiltro =
  | "todos"
  | "ok"
  | "baixo"
  | "zerado"
  | "atencao_validade"
  | "comprar";

export default function ControleEstoqueOdonto() {
  const [materiais, setMateriais] =
    useState<MaterialOdonto[]>(materiaisIniciais);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<TipoFiltro>("todos");

  // Form de cadastro
  const [novoItem, setNovoItem] = useState({
    nome: "",
    categoria: CATEGORIAS_COMUNS[0],
    quantidadeAtual: "",
    quantidadeMinima: "",
    dataVencimento: "",
    lote: "",
    fornecedor: "",
  });
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Lógica de cálculo de Status de Validade e Estoque baseados no momento atual (26/06/2026)
  const hoje = new Date("2026-06-26");

  const avaliarItem = (item: MaterialOdonto) => {
    let situacaoEstoque: SituacaoEstoque = "ok";
    if (item.quantidadeAtual === 0) situacaoEstoque = "zerado";
    else if (item.quantidadeAtual <= item.quantidadeMinima)
      situacaoEstoque = "baixo";

    let situacaoValidade: SituacaoValidade = "valido";
    if (item.dataVencimento) {
      const vcto = new Date(item.dataVencimento);
      const diffTempo = vcto.getTime() - hoje.getTime();
      const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

      if (diffDias < 0) situacaoValidade = "vencido";
      else if (diffDias <= 30) situacaoValidade = "alerta"; // Próximo de vencer (30 dias)
    }

    const precisaComprar =
      situacaoEstoque === "baixo" || situacaoEstoque === "zerado";

    return { situacaoEstoque, situacaoValidade, precisaComprar };
  };

  // Contadores dinâmicos para o Dashboard inicial
  const contagem = useMemo(() => {
    let total = materiais.length;
    let emEstoque = 0;
    let estoqueBaixo = 0;
    let semEstoque = 0;
    let proximosVencimento = 0; // Inclui vencidos e alertas para triagem imediata

    materiais.forEach((m) => {
      const { situacaoEstoque, situacaoValidade } = avaliarItem(m);
      if (situacaoEstoque === "ok") emEstoque++;
      if (situacaoEstoque === "baixo") estoqueBaixo++;
      if (situacaoEstoque === "zerado") semEstoque++;
      if (situacaoValidade === "alerta" || situacaoValidade === "vencido")
        proximosVencimento++;
    });

    return { total, emEstoque, estoqueBaixo, semEstoque, proximosVencimento };
  }, [materiais]);

  // Filtros aplicados na lista
  const listaFiltrada = useMemo(() => {
    return materiais
      .filter((m) => {
        const { situacaoEstoque, situacaoValidade, precisaComprar } =
          avaliarItem(m);
        if (filtro === "ok") return situacaoEstoque === "ok";
        if (filtro === "baixo") return situacaoEstoque === "baixo";
        if (filtro === "zerado") return situacaoEstoque === "zerado";
        if (filtro === "atencao_validade")
          return (
            situacaoValidade === "alerta" || situacaoValidade === "vencido"
          );
        if (filtro === "comprar") return precisaComprar;
        return true;
      })
      .filter(
        (m) =>
          m.nome.toLowerCase().includes(busca.toLowerCase().trim()) ||
          m.categoria.toLowerCase().includes(busca.toLowerCase().trim()),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [materiais, busca, filtro]);

  // Manipulação do Form
  function atualizarCampo(campo: keyof typeof novoItem, valor: string) {
    setNovoItem((prev) => ({ ...prev, [campo]: valor }));
  }

  function adicionarMaterial() {
    if (
      !novoItem.nome.trim() ||
      !novoItem.quantidadeAtual ||
      !novoItem.quantidadeMinima
    ) {
      setErroForm("Preencha pelo menos Nome, Qtd Atual e Qtd Mínima.");
      return;
    }

    const material: MaterialOdonto = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nome: novoItem.nome.trim(),
      categoria: novoItem.categoria,
      quantidadeAtual: parseInt(novoItem.quantidadeAtual, 10) || 0,
      quantidadeMinima: parseInt(novoItem.quantidadeMinima, 10) || 0,
      dataVencimento: novoItem.dataVencimento || "2030-12-31",
      lote: novoItem.lote.trim() || "N/A",
      fornecedor: novoItem.fornecedor.trim() || "Não informado",
    };

    setMateriais((prev) => [material, ...prev]);
    setErroForm(null);
    setNovoItem({
      nome: "",
      categoria: CATEGORIAS_COMUNS[0],
      quantidadeAtual: "",
      quantidadeMinima: "",
      dataVencimento: "",
      lote: "",
      fornecedor: "",
    });
  }

  function removerMaterial(id: string) {
    setMateriais((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Controle de Estoque Odontológico
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerenciamento de insumos clínicos, validades, alertas de reposição e
            compras.
          </p>
        </div>

        {/* Dashboard de Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <ResumoCard
            label="Total de itens"
            valor={contagem.total}
            tom="slate"
            icone={<Layers className="h-4 w-4" />}
          />
          <ResumoCard
            label="🟢 Em estoque"
            valor={contagem.emEstoque}
            tom="emerald"
          />
          <ResumoCard
            label="🟡 Estoque baixo"
            valor={contagem.estoqueBaixo}
            tom="amber"
            destaque={contagem.estoqueBaixo > 0}
          />
          <ResumoCard
            label="🔴 Sem estoque"
            valor={contagem.semEstoque}
            tom="rose"
            destaque={contagem.semEstoque > 0}
          />
          <ResumoCard
            label="⚠️ Validade/Atenção"
            valor={contagem.proximosVencimento}
            tom="purple"
            destaque={contagem.proximosVencimento > 0}
          />
        </div>

        {/* Banner de Aviso de Itens Críticos */}
        {(contagem.estoqueBaixo > 0 || contagem.semEstoque > 0) && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-semibold">
                Itens exigindo atenção imediata:
              </span>{" "}
              Existem <span className="font-bold">{contagem.semEstoque}</span>{" "}
              materiais zerados e{" "}
              <span className="font-bold">{contagem.estoqueBaixo}</span> abaixo
              do estoque de segurança. Recomenda-se realizar pedido de compra.
            </div>
          </div>
        )}

        {/* Cadastro de Novo Material */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Plus className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-700">
              Cadastrar Novo Material / Insumo
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CampoForm
              label="Nome do Material *"
              value={novoItem.nome}
              placeholder="Ex: Alginato Tipo II Hydrogum"
              onChange={(v) => atualizarCampo("nome", v)}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Categoria
              </label>
              <select
                value={novoItem.categoria}
                onChange={(e) => atualizarCampo("categoria", e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {CATEGORIAS_COMUNS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <CampoForm
              label="Qtd Atual em Estoque *"
              type="number"
              value={novoItem.quantidadeAtual}
              placeholder="Ex: 15"
              onChange={(v) => atualizarCampo("quantidadeAtual", v)}
            />
            <CampoForm
              label="Qtd Mínima de Segurança *"
              type="number"
              value={novoItem.quantidadeMinima}
              placeholder="Ex: 5"
              onChange={(v) => atualizarCampo("quantidadeMinima", v)}
            />
            <CampoForm
              label="Data de Vencimento"
              type="date"
              value={novoItem.dataVencimento}
              onChange={(v) => atualizarCampo("dataVencimento", v)}
            />
            <CampoForm
              label="Lote"
              value={novoItem.lote}
              placeholder="Ex: LT-4022"
              onChange={(v) => atualizarCampo("lote", v)}
            />
            <div className="sm:col-span-2 flex flex-col justify-between">
              <CampoForm
                label="Fornecedor Habitual"
                value={novoItem.fornecedor}
                placeholder="Ex: Dental Cremer"
                onChange={(v) => atualizarCampo("fornecedor", v)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center border-t border-slate-100 pt-3">
            <div>
              {erroForm && (
                <p className="text-xs font-medium text-rose-600">{erroForm}</p>
              )}
            </div>
            <button
              type="button"
              onClick={adicionarMaterial}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Adicionar ao Estoque
            </button>
          </div>
        </div>

        {/* Filtros e Barra de Busca */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar insumo ou categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <FiltroBotao
              ativo={filtro === "todos"}
              onClick={() => setFiltro("todos")}
            >
              Todos
            </FiltroBotao>
            <FiltroBotao
              ativo={filtro === "ok"}
              onClick={() => setFiltro("ok")}
            >
              🟢 Ideais
            </FiltroBotao>
            <FiltroBotao
              ativo={filtro === "baixo"}
              onClick={() => setFiltro("baixo")}
            >
              🟡 Baixo Estoque
            </FiltroBotao>
            <FiltroBotao
              ativo={filtro === "zerado"}
              onClick={() => setFiltro("zerado")}
            >
              🔴 Zerados
            </FiltroBotao>
            <FiltroBotao
              ativo={filtro === "atencao_validade"}
              onClick={() => setFiltro("atencao_validade")}
            >
              Validade / Atenção
            </FiltroBotao>
            <FiltroBotao
              ativo={filtro === "comprar"}
              onClick={() => setFiltro("comprar")}
            >
              Mapeados p/ Compra
            </FiltroBotao>
          </div>
        </div>

        {/* Lista de Materiais em Grade / Cards */}
        <div className="space-y-2">
          {listaFiltrada.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
              Nenhum insumo encontrado para a busca ou filtro selecionado.
            </div>
          ) : (
            listaFiltrada.map((item) => {
              const { situacaoEstoque, situacaoValidade, precisaComprar } =
                avaliarItem(item);

              return (
                <div
                  key={item.id}
                  className={`rounded-lg border border-slate-200 bg-white p-4 border-l-4 transition-colors ${
                    situacaoEstoque === "zerado"
                      ? "border-l-rose-500"
                      : situacaoEstoque === "baixo"
                        ? "border-l-amber-400"
                        : "border-l-emerald-500"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Infos Principais */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex flex-col items-center justify-center rounded-md p-2 text-center min-w-[70px] ${
                          situacaoEstoque === "zerado"
                            ? "bg-rose-50 text-rose-700"
                            : situacaoEstoque === "baixo"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <Package className="h-4 w-4" />
                        <span className="mt-1 text-xs font-bold">
                          {item.quantidadeAtual} un
                        </span>
                        <span className="text-[9px] opacity-70">
                          Mín: {item.quantidadeMinima}
                        </span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                            {item.nome}
                          </h3>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {item.categoria}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            <span className="font-medium">Lote:</span>{" "}
                            {item.lote}
                          </span>
                          <span>
                            <span className="font-medium">Fornecedor:</span>{" "}
                            {item.fornecedor}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Alertas Rápidos e Ações */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 border-t border-slate-100 pt-2 sm:border-0 sm:pt-0">
                      <div className="flex flex-wrap gap-2">
                        {/* Indicador de Validade */}
                        {situacaoValidade === "vencido" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                            <Calendar className="h-3 w-3" /> Vencido (
                            {formatarDataBR(item.dataVencimento)})
                          </span>
                        )}
                        {situacaoValidade === "alerta" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                            <Calendar className="h-3 w-3" /> Vence em breve (
                            {formatarDataBR(item.dataVencimento)})
                          </span>
                        )}
                        {situacaoValidade === "valido" &&
                          item.dataVencimento && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              Val: {formatarDataBR(item.dataVencimento)}
                            </span>
                          )}

                        {/* Tag de Compra Obrigatória */}
                        {precisaComprar && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            <ShoppingCart className="h-3 w-3" /> Repor estoque
                          </span>
                        )}
                      </div>

                      {/* Botão de Exclusão */}
                      <button
                        onClick={() => removerMaterial(item.id)}
                        title="Remover material do inventário"
                        className="rounded-md border border-slate-200 p-2 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Subcomponentes Locais Auxiliares ----------

function ResumoCard({
  label,
  valor,
  tom,
  destaque,
  icone,
}: {
  label: string;
  valor: number;
  tom: "slate" | "emerald" | "amber" | "rose" | "purple";
  destaque?: boolean;
  icone?: React.ReactNode;
}) {
  const tons: Record<string, string> = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
    purple: "text-purple-600",
  };
  return (
    <div
      className={`rounded-lg border bg-white p-4 transition-all shadow-xs ${
        destaque ? "border-rose-300 ring-2 ring-rose-50" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
          {label}
        </p>
        {icone && <div className="text-slate-300">{icone}</div>}
      </div>
      <p className={`mt-2 text-2xl font-bold ${tons[tom]}`}>{valor}</p>
    </div>
  );
}

function FiltroBotao({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        ativo
          ? "bg-blue-600 text-white shadow-xs"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function CampoForm({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "date";
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}
