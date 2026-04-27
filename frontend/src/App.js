import { useState } from "react";
import { LangProvider, useLang } from "./LangContext";
import ShipmentTracker from "./ShipmentTracker";
import RecentShipments from "./RecentShipments";
import "./App.css";

function Inner() {
  const { lang, setLang, t } = useLang();
  const [shipmentId, setShipmentId] = useState("");
  const [submitted, setSubmitted] = useState("");

  function handleSelect(id) {
    setSubmitted(id);
    setShipmentId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <span className="logo">🍈 {t.appName}</span>
          <span className="tagline">{t.tagline}</span>
        </div>
        <div className="topbar-right">
          <div className="search-inline">
            <input
              value={shipmentId}
              onChange={e => setShipmentId(e.target.value.toUpperCase())}
              placeholder={t.trackPlaceholder}
              onKeyDown={e => e.key === "Enter" && handleSelect(shipmentId)}
            />
            <button onClick={() => handleSelect(shipmentId)}>{t.trackButton}</button>
          </div>
          <div className="lang-switch">
            <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>EN</button>
            <button className={`lang-btn ${lang === "zh" ? "active" : ""}`} onClick={() => setLang("zh")}>中文</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {submitted
          ? <ShipmentTracker shipmentId={submitted} onBack={() => { setSubmitted(""); setShipmentId(""); }} />
          : <RecentShipments onSelect={handleSelect} />
        }
      </main>

      <footer className="hl-footer">
        <div className="hl-footer-inner">
          <div className="hl-footer-brand">
            <img src="https://www.hyperledger.org/wp-content/uploads/2018/03/Hyperledger_Fabric_Logo_Color.png"
              alt="Hyperledger Fabric" className="hl-logo" />
            <span className="hl-powered">{t.footerPowered}</span>
          </div>
          <div className="hl-footer-cards">
            <div className="hl-card">
              <span className="hl-card-icon">🔒</span>
              <div>
                <div className="hl-card-title">{t.footerImmutable}</div>
                <div className="hl-card-body">{t.footerImmutableDesc}</div>
              </div>
            </div>
            <div className="hl-card">
              <span className="hl-card-icon">🏛️</span>
              <div>
                <div className="hl-card-title">{t.footerPermissioned}</div>
                <div className="hl-card-body">{t.footerPermissionedDesc}</div>
              </div>
            </div>
            <div className="hl-card">
              <span className="hl-card-icon">✅</span>
              <div>
                <div className="hl-card-title">{t.footerAudit}</div>
                <div className="hl-card-body">{t.footerAuditDesc}</div>
              </div>
            </div>
            <div className="hl-card">
              <span className="hl-card-icon">📡</span>
              <div>
                <div className="hl-card-title">{t.footerOffline}</div>
                <div className="hl-card-body">{t.footerOfflineDesc}</div>
              </div>
            </div>
          </div>
          <div className="hl-footer-copy">{t.footerCopy}</div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return <LangProvider><Inner /></LangProvider>;
}
