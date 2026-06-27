"use client";

/**
 * Calculadora de Custo de Procedimento e Margem de Lucro
 * --------------------------------------------------------
 * Ferramenta para o dentista/gestor saber, com precisão, quanto cada
 * procedimento custa de verdade (materiais + taxa de cartão + repasse do
 * dentista) e quanto sobra de lucro real ao cobrar um determinado preço.
 *
 * Fluxo:
 * 1) Cadastrar os insumos (aba "Insumos"): nome, unidade e custo por uso.
 * 2) Criar um procedimento (aba "Procedimentos"): escolher quais insumos
 *    são usados e em que quantidade, definir o preço cobrado, a taxa do
 *    cartão e o repasse do dentista. O lucro real é calculado na hora.
 *
 * Como usar nesta versão:
 * - Os dados (insumos e procedimentos) vivem apenas no estado do React
 *   (em memória). Para persistir entre sessões, troque os `useState`
 *   por uma chamada à sua API/DB.
 * - Pressupõe Tailwind CSS configurado no projeto (padrão em apps Next 16).
 * - Usa `lucide-react` para os ícones (`npm i lucide-react`).
 *
 * Sugestão de rota: app/tools/calculadora-precificacao/page.tsx
 *   -> import CalculadoraPrecificacao from "@/tools/CalculadoraPrecificacao";
 *   -> export default function Page() { return <CalculadoraPrecificacao />; }
 */

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Package,
  Stethoscope,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// ---------- Tipos ----------

interface Insumo {
  id: string;
  nome: string;
  unidade: string; // ex: "unidade", "par", "ml", "caixa"
  custoPorUso: number; // custo já calculado por aplicação/uso no procedimento
}

interface ItemUsado {
  insumoId: string;
  quantidade: number;
}

type TipoRepasse = "percentual" | "fixo";

interface Procedimento {
  id: string;
  nome: string;
  precoCobrado: number;
  taxaCartaoPercentual: number;
  tipoRepasse: TipoRepasse;
  valorRepasse: number;
  itens: ItemUsado[];
}

interface Resultado {
  custoMateriais: number;
  taxaCartao: number;
  repasseDentista: number;
  custoTotal: number;
  lucroReal: number;
  margemPercentual: number;
}

// ---------- Helpers ----------

function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function calcularResultado(
  itens: ItemUsado[],
  insumos: Insumo[],
  precoCobrado: number,
  taxaCartaoPercentual: number,
  tipoRepasse: TipoRepasse,
  valorRepasse: number,
): Resultado {
  const custoMateriais = itens.reduce((soma, item) => {
    const insumo = insumos.find((i) => i.id === item.insumoId);
    if (!insumo) return soma;
    return soma + insumo.custoPorUso * item.quantidade;
  }, 0);

  const taxaCartao = precoCobrado * (taxaCartaoPercentual / 100);

  const repasseDentista =
    tipoRepasse === "percentual"
      ? precoCobrado * (valorRepasse / 100)
      : valorRepasse;

  const custoTotal = custoMateriais + taxaCartao + repasseDentista;
  const lucroReal = precoCobrado - custoTotal;
  const margemPercentual =
    precoCobrado > 0 ? (lucroReal / precoCobrado) * 100 : 0;

  return {
    custoMateriais,
    taxaCartao,
    repasseDentista,
    custoTotal,
    lucroReal,
    margemPercentual,
  };
}

function corMargem(margem: number): {
  texto: string;
  badge: string;
  faixa: string;
} {
  if (margem < 0) {
    return {
      texto: "text-rose-600",
      badge: "bg-rose-50 text-rose-700 border border-rose-200",
      faixa: "Prejuízo",
    };
  }
  if (margem < 20) {
    return {
      texto: "text-amber-600",
      badge: "bg-amber-50 text-amber-700 border border-amber-200",
      faixa: "Margem baixa",
    };
  }
  return {
    texto: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    faixa: "Margem saudável",
  };
}

const UNIDADES = ["unidade", "par", "ml", "g", "caixa", "uso"];

