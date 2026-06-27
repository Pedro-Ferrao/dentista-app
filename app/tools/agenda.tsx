"use client";

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Lock, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Trash2,
  Search
} from 'lucide-react';

interface EventoAgenda {
  id: string;
  pacienteNome: string;
  procedimento: string;
  dentistaNome: string;
  horarioInicio: string; // "08:00"
  horarioFim: string; // "09:00"
  tipo: 'consulta' | 'bloqueio';
  motivoBloqueio?: string;
}

export default function AgendaIntegradaClinica() {
  // Controle de data (Iniciando no contexto atual de Junho de 2026)
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date(2026, 5, 26));
  const [mesVisao, setMesVisao] = useState({ ano: 2026, mes: 5 }); // 5 = Junho em JS Date
  
  const [busca, setBusca] = useState("");
  const [filtroDentista, setFiltroDentista] = useState("Todos");
  
  // Lista inicial limpa
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);

  // Estados do formulário de criação
  const [tipoModal, setTipoModal] = useState<'consulta' | 'bloqueio'>('consulta');
  const [formPaciente, setFormPaciente] = useState('');
  const [formProcedimento, setFormProcedimento] = useState('');
  const [formDentista, setFormDentista] = useState('');
  const [formInicio, setFormInicio] = useState('08:00');
  const [formFim, setFormFim] = useState('09:00');
  const [formMotivo, setFormMotivo] = useState('');
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Grade de horários da clínica
  const slotsHorarios = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  // Geração dinâmica dos dias do mini calendário
  const diasCalendario = useMemo(() => {
    const { ano, mes } = mesVisao;
    const primeiroDiaMes = new Date(ano, mes, 1).getDay();
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
    const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();

    const dias = [];

    // Dias do mês anterior para preenchimento
    for (let i = primeiroDiaMes - 1; i >= 0; i--) {
      dias.push({
        dia: totalDiasMesAnterior - i,
        mes: mes === 0 ? 11 : mes - 1,
        ano: mes === 0 ? ano - 1 : ano,
        isMesAtual: false
      });
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDiasMes; i++) {
      dias.push({
        dia: i,
        mes: mes,
        ano: ano,
        isMesAtual: true
      });
    }

    // Completar a grade até fechar semanas cheias se necessário
    const restante = 42 - dias.length; // 6 linhas padrão
    for (let i = 1; i <= restante; i++) {
      dias.push({
        dia: i,
        mes: mes === 11 ? 0 : mes + 1,
        ano: mes === 11 ? ano + 1 : ano,
        isMesAtual: false
      });
    }

    return dias;
  }, [mesVisao]);

  // Lista dinâmica e única de dentistas cadastrados para alimentar o filtro do cabeçalho
  const listaDentistasFiltro = useMemo(() => {
    const dentistasSet = new Set<string>();
    eventos.forEach(ev => {
      if (ev.dentistaNome.trim()) dentistasSet.add(ev.dentistaNome.trim());
    });
    return ["Todos", ...Array.from(dentistasSet)];
  }, [eventos]);

  // Filtragem dos compromissos da timeline
  const eventosFiltrados = useMemo(() => {
    return eventos.filter(ev => {
      const matchDentista = filtroDentista === "Todos" || ev.dentistaNome.toLowerCase().includes(filtroDentista.toLowerCase().trim());
      const termoBusca = busca.toLowerCase().trim();
      const matchBusca = !termoBusca || 
        ev.pacienteNome.toLowerCase().includes(termoBusca) || 
        ev.procedimento.toLowerCase().includes(termoBusca) || 
        (ev.motivoBloqueio && ev.motivoBloqueio.toLowerCase().includes(termoBusca)) ||
        ev.dentistaNome.toLowerCase().includes(termoBusca);
        
      return matchDentista && matchBusca;
    });
  }, [eventos, filtroDentista, busca]);

  const navegarMes = (direcao: 'ant' | 'prox') => {
    setMesVisao(prev => {
      let novoMes = prev.mes + (direcao === 'prox' ? 1 : -1);
      let novoAno = prev.ano;
      if (novoMes > 11) { novoMes = 0; novoAno += 1; }
      if (novoMes < 0) { novoMes = 11; novoAno -= 1; }
      return { ano: novoAno, mes: novoMes };
    });
  };

  const adicionarEvento = (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    if (tipoModal === 'consulta' && (!formPaciente.trim() || !formDentista.trim())) {
      setErroForm("Preencha o nome do paciente e do dentista responsável.");
      return;
    }
    if (tipoModal === 'bloqueio' && !formMotivo.trim()) {
      setErroForm("Preencha o motivo do bloqueio da agenda.");
      return;
    }

    const novo: EventoAgenda = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      pacienteNome: tipoModal === 'consulta' ? formPaciente.trim() : '',
      procedimento: tipoModal === 'consulta' ? formProcedimento.trim() || 'Geral' : '',
      dentistaNome: formDentista.trim() || 'Não informado',
      horarioInicio: formInicio,
      horarioFim: formFim,
      tipo: tipoModal,
      motivoBloqueio: tipoModal === 'bloqueio' ? formMotivo.trim() : undefined
    };

    setEventos(prev => [...prev, novo]);
    
    // Resetar campos
    setFormPaciente('');
    setFormProcedimento('');
    setFormDentista('');
    setFormMotivo('');
  };

  const removerEvento = (id: string) => {
    setEventos(prev => prev.filter(ev => ev.id !== id));
  };

  const formatarNomeMes = (numMes: number) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[numMes];
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 text-slate-700">
      <div className="mx-auto max-w-5xl">
        
        {/* Cabeçalho seguindo o padrão de estilo visual */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Agenda Integrada e Bloqueio de Horários
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie o fluxo de atendimentos clínicos, intervalos e indisponibilidades.
          </p>
        </div>

        {/* Bloco de Criação / Formulário seguindo estilo do painel */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-700">
                Organizar grade de {dataSelecionada.toLocaleDateString('pt-BR')}
              </h2>
            </div>
            
            {/* Abas Alternadoras de Tipo */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-md">
              <button
                type="button"
                onClick={() => setTipoModal('consulta')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${tipoModal === 'consulta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Nova Consulta
              </button>
              <button
                type="button"
                onClick={() => setTipoModal('bloqueio')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${tipoModal === 'bloqueio' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-rose-900'}`}
              >
                Bloqueio de Horário
              </button>
            </div>
          </div>

          <form onSubmit={adicionarEvento} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {tipoModal === 'consulta' ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Nome do paciente *</label>
                    <input type="text" value={formPaciente} onChange={e => setFormPaciente(e.target.value)} placeholder="Ex: Ana Beatriz Souza" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Procedimento</label>
                    <input type="text" value={formProcedimento} onChange={e => setFormProcedimento(e.target.value)} placeholder="Ex: Canal ou Restauração" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Motivo do Bloqueio *</label>
                  <input type="text" value={formMotivo} onChange={e => setFormMotivo(e.target.value)} placeholder="Ex: Horário de Almoço ou Reunião" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
                </div>
              )}

              {/* Ajuste solicitado: Dentista Responsável agora é um INPUT EDITÁVEL (texto livre) */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Dentista Responsável *</label>
                <input type="text" value={formDentista} onChange={e => setFormDentista(e.target.value)} placeholder="Ex: Dr. Roberto Alves" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Início</label>
                  <select value={formInicio} onChange={e => setFormInicio(e.target.value)} className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                    {slotsHorarios.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Fim</label>
                  <select value={formFim} onChange={e => setFormFim(e.target.value)} className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                    {slotsHorarios.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {erroForm ? <p className="text-xs text-rose-600">{erroForm}</p> : <div />}
              <button
                type="submit"
                className={`flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${tipoModal === 'consulta' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                <Plus className="h-4 w-4" />
                {tipoModal === 'consulta' ? 'Agendar Atendimento' : 'Bloquear Horário'}
              </button>
            </div>
          </form>
        </div>

        {/* Área de Filtros e Busca de Atendimentos */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar na agenda..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs font-medium text-slate-400 uppercase">Filtrar Profissional:</span>
            <select
              value={filtroDentista}
              onChange={e => setFiltroDentista(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 outline-none focus:border-blue-400"
            >
              {listaDentistasFiltro.map(dentista => (
                <option key={dentista} value={dentista}>{dentista}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Layout Principal em Grade Lateral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Ajuste solicitado: Calendário TOTALMENTE FUNCIONAL */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 h-fit">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <button type="button" onClick={() => navegarMes('ant')} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-slate-700">
                {formatarNomeMes(mesVisao.mes)} de {mesVisao.ano}
              </span>
              <button type="button" onClick={() => navegarMes('prox')} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-1">
              <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
            </div>

            {/* Renderização dinâmica e interativa dos dias */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {diasCalendario.map((meta, idx) => {
                const dataItem = new Date(meta.ano, meta.mes, meta.dia);
                const isSelecionada = dataSelecionada.toDateString() === dataItem.toDateString();
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDataSelecionada(dataItem);
                      setMesVisao({ ano: meta.ano, mes: meta.mes });
                    }}
                    className={`p-2 font-medium rounded-lg transition-all ${
                      !meta.isMesAtual ? 'text-slate-300' : 'text-slate-700 hover:bg-slate-50'
                    } ${
                      isSelecionada ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' : ''
                    }`}
                  >
                    {meta.dia}
                  </button>
                );
              })}
            </div>

            {/* Seção de Legenda solicitada pela imagem de referência */}
            <div className="mt-5 border-t border-slate-100 pt-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Legenda</h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full"></span> Consulta Confirmada
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="h-2.5 w-2.5 bg-rose-500 rounded-full"></span> Bloqueio / Indisponível
                </div>
              </div>
            </div>
          </div>

          {/* Timeline da Agenda */}
          <div className="md:col-span-2 rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">
                Horários de Atendimento · {dataSelecionada.toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
              {slotsHorarios.map((time) => {
                const eventosNesseSlot = eventosFiltrados.filter(ev => ev.horarioInicio <= time && ev.horarioFim > time);

                return (
                  <div key={time} className="flex min-h-[60px] relative hover:bg-slate-50/40 transition-colors">
                    <div className="w-16 p-3 text-xs font-semibold text-slate-400 border-r border-slate-100 flex items-start justify-center pt-3.5">
                      {time}
                    </div>

                    <div className="flex-1 p-2 flex flex-col gap-1.5">
                      {eventosNesseSlot.length === 0 ? (
                        <span className="text-xs text-slate-300 italic pl-2 pt-1.5 select-none">Livre</span>
                      ) : (
                        eventosNesseSlot.map(ev => {
                          if (ev.horarioInicio !== time) return null; // Evita duplicação visual em slots estendidos
                          const isBloqueio = ev.tipo === 'bloqueio';
                          
                          return (
                            <div
                              key={ev.id}
                              className={`p-3 rounded-lg border border-l-4 text-xs flex justify-between items-start transition-shadow shadow-sm ${
                                isBloqueio 
                                  ? 'bg-rose-50/80 border-rose-200 border-l-rose-500 text-rose-900' 
                                  : 'bg-emerald-50/80 border-emerald-200 border-l-emerald-500 text-emerald-900'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <p className="font-semibold text-sm">
                                  {isBloqueio ? ev.motivoBloqueio : ev.pacienteNome}
                                </p>
                                <p className="text-slate-500 font-medium">
                                  {!isBloqueio && `${ev.procedimento} · `}{ev.horarioInicio} - {ev.horarioFim}
                                </p>
                                <p className="text-[11px] font-medium text-slate-400">
                                  Profissional: <span className="text-slate-600 font-semibold">{ev.dentistaNome}</span>
                                </p>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => removerEvento(ev.id)}
                                title="Remover da grade"
                                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}