"use client";

import { useState } from "react";
// 1. Importando as ferramentas da pasta tools
import ConfirmacaoPacientes from "./tools/confirmacaopacientes";
import CalculadoraPrecos from "./tools/calculadoraprecos"; 
import Geradororcamento from "./tools/geradororcamento";
import Controleestoque from "./tools/controleestoque";  
import Agenda from "./tools/agenda"; 

interface Tool {
  id: string;
  label: string;
  desc: string;
}

const TOOLS: Tool[] = [
  {
    id: "confirmacaopacientes",
    label: "Painel de Confirmação e Fluxo de Pacientes",
    desc: "Gerencie o fluxo e confirmações de consultas.",
  },
  
  {
    id: "agenda",
    label: "Agenda Integrada e Bloqueio de Horários",
    desc: "Ambiente de testes configurado.",
  },

  {
    id: "calculadoraprecos",
    label: "Calculadora de Preços",
    desc: "Ambiente de testes configurado.",
  },
  {
    id: "geradororcamento",
    label: "Gerador de Orçamentos",
    desc: "Ambiente de testes configurado.",
  },
  {
    id: "controleestoque",
    label: "Controle de Estoque",
    desc: "Ambiente de testes configurado.",
  },

];

export default function Home() {
  const [toolAtiva, setToolAtiva] = useState<Tool | null>(null);

  const handleCardClick = (tool: Tool) => {
    setToolAtiva(tool);
  };

  const handleVoltar = () => {
    setToolAtiva(null);
  };

  return (
    <>
      {/* Header */}
      <header style={style.header}>
        <img src="/logo.png" alt="Prime Logotipo" style={style.headerLogo} />
        <div style={style.headerDivider} />
        <h1 style={style.headerTitle}>
          {toolAtiva ? toolAtiva.label : "Sorriso & Cia · Portal de Ferramentas"}
        </h1>
        {toolAtiva && (
          <button onClick={handleVoltar} style={style.backButton}>
            ← Voltar ao Painel
          </button>
        )}
      </header>

      {/* Conteúdo Dinâmico */}
      <main style={style.home}>
        {/* 2. Nova estrutura condicional usando IFS para renderizar a ferramenta correta */}
        {toolAtiva?.id === "confirmacaopacientes" && <ConfirmacaoPacientes />}
        {toolAtiva?.id === "calculadoraprecos" && <CalculadoraPrecos />}
        {toolAtiva?.id === "geradororcamento" && <Geradororcamento />}
        {toolAtiva?.id === "controleestoque" && <Controleestoque />}
        {toolAtiva?.id === "agenda" && <Agenda/>}

        {/* Se nenhuma ferramenta estiver ativa, mostra a listagem inicial */}
        {!toolAtiva && (
          <>
            <div style={style.homeGreeting}>
              <h1>Olá, Usuário 👋</h1>
              <p style={style.homeSubtext}>Selecione uma ferramenta abaixo para iniciar os trabalhos.</p>
            </div>

            <h3 style={style.homeSectionLabel}>Ferramentas Disponíveis</h3>

            <div style={style.toolsGrid}>
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  style={style.toolCard}
                  onClick={() => handleCardClick(tool)}
                >
                  <div style={style.cardLabel}>{tool.label}</div>
                  <p style={style.cardDesc}>{tool.desc}</p>
                  
                  <div style={style.cardArrow}>
                    Acessar →
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      <footer style={style.footer}>
        <div style={style.footerContent}>
          <img 
            src="/pfstudio-mkt.png" 
            alt="PFStudio MKT Logo" 
            style={style.footerLogo} 
          />
          <div style={style.footerTextGroup}>
            <p style={style.footerText}>
              © {new Date().getFullYear()} Portal de Ferramentas. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

const style = {
  header: { display: "flex", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#ffffff" },
  headerLogo: { height: "75px", width: "auto" },
  headerDivider: { width: "1px", height: "24px", background: "#e2e8f0", margin: "0 16px" },
  headerTitle: { fontSize: "16px", fontWeight: 600, color: "#1a202c", flex: 1 },
  backButton: { background: "#1a9fd4", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 600 },

  home: { flex: 1, display: "flex", flexDirection: "column" as const, overflowY: "auto" as const, padding: "32px 24px" },
  homeGreeting: { marginBottom: "28px" },
  homeSubtext: { color: "#4a5568", marginTop: "4px" },
  homeSectionLabel: { fontSize: "10px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" as const, color: "#718096", marginBottom: "14px" },
  toolsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px", marginBottom: "32px" },
  toolCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "26px 20px", cursor: "pointer", textAlign: "left" as const, width: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  cardLabel: { fontSize: "15px", fontWeight: 700, color: "#1a202c", marginBottom: "6px" },
  cardDesc: { fontSize: "12px", color: "#4a5568", lineHeight: 1.5 },
  cardArrow: { display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "16px", color: "#1a9fd4", fontSize: "12px", fontWeight: 600 },

  footer: { borderTop: "1px solid #e2e8f0", background: "#ffffff", padding: "24px", marginTop: "auto" },
  footerContent: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: "12px" },
  footerLogo: { height: "35px", width: "auto", opacity: 0.8 },
  footerTextGroup: { textAlign: "center" as const },
  footerText: { fontSize: "12px", color: "#718096", fontWeight: 500 },
  footerSubtext: { fontSize: "11px", color: "#a0aec0", marginTop: "2px" },
};