// ---------- Componente principal ----------

export default function CalculadoraPrecificacao() {
  const [aba, setAba] = useState<"insumos" | "procedimentos">("insumos");

  // ----- Insumos -----
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [novoInsumo, setNovoInsumo] = useState({
    nome: "",
    unidade: "unidade",
    custoPorUso: "",
  });
  const [erroInsumo, setErroInsumo] = useState<string | null>(null);

  function adicionarInsumo() {
    const custo = parseFloat(novoInsumo.custoPorUso.replace(",", "."));
    if (!novoInsumo.nome.trim() || isNaN(custo) || custo < 0) {
      setErroInsumo("Informe o nome e um custo por uso válido (ex: 1,20).");
      return;
    }
    setInsumos((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nome: novoInsumo.nome.trim(),
        unidade: novoInsumo.unidade,
        custoPorUso: custo,
      },
    ]);
    setNovoInsumo({ nome: "", unidade: "unidade", custoPorUso: "" });
    setErroInsumo(null);
  }

  function removerInsumo(id: string) {
    setInsumos((prev) => prev.filter((i) => i.id !== id));
    // Também remove o insumo de qualquer procedimento já salvo que o usava
    setProcedimentos((prev) =>
      prev.map((p) => ({
        ...p,
        itens: p.itens.filter((item) => item.insumoId !== id),
      })),
    );
  }

  // ----- Procedimentos -----
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [novoProcedimento, setNovoProcedimento] = useState({
    nome: "",
    precoCobrado: "",
    taxaCartaoPercentual: "3,5",
    tipoRepasse: "percentual" as TipoRepasse,
    valorRepasse: "50",
  });
  const [itensSelecionados, setItensSelecionados] = useState<
    Record<string, string>
  >({});
  const [erroProcedimento, setErroProcedimento] = useState<string | null>(null);

  function alternarInsumoSelecionado(insumoId: string, marcado: boolean) {
    setItensSelecionados((prev) => {
      const novo = { ...prev };
      if (marcado) {
        novo[insumoId] = novo[insumoId] ?? "1";
      } else {
        delete novo[insumoId];
      }
      return novo;
    });
  }

  function atualizarQuantidade(insumoId: string, quantidade: string) {
    setItensSelecionados((prev) => ({ ...prev, [insumoId]: quantidade }));
  }

  const itensDoFormulario: ItemUsado[] = useMemo(() => {
    return Object.entries(itensSelecionados)
      .map(([insumoId, qtd]) => ({
        insumoId,
        quantidade: parseFloat(qtd.replace(",", ".")) || 0,
      }))
      .filter((item) => item.quantidade > 0);
  }, [itensSelecionados]);

  const previaResultado = useMemo(() => {
    const preco = parseFloat(novoProcedimento.precoCobrado.replace(",", "."));
    const taxa = parseFloat(
      novoProcedimento.taxaCartaoPercentual.replace(",", "."),
    );
    const repasse = parseFloat(novoProcedimento.valorRepasse.replace(",", "."));
    return calcularResultado(
      itensDoFormulario,
      insumos,
      isNaN(preco) ? 0 : preco,
      isNaN(taxa) ? 0 : taxa,
      novoProcedimento.tipoRepasse,
      isNaN(repasse) ? 0 : repasse,
    );
  }, [
    itensDoFormulario,
    insumos,
    novoProcedimento.precoCobrado,
    novoProcedimento.taxaCartaoPercentual,
    novoProcedimento.tipoRepasse,
    novoProcedimento.valorRepasse,
  ]);

  function salvarProcedimento() {
    const preco = parseFloat(novoProcedimento.precoCobrado.replace(",", "."));
    if (!novoProcedimento.nome.trim() || isNaN(preco) || preco <= 0) {
      setErroProcedimento(
        "Informe o nome do procedimento e um preço cobrado válido.",
      );
      return;
    }
    if (itensDoFormulario.length === 0) {
      setErroProcedimento(
        "Selecione ao menos um insumo usado neste procedimento.",
      );
      return;
    }

    const taxa = parseFloat(
      novoProcedimento.taxaCartaoPercentual.replace(",", "."),
    );
    const repasse = parseFloat(novoProcedimento.valorRepasse.replace(",", "."));

    const procedimento: Procedimento = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nome: novoProcedimento.nome.trim(),
      precoCobrado: preco,
      taxaCartaoPercentual: isNaN(taxa) ? 0 : taxa,
      tipoRepasse: novoProcedimento.tipoRepasse,
      valorRepasse: isNaN(repasse) ? 0 : repasse,
      itens: itensDoFormulario,
    };

    setProcedimentos((prev) => [...prev, procedimento]);
    setNovoProcedimento({
      nome: "",
      precoCobrado: "",
      taxaCartaoPercentual: "3,5",
      tipoRepasse: "percentual",
      valorRepasse: "50",
    });
    setItensSelecionados({});
    setErroProcedimento(null);
  }

  function removerProcedimento(id: string) {
    setProcedimentos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Calculadora de Custo de Procedimento e Margem de Lucro
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre os insumos, monte o procedimento e veja o lucro real — não
            o lucro que você imagina ter.
          </p>
        </div>

        {/* Abas */}
        <div className="mb-6 flex gap-1.5 border-b border-slate-200">
          <AbaBotao
            ativo={aba === "insumos"}
            onClick={() => setAba("insumos")}
            icone={<Package className="h-4 w-4" />}
          >
            Insumos ({insumos.length})
          </AbaBotao>
          <AbaBotao
            ativo={aba === "procedimentos"}
            onClick={() => setAba("procedimentos")}
            icone={<Stethoscope className="h-4 w-4" />}
          >
            Procedimentos ({procedimentos.length})
          </AbaBotao>
        </div>

        {aba === "insumos" ? (
          <AbaInsumos
            insumos={insumos}
            novoInsumo={novoInsumo}
            setNovoInsumo={setNovoInsumo}
            erroInsumo={erroInsumo}
            adicionarInsumo={adicionarInsumo}
            removerInsumo={removerInsumo}
          />
        ) : (
          <AbaProcedimentos
            insumos={insumos}
            procedimentos={procedimentos}
            novoProcedimento={novoProcedimento}
            setNovoProcedimento={setNovoProcedimento}
            itensSelecionados={itensSelecionados}
            alternarInsumoSelecionado={alternarInsumoSelecionado}
            atualizarQuantidade={atualizarQuantidade}
            previaResultado={previaResultado}
            erroProcedimento={erroProcedimento}
            salvarProcedimento={salvarProcedimento}
            removerProcedimento={removerProcedimento}
          />
        )}
      </div>
    </div>
  );
}

