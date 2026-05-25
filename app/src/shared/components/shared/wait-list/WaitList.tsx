'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://saturnusgo-backend-production.up.railway.app';
type State = 'idle'|'loading'|'ok'|'err';

const ROLES = ['Traveler','Investor','Driver/Fleet','Hotel/Partner'] as const;
const REGIONS = ['LATAM','MENA','EU','EE/CIS'] as const;

/* ========= tone hook (SSR-safe): 'light' | 'dark' ========= */
function useTone(): 'light'|'dark' {
  const { resolvedTheme } = useTheme();
  const [tone, setTone] = useState<'light'|'dark'>('dark');

  useEffect(() => {
    // 1) next-themes, 2) html.dark, 3) prefers-color-scheme
    let t: 'light'|'dark' =
      resolvedTheme === 'light' ? 'light'
      : resolvedTheme === 'dark' ? 'dark'
      : (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'dark'
      : (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light'
      : 'dark';
    setTone(t);
  }, [resolvedTheme]);

  return tone;
}

export default function BeFirstToTrySaturnsGo(){
  const tone = useTone();

  const [state, setState] = useState<State>('idle');
  const [msg, setMsg] = useState<string>('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]>('Traveler');
  const [region, setRegion] = useState<(typeof REGIONS)[number]>('LATAM');

  const idEmail = useId();
  const idName = useId();
  const hpRef = useRef<HTMLInputElement>(null);

  const valid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && name.trim().length >= 2,
    [email, name]
  );

  useEffect(() => {
    try { const saved = localStorage.getItem('sg_waitlist_email'); if (saved) setEmail(saved); } catch {}
  }, []);

  const submitToApi = useCallback(async (payload: any) => {
    const res = await fetch(`${API_BASE}/api/get-into/waitlist`, {
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      mode: 'cors',
      credentials: 'omit',
    });
    const data = await res.json().catch(() => null as any);
    return { res, data };
  }, []);

  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    if (state === 'loading' || !valid) return;
    if (hpRef.current?.value) { setState('ok'); setMsg('Thanks!'); return; } // honeypot

    setState('loading'); setMsg('');
    try {
      const payload = { email, name, role, region };
      const { res, data } = await submitToApi(payload);

      if (res.status === 409) {
        localStorage.setItem('sg_waitlist_email', email);
        setState('ok');
        setMsg('You’re already in — we’ll ping you when it’s live.');
        return;
      }

      if (!res.ok) {
        const m = Array.isArray(data?.message) ? data.message[0] : (data?.message || `HTTP ${res.status}`);
        throw new Error(m);
      }

      localStorage.setItem('sg_waitlist_email', email);
      setState('ok');
      setMsg('You’re in — updates will land occasionally.');
    } catch (err: any) {
      setState('err');
      setMsg(err?.message || 'Something went wrong. Please try again later.');
    }
  }

  return (
    <form className="waitform" data-tone={tone} onSubmit={onSubmit} aria-describedby="wl-note">
      {/* 1 — name + email */}
      <div className="wf-row">
        <div className="wf-field">
          <input
            id={idName}
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e=>setName(e.target.value)}
            required
            minLength={2}
            autoComplete="name"
            inputMode="text"
            aria-label="Your name"
            aria-invalid={state==='err' && !valid ? 'true':'false'}
          />
        </div>

        <div className="wf-field">
          <input
            id={idEmail}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
            aria-label="Email"
            aria-invalid={state==='err' && !valid ? 'true':'false'}
          />
        </div>
      </div>

      {/* 2 — role chips */}
      <div className="wf-row">
        <div className="wf-group">
          <span className="wf-toplabel">I am</span>
          <div className="chips" role="group" aria-label="I am">
            {ROLES.map(r => (
              <button
                key={r}
                type="button"
                className={`chip ${role===r ? 'is-on':''}`}
                aria-pressed={role===r}
                onClick={()=>setRole(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* 3 — region chips */}
        <div className="wf-group">
          <span className="wf-toplabel">Region</span>
          <div className="chips" role="group" aria-label="Region">
            {REGIONS.map(reg => (
              <button
                key={reg}
                type="button"
                className={`chip ${region===reg ? 'is-on':''}`}
                aria-pressed={region===reg}
                onClick={()=>setRegion(reg)}
              >
                {reg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* honeypot — полностью невидим и вне потока */}
      <input ref={hpRef} tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" name="company" />

      {/* CTA + статус справа */}
      <div className="wf-actions">
        <button
          className={`btn btn-primary ${state==='loading'?'btn-loading':''}`}
          disabled={!valid || state==='loading'}
        >
          {state==='loading' ? 'Sending…' : 'Get early access'}
        </button>

        <div id="wl-note" className={`wf-note ${state==='err'?'err':state==='ok'?'ok':''}`} aria-live="polite">
          {msg}
        </div>
      </div>

      {/* микрокопирайт — антиспам */}
      <div className="wf-micro">
        Signal-only updates. No spam.
      </div>

      <style jsx>{`
        /* ========= DARK (default) tokens ========= */
        .waitform{
          position: relative;
          --bg: rgba(22,22,24,0.55);
          --bg-hover: rgba(28,28,32,0.62);
          --stroke: rgba(255,255,255,0.14);
          --stroke-strong: rgba(255,255,255,0.22);
          --fg: rgba(255,255,255,0.92);
          --fg-dim: rgba(255,255,255,0.72);
          --ph: rgba(255,255,255,0.45);
          --shadow-focus: 0 0 0 2px rgba(122,168,255,0.18), 0 10px 28px rgba(0,0,0,0.28);
          --radius: 22px;
          --success: #7cffb4;
          --error:   #ff8892;
          color: var(--fg);
        }

        /* ========= LIGHT overrides ========= */
        .waitform[data-tone="light"],
        :global(html.light) .waitform{
          --bg: #ffffff;
          --bg-hover: #f6f8fb;
          --stroke: rgba(2,6,23,0.12);          /* slate-900 @ 12% */
          --stroke-strong: rgba(2,6,23,0.22);
          --fg: #0f172a;                         /* slate-900 */
          --fg-dim: #475569;                     /* slate-600 */
          --ph: #94a3b8;                         /* slate-400 */
          --shadow-focus: 0 0 0 2px rgba(100,108,255,0.20), 0 12px 30px rgba(2,6,23,0.12);
        }

        .wf-row{ display:grid; gap:12px; grid-template-columns: 1fr; margin-bottom:12px; }
        @media (min-width: 740px){ .wf-row{ grid-template-columns: 1fr 1fr; } }

        .wf-group{ display:flex; flex-direction:column; gap:8px; }
        .wf-toplabel{ display:block; margin: 0 0 0 2px; font-size:13px; color: var(--fg-dim); user-select:none; }

        .wf-field{ position:relative; isolation:isolate; }
        .wf-field :is(input){
          width:100%; height:48px; padding: 14px 14px;
          border-radius: var(--radius);
          background: var(--bg);
          border: 1px solid var(--stroke);
          color: var(--fg);
          outline: none;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease, color .18s ease, filter .18s ease;
          -webkit-appearance: none; appearance: none;
        }
        .wf-field :is(input)::placeholder{ color: var(--ph); }
        .waitform[data-tone="light"] .wf-field :is(input):hover{ background: var(--bg-hover); }
        .wf-field:focus-within input{
          border-color: var(--stroke-strong);
          box-shadow: var(--shadow-focus);
          filter: saturate(1.02);
        }

        /* chips */
        .chips{ display:flex; flex-wrap:wrap; gap:8px; }
        .chip{
          all:unset; padding:8px 12px; border-radius:999px; cursor:pointer;
          background: var(--bg);
          border:1px solid var(--stroke);
          color: var(--fg-dim); font-size: 13px; user-select:none;
          transition: background .18s ease, color .18s ease, border-color .18s ease, transform .08s ease, box-shadow .18s ease;
        }
        .chip:hover{ background: var(--bg-hover); }
        .chip:active{ transform: translateY(1px); }
        .chip.is-on{
          color: var(--fg); border-color: var(--stroke-strong);
          background: color-mix(in oklab, var(--bg), #ffffff 6%);
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }

        /* CTA + статус справа */
        .wf-actions{
          display: grid;
          grid-template-columns: auto 1fr;
          column-gap: 12px;
          align-items: center;
          margin-top: 6px;
        }
        .btn{
          all:unset; display:inline-flex; align-items:center; justify-content:center;
          height:48px; padding:0 18px; min-width: 180px; border-radius: 999px; cursor:pointer; user-select:none;
        }
        .btn[disabled]{ opacity:.6; cursor:not-allowed; }
        .btn-primary{
          color:#0b0b0c;
          background: linear-gradient(180deg, #ffffff, #e8ebf2);
          box-shadow: 0 8px 20px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06) inset;
          transition: transform .08s ease, box-shadow .18s ease, filter .18s ease;
        }
        .waitform[data-tone="dark"] .btn-primary{
          background: linear-gradient(180deg, #ffffff, #dcdfe7);
          box-shadow: 0 8px 20px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.8) inset;
        }
        .btn-primary:hover{ filter: brightness(1.02); }
        .btn-primary:active{ transform: translateY(1px); }
        .btn-loading{ position:relative; color: transparent !important; }
        .btn-loading::after{
          content:''; position:absolute; inset:0; margin:auto; width:18px; height:18px; border-radius:50%;
          border:2px solid rgba(0,0,0,0.2); border-top-color: rgba(0,0,0,0.8); animation: spin .8s linear infinite;
        }
        .waitform[data-tone="dark"] .btn-loading::after{
          border-color: rgba(255,255,255,0.35); border-top-color: rgba(255,255,255,0.95);
        }
        @keyframes spin{ to { transform: rotate(360deg); } }

        .wf-note{
          min-height: 0; font-size: 13px;
          color: var(--fg-dim);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .wf-note.ok{ color: var(--success); font-weight: 600; }
        .wf-note.err{ color: var(--error); font-weight: 600; }

        .wf-micro{
          margin-top: 8px; font-size: 12.5px; color: var(--fg-dim); opacity: .95;
        }

        .hp{ position:absolute !important; left:-9999px !important; width:1px; height:1px; opacity:0; }
      `}</style>
    </form>
  );
}
