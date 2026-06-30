"use client";

import { useState, useEffect, type ReactElement } from "react";
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

// Ícones simples por ferramenta — traço único, cor herdada (currentColor)
const ICONS: Record<string, ReactElement> = {
  confirmacaopacientes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 21c-3.2-3.6-6-7.1-6-10.8C6 6.3 8.7 3 12 3s6 3.3 6 7.2c0 3.7-2.8 7.2-6 10.8Z" />
      <path d="m9 11 2 2 4-4" />
    </svg>
  ),
  agenda: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3.2M16 3v3.2" />
      <path d="M8 13.2h2M8 16.6h5" />
    </svg>
  ),
  calculadoraprecos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <path d="M8 7.5h8M8 12h.01M12 12h.01M16 12h.01M8 15.5h.01M12 15.5h.01M16 15.5h.01" />
    </svg>
  ),
  geradororcamento: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 3.5h12v17l-2.5-1.6L13 20.5l-1-1.6-1 1.6-2.5-1.6L6 20.5Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </svg>
  ),
  controleestoque: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m3.5 7.5 8.5-4 8.5 4-8.5 4-8.5-4Z" />
      <path d="M3.5 7.5v9l8.5 4 8.5-4v-9M12 11.5v9" />
    </svg>
  ),
};

export default function Home() {
  const [toolAtiva, setToolAtiva] = useState<Tool | null>(null);

  useEffect(() => {
    document.title = "dentista-app";

    // Injeta as fontes do projeto (Fraunces + Manrope) sem precisar mexer no layout
    if (!document.getElementById("dentista-app-fonts")) {
      const link = document.createElement("link");
      link.id = "dentista-app-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const handleCardClick = (tool: Tool) => {
    setToolAtiva(tool);
  };

  const handleVoltar = () => {
    setToolAtiva(null);
  };

  return (
    <>
      {/* Estilos globais e estados interativos (hover/focus) que inline style não cobre */}
      <style>{`
        * { box-sizing: border-box; }
        body {
          background: ${tokens.bg};
          font-family: ${tokens.fontBody};
          color: ${tokens.ink};
          margin: 0;
        }
        .toolCard {
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        .toolCard:hover, .toolCard:focus-visible {
          transform: translateY(-3px);
          border-color: ${tokens.teal};
          box-shadow: 0 12px 24px -12px rgba(14, 124, 134, 0.35);
          outline: none;
        }
        .toolCard:hover .cardArrow, .toolCard:focus-visible .cardArrow {
          gap: 8px;
        }
        .toolCard:focus-visible {
          outline: 2px solid ${tokens.coral};
          outline-offset: 2px;
        }
        .backButton:hover { background: ${tokens.tealDeep}; }
        @media (prefers-reduced-motion: reduce) {
          .toolCard { transition: none; }
        }
      `}</style>

      {/* Header */}
      <header style={style.header}>
        <img src="/logo.png" alt="Prime Logotipo" style={style.headerLogo} />
        <div style={style.headerDivider} />
        <h1 style={style.headerTitle}>
          {toolAtiva ? toolAtiva.label : "Sorriso & Cia · Portal de Ferramentas"}
        </h1>
        {toolAtiva && (
          <button onClick={handleVoltar} style={style.backButton} className="backButton">
            ← Voltar ao Painel
          </button>
        )}
      </header>
      <div style={style.headerAccent} />

      {/* Conteúdo Dinâmico */}
      <main style={style.home}>
        {toolAtiva?.id === "confirmacaopacientes" && <ConfirmacaoPacientes />}
        {toolAtiva?.id === "calculadoraprecos" && <CalculadoraPrecos />}
        {toolAtiva?.id === "geradororcamento" && <Geradororcamento />}
        {toolAtiva?.id === "controleestoque" && <Controleestoque />}
        {toolAtiva?.id === "agenda" && <Agenda />}

        {!toolAtiva && (
          <>
            <div style={style.homeGreeting}>
              <h1 style={style.greetingTitle}>
                Olá, <span style={style.greetingName}>Usuário</span>
              </h1>
              <p style={style.homeSubtext}>Gerencie toda a clínica em um único lugar.</p>
            </div>

            <h3 style={style.homeSectionLabel}>Ferramentas Disponíveis</h3>

            <div style={style.toolsGrid}>
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  style={style.toolCard}
                  className="toolCard"
                  onClick={() => handleCardClick(tool)}
                >
                  <div style={style.cardIconWrap}>{ICONS[tool.id]}</div>
                  <div style={style.cardLabel}>{tool.label}</div>
                  <p style={style.cardDesc}>{tool.desc}</p>

                  <div style={style.cardArrow} className="cardArrow">
                    Acessar →
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      <footer style={style.footer}>
        <div style={style.footerAccentLine} />
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

// ---- Token system (paleta, tipografia) ----
const tokens = {
  bg: "#ffffcfcfcfff",
  surface: "#FFFFFF",
  ink: "#1C2A2C",
  muted: "#62757A",
  teal: "#0E7C86",
  tealDeep: "#0A5961",
  coral: "#FF6F59",
  mint: "#E6F4F1",
  line: "#E7E1D3",
  fontDisplay: "'Fraunces', Georgia, serif",
  fontBody: "'Manrope', system-ui, -apple-system, sans-serif",
};

const style = {
  header: {
    display: "flex",
    alignItems: "center",
    padding: "16px 24px",
    background: tokens.surface,
    fontFamily: tokens.fontBody,
  },
  headerAccent: {
    height: "3px",
    background: `linear-gradient(90deg, ${tokens.teal}, ${tokens.coral})`,
  },
  headerLogo: { height: "75px", width: "auto" },
  headerDivider: { width: "1px", height: "24px", background: tokens.line, margin: "0 16px" },
  headerTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: tokens.ink,
    flex: 1,
    fontFamily: tokens.fontDisplay,
  },
  backButton: {
    background: tokens.teal,
    color: "#ffffff",
    border: "none",
    padding: "9px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: tokens.fontBody,
  },

  home: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    overflowY: "auto" as const,
    padding: "40px 24px",
    background: tokens.bg,
    minHeight: "calc(100vh - 200px)",
  },
  homeGreeting: { marginBottom: "32px", position: "relative" as const },
  greetingTitle: {
    fontFamily: tokens.fontDisplay,
    fontWeight: 500,
    fontStyle: "italic" as const,
    fontSize: "32px",
    color: tokens.ink,
    margin: 0,
  },
  greetingName: { fontStyle: "normal" as const, fontWeight: 600, color: tokens.tealDeep },
  homeSubtext: { color: tokens.muted, marginTop: "8px", fontSize: "14.5px" },
  smileSvg: { marginTop: "14px" },
  homeSectionLabel: {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: ".12em",
    textTransform: "uppercase" as const,
    color: tokens.muted,
    marginBottom: "16px",
    fontFamily: tokens.fontBody,
  },
  toolsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  toolCard: {
    background: tokens.surface,
    border: `1px solid ${tokens.line}`,
    borderRadius: "18px",
    padding: "24px 20px",
    cursor: "pointer",
    textAlign: "left" as const,
    width: "100%",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    fontFamily: tokens.fontBody,
  },
  cardIconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: tokens.mint,
    color: tokens.tealDeep,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
  },
  cardLabel: { fontSize: "15px", fontWeight: 700, color: tokens.ink, marginBottom: "6px" },
  cardDesc: { fontSize: "12.5px", color: tokens.muted, lineHeight: 1.5 },
  cardArrow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "4px",
    marginTop: "18px",
    color: tokens.teal,
    fontSize: "12px",
    fontWeight: 700,
    transition: "gap .18s ease",
  },

  footer: { background: tokens.surface, padding: "24px", marginTop: "auto" },
  footerAccentLine: {
    height: "1px",
    background: `linear-gradient(90deg, transparent, ${tokens.line}, transparent)`,
    marginBottom: "20px",
  },
  footerContent: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },
  footerLogo: { height: "35px", width: "auto", opacity: 0.8 },
  footerTextGroup: { textAlign: "center" as const },
  footerText: { fontSize: "12px", color: tokens.muted, fontWeight: 500, fontFamily: tokens.fontBody },
  footerSubtext: { fontSize: "11px", color: "#a0aec0", marginTop: "2px" },
};