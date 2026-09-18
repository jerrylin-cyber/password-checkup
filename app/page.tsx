"use client";

import { useMemo, useState } from "react";

const COMMON_PASSWORDS = new Set(["123456", "12345678", "123456789", "password", "qwerty", "abc123", "111111", "000000", "admin", "letmein", "welcome", "iloveyou", "password1", "qwerty123", "1q2w3e4r", "sunshine", "dragon", "monkey"]);
type Rules = { minLength: number; uppercase: boolean; lowercase: boolean; number: boolean; special: boolean; common: boolean };
const DEFAULT_RULES: Rules = { minLength: 8, uppercase: true, lowercase: true, number: true, special: true, common: true };

export default function Home() {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [rules, setRules] = useState(DEFAULT_RULES);
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

  return (
    <main>
      <header className="site-header"><a className="brand" href="#top" aria-label="密碼健檢首頁"><span className="brand-mark">P</span><span>密碼健檢</span></a><div className="privacy-pill"><span />本機檢查 · 不保存資料</div></header>
      <section className="hero" id="top"><p className="eyebrow">PASSWORD SECURITY</p><h1>檢查你的密碼是否安全</h1><p className="lede">依照自訂規則即時檢查密碼。所有運算僅在此瀏覽器完成，內容不會傳送或保存。</p></section>
      <section className="checker" aria-label="密碼檢查器">
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
      </section>
      <section className="privacy-note"><span className="lock">⌁</span><div><strong>你的密碼不會離開這個頁面</strong><p>沒有伺服器傳輸、沒有資料庫、沒有追蹤碼。關閉分頁後，輸入內容即消失。</p></div></section>
      <footer>密碼健檢 <span>·</span> 本機即時檢查 <span>·</span> 不保存任何資料</footer>
    </main>
  );
}
