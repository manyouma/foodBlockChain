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
    </div>
  );
}

export default function App() {
  return <LangProvider><Inner /></LangProvider>;
}
