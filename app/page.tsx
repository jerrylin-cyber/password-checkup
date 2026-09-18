"use client";

import { useMemo, useState } from "react";
import { getSuggestions, type PasswordRules } from "./password-utils";

const COMMON_PASSWORDS = new Set(["123456", "12345678", "123456789", "password", "qwerty", "abc123", "111111", "000000", "admin", "letmein", "welcome", "iloveyou", "password1", "qwerty123", "1q2w3e4r", "sunshine", "dragon", "monkey"]);
type Rules = PasswordRules;
const DEFAULT_RULES: Rules = { minLength: 8, uppercase: true, lowercase: true, number: true, special: true, common: true };

export default function Home() {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [seedText, setSeedText] = useState("");
  const [copied, setCopied] = useState("");
  const checks = useMemo(() => [
    { key: "length", label: `至少 ${rules.minLength} 個字元`, active: true, pass: password.length >= rules.minLength },
    { key: "uppercase", label: "包含大寫英文字母", active: rules.uppercase, pass: /[A-Z]/.test(password) },
    { key: "lowercase", label: "包含小寫英文字母", active: rules.lowercase, pass: /[a-z]/.test(password) },
    { key: "number", label: "包含數字", active: rules.number, pass: /\d/.test(password) },
    { key: "special", label: "包含特殊符號", active: rules.special, pass: /[^A-Za-z0-9]/.test(password) },
    { key: "common", label: "不是常見密碼", active: rules.common, pass: !COMMON_PASSWORDS.has(password.toLowerCase()) },
  ], [password, rules]);
  const activeChecks = checks.filter((check) => check.active);
  const passed = activeChecks.filter((check) => check.pass).length;
  const complete = password.length > 0 && passed === activeChecks.length;
  const score = password.length ? Math.round((passed / activeChecks.length) * 100) : 0;
  const toggleRule = (key: keyof Omit<Rules, "minLength">) => setRules((current) => ({ ...current, [key]: !current[key] }));
  const suggestions = useMemo(() => seedText ? getSuggestions(seedText, rules) : null, [seedText, rules]);
  async function copySuggestion(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1400);
  }

  return (
    <main>
      <header className="site-header"><a className="brand" href="#top" aria-label="密碼健檢首頁"><span className="brand-mark">P</span><span>PASSWORD DEV TOOL</span></a><div className="privacy-pill"><span />LOCAL ONLY · NO STORAGE</div></header>
      <section className="hero" id="top"><p className="eyebrow">PASSWORD DEV TOOL</p><div className="hero-grid"><h1><span>密碼安全</span><em>檢查器</em></h1><p className="lede">長度、字元規則與常見密碼，一頁完成即時檢查。所有運算只在瀏覽器中執行。</p></div></section>
      <section className="checker-wrap">
        <div className="tool-heading"><span className="section-number">01</span><div><h2>密碼強度檢查</h2><p>依照右側規則，即時判斷密碼是否符合條件</p></div></div>
        <div className="checker" aria-label="密碼檢查器">
        <div className="input-panel">
          <label htmlFor="password">輸入要檢查的密碼</label>
          <div className="password-field"><input id="password" type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="在這裡輸入密碼" autoComplete="off" spellCheck={false} /><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "隱藏密碼" : "顯示密碼"}>{visible ? "隱藏" : "顯示"}</button></div>
          <div className="strength-head"><span>安全強度</span><strong className={complete ? "good" : score >= 60 ? "medium" : "weak"}>{!password ? "等待輸入" : complete ? "符合設定" : score >= 60 ? "還差一點" : "需要加強"}</strong></div>
          <div className="meter" aria-label={`安全強度 ${score}%`}><span style={{ width: `${score}%` }} /></div>
          <ul className="check-list" aria-live="polite">{activeChecks.map((check) => <li key={check.key} className={password && check.pass ? "pass" : ""}><span className="check-icon">{password && check.pass ? "✓" : "·"}</span>{check.label}</li>)}</ul>
        </div>
        <aside className="settings-panel">
          <div className="settings-title"><div><p>檢查設定</p><span>依需求調整密碼規則</span></div><button type="button" onClick={() => setRules(DEFAULT_RULES)}>恢復預設</button></div>
          <div className="length-setting"><label htmlFor="length">最少字元數 <strong>{rules.minLength}</strong></label><input id="length" type="range" min="6" max="20" value={rules.minLength} onChange={(event) => setRules((current) => ({ ...current, minLength: Number(event.target.value) }))} /><div><span>6</span><span>20</span></div></div>
          <div className="toggles">{([ ["uppercase", "大寫英文", "至少一個 A–Z"], ["lowercase", "小寫英文", "至少一個 a–z"], ["number", "數字", "至少一個 0–9"], ["special", "特殊符號", "例如 ! @ # $ %"], ["common", "常見密碼檢查", "排除高風險密碼"] ] as const).map(([key, title, hint]) => <label className="toggle-row" key={key}><span><strong>{title}</strong><small>{hint}</small></span><input type="checkbox" checked={rules[key]} onChange={() => toggleRule(key)} /><i aria-hidden="true" /></label>)}</div>
        </aside>
        </div>
      </section>
      <section className="checker-wrap suggestion-wrap">
        <div className="tool-heading"><span className="section-number suggestion-number">02</span><div><h2>密碼建議</h2><p>以輸入文字產生可重現、符合「01 檢查設定」的密碼</p></div></div>
        <div className="suggestion-panel">
          <label htmlFor="seed-text">輸入一段容易記住的文字</label>
          <textarea id="seed-text" value={seedText} onChange={(event) => setSeedText(event.target.value)} placeholder="例如：每週五下班吃火鍋" rows={3} spellCheck={false} />
          <p className="local-hint">文字只在這個頁面處理，不會傳送或保存。</p>
          {suggestions ? <div className="suggestion-results" aria-live="polite">
            {([
              ["鍵盤轉換", suggestions.keyboard, "中文轉注音按鍵；英文重排；其他字元固定對應"],
              ["MD5 大寫", suggestions.md5Upper, "輸入內容的 MD5，全大寫"],
              ["MD5 小寫", suggestions.md5Lower, "輸入內容的 MD5，全小寫"],
              ["固定規則", suggestions.fixed, "以 MD5 為來源，符合目前 01 設定"],
              ["Seed 隨機", suggestions.seeded, "以輸入內容為 seed，符合目前 01 設定"],
            ] as const).map(([label, value, description]) => <article className="suggestion-result" key={label}><div><span>{label}</span><small>{description}</small></div><code>{value}</code><button type="button" onClick={() => copySuggestion(label, value)}>{copied === label ? "已複製" : "複製"}</button></article>)}
          </div> : <div className="suggestion-empty">輸入文字後，建議結果會顯示在這裡。</div>}
        </div>
      </section>
      <section className="privacy-note"><span className="lock">⌁</span><div><strong>你的密碼不會離開這個頁面</strong><p>沒有伺服器傳輸、沒有資料庫、沒有追蹤碼。關閉分頁後，輸入內容即消失。</p></div></section>
      <footer>密碼健檢 <span>·</span> 本機即時檢查 <span>·</span> 不保存任何資料</footer>
    </main>
  );
}
