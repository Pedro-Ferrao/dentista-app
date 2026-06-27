"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Clock,
  XCircle,
  MessageCircle,
  Copy,
  Search,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";

type StatusPaciente = "pendente" | "confirmado" | "desmarcou";

interface Paciente {
  id: string;
  nome: string;
  telefone: string; // formato: (11) 91234-5678
  horario: string; // "09:00"
  medico: string;
  procedimento: string;
  status: StatusPaciente;
}

const NOME_CLINICA = "Sorriso & Cia";

const pacientesIniciais: Paciente[] = [];

function getDataAmanha(): string {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  return amanha.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function montarMensagem(p: Paciente): string {
  return `Olá, ${p.nome.split(" ")[0]}! 😊 Aqui é da ${NOME_CLINICA}.\n\nEstamos confirmando seu horário de amanhã (${getDataAmanha()}) às ${p.horario} com ${p.medico}, para ${p.procedimento}.\n\nPor favor, responda:\n✅ CONFIRMAR — para manter o horário\n❌ DESMARCAR — se não puder vir\n\nAté breve!`;
}

function linkWhatsApp(p: Paciente): string {
  const numero = p.telefone.replace(/\D/g, "");
  return `https://wa.me/55${numero}?text=${encodeURIComponent(montarMensagem(p))}`;
}

const STATUS_CONFIG: Record<
  StatusPaciente,
  { label: string; border: string; badge: string; dot: string }
> = {
  confirmado: {
    label: "Confirmado",
    border: "border-l-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  pendente: {
    label: "Pendente",
    border: "border-l-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-400",
  },
  desmarcou: {
    label: "Desmarcou",
    border: "border-l-rose-500",
    badge: "bg-rose-50 text-rose-700 border border-rose-200",
    dot: "bg-rose-500",
  },
};

type Filtro = "todos" | StatusPaciente;

export default function PainelConfirmacaoPacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>(pacientesIniciais);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const [novoPaciente, setNovoPaciente] = useState({
    nome: "",
    telefone: "",
    horario: "",
    medico: "",
    procedimento: "",
    status: "pendente" as StatusPaciente,
  });
  const [erroForm, setErroForm] = useState<string | null>(null);

  const contagem = useMemo(() => {
    return {
      total: pacientes.length,
      confirmado: pacientes.filter((p) => p.status === "confirmado").length,
      pendente: pacientes.filter((p) => p.status === "pendente").length,
      desmarcou: pacientes.filter((p) => p.status === "desmarcou").length,
    };
  }, [pacientes]);

  const listaFiltrada = useMemo(() => {
    return pacientes
      .filter((p) => (filtro === "todos" ? true : p.status === filtro))
      .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase().trim()))
      .sort((a, b) => a.horario.localeCompare(b.horario));
  }, [pacientes, busca, filtro]);

  function alterarStatus(id: string, novoStatus: StatusPaciente) {
    setPacientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: novoStatus } : p)),
    );
  }

  function copiarMensagem(p: Paciente) {
    navigator.clipboard.writeText(montarMensagem(p)).then(() => {
      setCopiadoId(p.id);
      setTimeout(() => setCopiadoId(null), 2000);
    });
  }

  function atualizarCampoNovo(campo: keyof typeof novoPaciente, valor: string) {
    setNovoPaciente((prev) => ({ ...prev, [campo]: valor }));
  }

  function adicionarPaciente() {
    if (
      !novoPaciente.nome.trim() ||
      !novoPaciente.telefone.trim() ||
      !novoPaciente.horario.trim()
    ) {
      setErroForm("Preencha pelo menos nome, telefone e horário.");
      return;
    }

    const paciente: Paciente = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nome: novoPaciente.nome.trim(),
      telefone: novoPaciente.telefone.trim(),
      horario: novoPaciente.horario.trim(),
      medico: novoPaciente.medico.trim() || "Não informado",
      procedimento: novoPaciente.procedimento.trim() || "Não informado",
      status: novoPaciente.status,
    };

    setPacientes((prev) => [...prev, paciente]);
    setErroForm(null);
    setNovoPaciente({
      nome: "",
      telefone: "",
      horario: "",
      medico: "",
      procedimento: "",
      status: "pendente",
    });
  }

  function removerPaciente(id: string) {
    setPacientes((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Painel de Confirmação e Fluxo de Pacientes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Agenda de amanhã, {getDataAmanha()} · Confirme presenças e
            identifique horários livres para encaixe.
          </p>
        </div>

        {/* Cards de resumo (visão do gestor) */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResumoCard label="Total do dia" valor={contagem.total} tom="slate" />
          <ResumoCard
            label="Confirmados"
            valor={contagem.confirmado}
            tom="emerald"
          />
          <ResumoCard label="Pendentes" valor={contagem.pendente} tom="amber" />
          <ResumoCard
            label="Vagos (desmarcaram)"
            valor={contagem.desmarcou}
            tom="rose"
            destaque={contagem.desmarcou > 0}
          />
        </div>

        {contagem.desmarcou > 0 && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              {contagem.desmarcou}{" "}
              {contagem.desmarcou === 1 ? "horário vagou" : "horários vagaram"}{" "}
              e podem ser oferecidos para encaixe.
            </span>
          </div>
        )}

        {/* Cadastro de paciente (preenchido pela recepção) */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-700">
              Adicionar paciente à agenda de amanhã
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <CampoForm
              label="Nome do paciente *"
              value={novoPaciente.nome}
              placeholder="Ex: Ana Beatriz Souza"
              onChange={(v) => atualizarCampoNovo("nome", v)}
            />
            <CampoForm
              label="Telefone (WhatsApp) *"
              value={novoPaciente.telefone}
              placeholder="(11) 91234-5678"
              onChange={(v) => atualizarCampoNovo("telefone", v)}
            />
            <CampoForm
              label="Horário *"
              type="time"
              value={novoPaciente.horario}
              onChange={(v) => atualizarCampoNovo("horario", v)}
            />
            <CampoForm
              label="Médico(a)"
              value={novoPaciente.medico}
              placeholder="Ex: Dra. Carla Mendes"
              onChange={(v) => atualizarCampoNovo("medico", v)}
            />
            <CampoForm
              label="Procedimento"
              value={novoPaciente.procedimento}
              placeholder="Ex: Limpeza"
              onChange={(v) => atualizarCampoNovo("procedimento", v)}
            />
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Situação inicial
              </label>
              <div className="flex gap-1.5">
                {(
                  ["pendente", "confirmado", "desmarcou"] as StatusPaciente[]
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => atualizarCampoNovo("status", s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      novoPaciente.status === s
                        ? STATUS_CONFIG[s].badge + " ring-1 ring-inset"
                        : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={adicionarPaciente}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Adicionar à lista
            </button>
          </div>

          {erroForm && <p className="mt-2 text-xs text-rose-600">{erroForm}</p>}
        </div>

        {/* Busca e filtros */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar paciente..."
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
              ativo={filtro === "pendente"}
              onClick={() => setFiltro("pendente")}
            >
              Pendentes
            </FiltroBotao>
            <FiltroBotao
              ativo={filtro === "confirmado"}
              onClick={() => setFiltro("confirmado")}
            >
              Confirmados
            </FiltroBotao>
            <FiltroBotao
              ativo={filtro === "desmarcou"}
              onClick={() => setFiltro("desmarcou")}
            >
              Desmarcaram
            </FiltroBotao>
          </div>
        </div>

        {/* Lista de pacientes */}
        <div className="space-y-2">
          {listaFiltrada.length === 0 && pacientes.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
              Nenhum paciente cadastrado ainda. Use o formulário acima para
              adicionar o primeiro paciente de amanhã.
            </div>
          )}
          {listaFiltrada.length === 0 && pacientes.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              Nenhum paciente encontrado para esse filtro.
            </div>
          )}

          {listaFiltrada.map((p) => {
            const cfg = STATUS_CONFIG[p.status];
            return (
              <div
                key={p.id}
                className={`rounded-lg border border-slate-200 bg-white p-4 border-l-4 ${cfg.border} transition-colors`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Dados do paciente */}
                  <div className="flex items-start gap-3 sm:items-center">
                    <div className="flex flex-col items-center justify-center rounded-md bg-slate-50 px-2.5 py-1.5 text-center">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="mt-0.5 text-xs font-medium text-slate-600">
                        {p.horario}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {p.nome}
                        </span>
                        <span
                          className={`hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline-flex ${cfg.badge}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {p.medico} · {p.procedimento} · {p.telefone}
                      </p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1.5 sm:flex-shrink-0">
                    <span
                      className={`mr-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium sm:hidden ${cfg.badge}`}
                    >
                      {cfg.label}
                    </span>

                    <StatusBotao
                      ativo={p.status === "confirmado"}
                      tom="emerald"
                      icone={<Check className="h-3.5 w-3.5" />}
                      onClick={() => alterarStatus(p.id, "confirmado")}
                    >
                      Confirmado
                    </StatusBotao>
                    <StatusBotao
                      ativo={p.status === "pendente"}
                      tom="amber"
                      icone={<Clock className="h-3.5 w-3.5" />}
                      onClick={() => alterarStatus(p.id, "pendente")}
                    >
                      Pendente
                    </StatusBotao>
                    <StatusBotao
                      ativo={p.status === "desmarcou"}
                      tom="rose"
                      icone={<XCircle className="h-3.5 w-3.5" />}
                      onClick={() => alterarStatus(p.id, "desmarcou")}
                    >
                      Desmarcou
                    </StatusBotao>

                    <div className="ml-1 flex items-center gap-1 border-l border-slate-200 pl-2">
                      <button
                        onClick={() => copiarMensagem(p)}
                        title="Copiar mensagem de confirmação"
                        className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copiadoId === p.id ? "Copiado!" : ""}
                      </button>
                      <a
                        href={linkWhatsApp(p)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Enviar confirmação pelo WhatsApp"
                        className="flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-600"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                      <button
                        onClick={() => removerPaciente(p.id)}
                        title="Remover paciente da lista"
                        className="flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ResumoCard({
  label,
  valor,
  tom,
  destaque,
}: {
  label: string;
  valor: number;
  tom: "slate" | "emerald" | "amber" | "rose";
  destaque?: boolean;
}) {
  const tons: Record<string, string> = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };
  return (
    <div
      className={`rounded-lg border bg-white p-4 ${
        destaque ? "border-rose-300 ring-1 ring-rose-100" : "border-slate-200"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${tons[tom]}`}>{valor}</p>
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
          ? "bg-blue-600 text-white"
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
  type?: "text" | "time";
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

function StatusBotao({
  ativo,
  tom,
  icone,
  onClick,
  children,
}: {
  ativo: boolean;
  tom: "emerald" | "amber" | "rose";
  icone: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const tons: Record<string, string> = {
    emerald: "bg-emerald-500 text-white border-emerald-500",
    amber: "bg-amber-400 text-white border-amber-400",
    rose: "bg-rose-500 text-white border-rose-500",
  };
  return (
    <button
      onClick={onClick}
      className={`hidden items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors md:flex ${
        ativo
          ? tons[tom]
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
      }`}
    >
      {icone}
      {children}
    </button>
  );
}