// ---------- Aba: Insumos ----------

function AbaInsumos({
  insumos,
  novoInsumo,
  setNovoInsumo,
  erroInsumo,
  adicionarInsumo,
  removerInsumo,
}: {
  insumos: Insumo[];
  novoInsumo: { nome: string; unidade: string; custoPorUso: string };
  setNovoInsumo: React.Dispatch<
    React.SetStateAction<{ nome: string; unidade: string; custoPorUso: string }>
  >;
  erroInsumo: string | null;
  adicionarInsumo: () => void;
  removerInsumo: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-700">
            Adicionar insumo
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Nome do insumo *
            </label>
            <input
              type="text"
              value={novoInsumo.nome}
              placeholder="Ex: Resina composta"
              onChange={(e) =>
                setNovoInsumo((prev) => ({ ...prev, nome: e.target.value }))
              }
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Unidade
            </label>
            <select
              value={novoInsumo.unidade}
              onChange={(e) =>
                setNovoInsumo((prev) => ({
                  ...prev,
                  unidade: e.target.value,
                }))
              }
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Custo por uso (R$) *
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={novoInsumo.custoPorUso}
              placeholder="Ex: 1,20"
              onChange={(e) =>
                setNovoInsumo((prev) => ({
                  ...prev,
                  custoPorUso: e.target.value,
                }))
              }
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Dica: informe quanto custa cada vez que o insumo é usado em um
          atendimento (ex: 1 par de luvas, 1g de resina), não o preço da caixa
          inteira.
        </p>

        <div className="mt-3 flex items-center justify-between">
          {erroInsumo && <p className="text-xs text-rose-600">{erroInsumo}</p>}
          <button
            type="button"
            onClick={adicionarInsumo}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Adicionar insumo
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {insumos.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            Nenhum insumo cadastrado ainda. Comece adicionando luvas, sugador,
            babador, resina, anestésico etc.
          </div>
        )}
        {insumos.map((insumo) => (
          <div
            key={insumo.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {insumo.nome}
              </p>
              <p className="text-xs text-slate-500">
                {formatBRL(insumo.custoPorUso)} por {insumo.unidade}
              </p>
            </div>
            <button
              onClick={() => removerInsumo(insumo.id)}
              title="Remover insumo"
              className="flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Aba: Procedimentos ----------

interface NovoProcedimentoForm {
  nome: string;
  precoCobrado: string;
  taxaCartaoPercentual: string;
  tipoRepasse: TipoRepasse;
  valorRepasse: string;
}

function AbaProcedimentos({
  insumos,
  procedimentos,
  novoProcedimento,
  setNovoProcedimento,
  itensSelecionados,
  alternarInsumoSelecionado,
  atualizarQuantidade,
  previaResultado,
  erroProcedimento,
  salvarProcedimento,
  removerProcedimento,
}: {
  insumos: Insumo[];
  procedimentos: Procedimento[];
  novoProcedimento: NovoProcedimentoForm;
  setNovoProcedimento: React.Dispatch<
    React.SetStateAction<NovoProcedimentoForm>
  >;
  itensSelecionados: Record<string, string>;
  alternarInsumoSelecionado: (insumoId: string, marcado: boolean) => void;
  atualizarQuantidade: (insumoId: string, quantidade: string) => void;
  previaResultado: Resultado;
  erroProcedimento: string | null;
  salvarProcedimento: () => void;
  removerProcedimento: (id: string) => void;
}) {
  const corPrevia = corMargem(previaResultado.margemPercentual);

  return (
    <div>
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-700">
            Novo procedimento
          </h2>
        </div>

        {insumos.length === 0 ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Cadastre ao menos um insumo na aba "Insumos" antes de criar um
            procedimento.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Nome do procedimento *
                </label>
                <input
                  type="text"
                  value={novoProcedimento.nome}
                  placeholder="Ex: Canal no dente 22"
                  onChange={(e) =>
                    setNovoProcedimento((prev) => ({
                      ...prev,
                      nome: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Preço cobrado (R$) *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={novoProcedimento.precoCobrado}
                  placeholder="Ex: 150,00"
                  onChange={(e) =>
                    setNovoProcedimento((prev) => ({
                      ...prev,
                      precoCobrado: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Taxa do cartão (%)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={novoProcedimento.taxaCartaoPercentual}
                  placeholder="Ex: 3,5"
                  onChange={(e) =>
                    setNovoProcedimento((prev) => ({
                      ...prev,
                      taxaCartaoPercentual: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Repasse do dentista */}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Repasse do dentista
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setNovoProcedimento((prev) => ({
                        ...prev,
                        tipoRepasse: "percentual",
                      }))
                    }
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      novoProcedimento.tipoRepasse === "percentual"
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    % do preço
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNovoProcedimento((prev) => ({
                        ...prev,
                        tipoRepasse: "fixo",
                      }))
                    }
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      novoProcedimento.tipoRepasse === "fixo"
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Valor fixo (R$)
                  </button>
                </div>
              </div>
              <div className="w-32">
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  {novoProcedimento.tipoRepasse === "percentual"
                    ? "Valor (%)"
                    : "Valor (R$)"}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={novoProcedimento.valorRepasse}
                  onChange={(e) =>
                    setNovoProcedimento((prev) => ({
                      ...prev,
                      valorRepasse: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Seleção de insumos */}
            <div className="mt-4">
              <label className="mb-2 block text-xs font-medium text-slate-500">
                Insumos usados neste procedimento
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {insumos.map((insumo) => {
                  const marcado = insumo.id in itensSelecionados;
                  return (
                    <div
                      key={insumo.id}
                      className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${
                        marcado
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <label className="flex flex-1 items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={(e) =>
                            alternarInsumoSelecionado(
                              insumo.id,
                              e.target.checked,
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                        />
                        <span>
                          {insumo.nome}{" "}
                          <span className="text-xs text-slate-400">
                            ({formatBRL(insumo.custoPorUso)}/{insumo.unidade})
                          </span>
                        </span>
                      </label>
                      {marcado && (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={itensSelecionados[insumo.id]}
                          onChange={(e) =>
                            atualizarQuantidade(insumo.id, e.target.value)
                          }
                          className="w-16 rounded-md border border-slate-200 px-2 py-1 text-right text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prévia do resultado */}
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Prévia do cálculo
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <LinhaCusto
                  label="Custo materiais"
                  valor={previaResultado.custoMateriais}
                />
                <LinhaCusto
                  label="Taxa cartão"
                  valor={previaResultado.taxaCartao}
                />
                <LinhaCusto
                  label="Repasse dentista"
                  valor={previaResultado.repasseDentista}
                />
                <div>
                  <p className="text-xs text-slate-500">Lucro real</p>
                  <p className={`font-semibold ${corPrevia.texto}`}>
                    {formatBRL(previaResultado.lucroReal)} (
                    {previaResultado.margemPercentual.toFixed(1)}%)
                  </p>
                </div>
              </div>
              {previaResultado.lucroReal < 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Esse preço dá prejuízo — o custo total é maior do que o valor
                  cobrado.
                </p>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              {erroProcedimento && (
                <p className="text-xs text-rose-600">{erroProcedimento}</p>
              )}
              <button
                type="button"
                onClick={salvarProcedimento}
                className="ml-auto flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Salvar procedimento
              </button>
            </div>
          </>
        )}
      </div>

      {/* Lista de procedimentos salvos */}
      <div className="space-y-3">
        {procedimentos.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            Nenhum procedimento calculado ainda.
          </div>
        )}
        {procedimentos.map((p) => {
          const resultado = calcularResultado(
            p.itens,
            insumos,
            p.precoCobrado,
            p.taxaCartaoPercentual,
            p.tipoRepasse,
            p.valorRepasse,
          );
          const cor = corMargem(resultado.margemPercentual);
          return (
            <div
              key={p.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">{p.nome}</h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cor.badge}`}
                    >
                      {resultado.margemPercentual < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {cor.faixa}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Preço cobrado: {formatBRL(p.precoCobrado)} · Cartão{" "}
                    {p.taxaCartaoPercentual}% · Repasse{" "}
                    {p.tipoRepasse === "percentual"
                      ? `${p.valorRepasse}%`
                      : formatBRL(p.valorRepasse)}
                  </p>
                </div>
                <button
                  onClick={() => removerProcedimento(p.id)}
                  title="Remover procedimento"
                  className="flex items-center justify-center self-start rounded-md border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3 text-sm sm:grid-cols-4">
                <LinhaCusto
                  label="Custo materiais"
                  valor={resultado.custoMateriais}
                />
                <LinhaCusto label="Taxa cartão" valor={resultado.taxaCartao} />
                <LinhaCusto
                  label="Repasse dentista"
                  valor={resultado.repasseDentista}
                />
                <div>
                  <p className="text-xs text-slate-500">Lucro real</p>
                  <p className={`font-semibold ${cor.texto}`}>
                    {formatBRL(resultado.lucroReal)} (
                    {resultado.margemPercentual.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Componentes auxiliares ----------

function LinhaCusto({ label, valor }: { label: string; valor: number }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-700">{formatBRL(valor)}</p>
    </div>
  );
}

function AbaBotao({
  ativo,
  onClick,
  icone,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        ativo
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {icone}
      {children}
    </button>
  );
}
