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
    setShipmentId(id);
    setSubmitted(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app">
      <header className="header">
        <span className="logo">🍈 {t.appName}</span>
        <span className="tagline">{t.tagline}</span>
        <div className="lang-switch">
          <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>EN</button>
          <button className={`lang-btn ${lang === "zh" ? "active" : ""}`} onClick={() => setLang("zh")}>中文</button>
        </div>
      </header>

      <main>
        <div className="search-box">
          <h2>{t.trackTitle}</h2>
          <p>{t.trackSubtitle}</p>
          <div className="search-row">
            <input
              value={shipmentId}
              onChange={e => setShipmentId(e.target.value.toUpperCase())}
              placeholder={t.trackPlaceholder}
              onKeyDown={e => e.key === "Enter" && handleSelect(shipmentId)}
            />
            <button onClick={() => handleSelect(shipmentId)}>{t.trackButton}</button>
          </div>
        </div>

        {submitted
          ? <ShipmentTracker shipmentId={submitted} onBack={() => setSubmitted("")} />
          : <RecentShipments onSelect={handleSelect} />
        }
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LangProvider><Inner /></LangProvider>
  );
}
