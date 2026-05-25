// app/topup-crypto/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';

/* ======================================
   TYPES / CONFIG
   ====================================== */
type Asset = 'USDT' | 'BTC' | 'ETH' | 'WER';
type NetId = 'bitcoin' | 'ethereum-erc20' | 'tron-trc20' | 'bsc-bep20' | 'wer-20';

const DECIMALS: Record<Asset, number> = { USDT: 2, BTC: 8, ETH: 6, WER: 6 };
const FALLBACK_PRICES_USD = { BTC: 64000, ETH: 3200, USDT: 1, WER: 1 };

const ADDR = {
  BTC: process.env.NEXT_PUBLIC_DEP_ADDR_BTC || 'bc1q_your_btc_deposit_addr',
  ETH: process.env.NEXT_PUBLIC_DEP_ADDR_ETH || '0x_your_eth_deposit_addr',
  USDT_ERC20: process.env.NEXT_PUBLIC_DEP_ADDR_USDT_ERC20 || '0x_your_usdt_erc20_addr',
  USDT_TRC20: process.env.NEXT_PUBLIC_DEP_ADDR_USDT_TRC20 || 'T_your_usdt_trc20_addr',
  USDT_BEP20: process.env.NEXT_PUBLIC_DEP_ADDR_USDT_BEP20 || '0x_your_usdt_bep20_addr',
  WER20: process.env.NEXT_PUBLIC_DEP_ADDR_WER20 || 'WER1_your_wer20_addr',
};

const CRYPTO_TOPUP_BASE =
  process.env.NEXT_PUBLIC_CRYPTO_TOPUP_BASE ||
  'https://saturnusgo-backend-production.up.railway.app/api/crypto-topup/crypto-topup';

const USDT_CONTRACT_ETH = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

/* ======================================
   HELPERS / UTILS
   ====================================== */
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const neatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
const fmtCrypto = (n: number, a: Asset) => n.toFixed(DECIMALS[a]).replace(/\.?0+$/, '');
const sanitize16 = (s: string) => s.replace(/\D/g, '').slice(0, 16);
const group16 = (s: string) => s.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

function parseLocaleNumber(s: string): number {
  if (!s) return 0;
  const t = s.replace(/\s/g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const parts = t.split('.');
  if (parts.length > 2) return Number(parts[0] + '.' + parts.slice(1).join('')) || 0;
  return Number(t) || 0;
}
function smartFmtFiat(n: number): string {
  const v = Math.max(0, n);
  const s = v.toFixed(2);
  return s.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}
function smartFmt(n: number, asset: Asset): string {
  const s = clamp(n, 0, 1e30).toFixed(DECIMALS[asset]);
  return s.replace(/\.?0+$/, '');
}

/* ---------- SHA-256 (secure or JS fallback) ---------- */
function sha256Js(ascii: string): string {
  const rightRotate = (v: number, a: number) => (v >>> a) | (v << (32 - a));
  const maxWord = 2 ** 32;
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash: number[] = (sha256Js as any).h || [];
  const k: number[] = (sha256Js as any).k || [];
  (sha256Js as any).h = hash;
  (sha256Js as any).k = k;
  if (!k.length) {
    const isComposite: Record<number, boolean> = {};
    for (let candidate = 2, i = 0; i < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (let j = 0; j < 313; j += candidate) isComposite[j] = true;
        hash[i] = ((candidate ** 0.5) * maxWord) | 0;
        k[i++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
  }
  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] = (words[i >> 2] || 0) | (j << ((3 - (i % 4)) * 8));
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;
  let w = new Array<number>(64);
  let a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number;
  for (let j = 0; j < words.length; ) {
    a = hash[0]; b = hash[1]; c = hash[2]; d = hash[3];
    e = hash[4]; f = hash[5]; g = hash[6]; h = hash[7];
    for (let i = 0; i < 64; i++) {
      w[i] =
        i < 16
          ? words[j + i] | 0
          : (w[i - 16] +
              (rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3)) +
              w[i - 7] +
              (rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10))) | 0;
      const t1 =
        (h +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & f) ^ (~e & g)) +
          k[i] +
          w[i]) |
        0;
      const t2 =
        ((rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & b) ^ (a & c) ^ (b & c))) |
        0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
    j += 16;
  }
  let out = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      out += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return out;
}
async function sha256Hex(s: string): Promise<string> {
  const wcrypto: Crypto | undefined = (globalThis as any)?.crypto;
  const isSecure = (globalThis as any)?.isSecureContext;
  if (wcrypto?.subtle && isSecure) {
    const enc = new TextEncoder().encode(s);
    const buf = await wcrypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  return sha256Js(s);
}

/* ---------- Deep links ---------- */
function buildDeepLink(p: { asset: Asset; net: NetId; address: string | null; usd: number; priceUSD: number }) {
  const { asset, net, address, usd, priceUSD } = p;
  if (!address) return null;
  const amount = priceUSD > 0 ? usd / priceUSD : 0;

  if (asset === 'BTC' && net === 'bitcoin') {
    return `bitcoin:${address}${amount ? `?amount=${fmtCrypto(amount, 'BTC')}` : ''}`;
  }
  if (asset === 'ETH' && net === 'ethereum-erc20') {
    const wei = BigInt(Math.floor(amount * 1e18));
    return `ethereum:pay-${address}@1${amount ? `?value=${wei.toString()}` : ''}`;
  }
  if (asset === 'USDT' && net === 'ethereum-erc20') {
    const amt = BigInt(Math.floor(amount * 1e6));
    return `ethereum:${USDT_CONTRACT_ETH}@1/transfer?address=${address}${amount ? `&uint256=${amt.toString()}` : ''}`;
  }
  return null; // нет универсального диплинка для TRC20/BEP20/WER
}

/* ---------- Deposit address map ---------- */
function resolveDepositAddress(asset: Asset, net: NetId): string | null {
  if (asset === 'BTC' && net === 'bitcoin') return ADDR.BTC;
  if (asset === 'ETH' && net === 'ethereum-erc20') return ADDR.ETH;
  if (asset === 'USDT') {
    if (net === 'ethereum-erc20') return ADDR.USDT_ERC20;
    if (net === 'tron-trc20') return ADDR.USDT_TRC20;
    if (net === 'bsc-bep20') return ADDR.USDT_BEP20;
  }
  if (asset === 'WER' && net === 'wer-20') return ADDR.WER20;
  return null;
}

/* ======================================
   API TYPES
   ====================================== */
type OptionsResponse = { assets: { asset: Asset; nets: NetId[] }[] };

/* ======================================
   PAGE
   ====================================== */
export default function CryptoTopUp() {
  // FSM: 1) Card → Verify → 2) Amount/Network → 3) Address/Summary → 4) Exchanging/Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 — Card
  const [card, setCard] = useState('');
  const [cardOk, setCardOk] = useState<boolean | null>(null);
  const [verr, setVerr] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [intentId, setIntentId] = useState<string>('');
  const [signature, setSignature] = useState<string>('');

  // Step 2 — Options
  const [options, setOptions] = useState<OptionsResponse['assets']>([]);
  const [asset, setAsset] = useState<Asset>('USDT');
  const [net, setNet] = useState<NetId>('ethereum-erc20');

  // Prices
  const [prices, setPrices] = useState({ ...FALLBACK_PRICES_USD });

  // Amount fields
  type ActiveField = 'crypto' | 'fiat';
  const [activeField, setActiveField] = useState<ActiveField>('fiat');
  const [fiatStr, setFiatStr] = useState<string>('1500');
  const [cryptoStr, setCryptoStr] = useState<string>('');

  // Step 3/4 — Confirm
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmOk, setConfirmOk] = useState<null | { amount: number; currency: string }>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  // Copy
  const [copied, setCopied] = useState<string | null>(null);

  // Derived
  const price = prices[asset];
  const usd = useMemo(() => parseLocaleNumber(fiatStr), [fiatStr]);
  const amountCrypto = useMemo(() => (price > 0 ? clamp(usd / price, 0, 1e16) : 0), [usd, price]);
  const address = useMemo(() => resolveDepositAddress(asset, net), [asset, net]);
  const deepLink = useMemo(
    () => buildDeepLink({ asset, net, address, usd, priceUSD: price }),
    [asset, net, address, usd, price]
  );

  const availableNets: NetId[] = useMemo(() => {
    const fromBackend = options.find((o) => o.asset === asset)?.nets;
    if (fromBackend?.length) return fromBackend;
    if (asset === 'BTC') return ['bitcoin'];
    if (asset === 'ETH') return ['ethereum-erc20'];
    if (asset === 'USDT') return ['ethereum-erc20', 'tron-trc20', 'bsc-bep20'];
    if (asset === 'WER') return ['wer-20'];
    return ['ethereum-erc20'];
  }, [asset, options]);

  // Keep cryptoStr in sync (when editing FIAT)
  useEffect(() => {
    if (activeField === 'fiat') setCryptoStr(smartFmt(amountCrypto, asset));
  }, [usd, price, asset, activeField]); // eslint-disable-line

  // If editing CRYPTO → update FIAT
  useEffect(() => {
    if (activeField !== 'crypto') return;
    const v = parseLocaleNumber(cryptoStr);
    const f = price > 0 ? v * price : 0;
    setFiatStr(smartFmtFiat(f));
  }, [cryptoStr, price, asset, activeField]);

  // Live prices (без анимаций)
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const r = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd',
          { cache: 'no-store' }
        );
        const j = await r.json();
        if (stop) return;
        setPrices({
          BTC: j?.bitcoin?.usd ?? FALLBACK_PRICES_USD.BTC,
          ETH: j?.ethereum?.usd ?? FALLBACK_PRICES_USD.ETH,
          USDT: j?.tether?.usd ?? FALLBACK_PRICES_USD.USDT,
          WER: FALLBACK_PRICES_USD.WER,
        });
      } catch {}
    })();
    return () => { stop = true; };
  }, []);

  /* ---------- API ---------- */
  async function getPreauthToken(cardHash: string): Promise<string> {
    const res = await fetch(`${CRYPTO_TOPUP_BASE}/preauth`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cardHash }),
    });
    if (!res.ok) throw new Error(`Preauth failed: ${await res.text()}`);
    const j = await res.json();
    return j.token as string;
  }

  async function apiPost<T>(path: string, body: any, headers: Record<string, string> = {}): Promise<T> {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { msg = (await res.text()) || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  }

  async function verifyAndLoadOptions() {
    setVerr(null);
    setCardOk(null);
    setOptions([]);
    setConfirmOk(null);
    setConfirmErr(null);
    setVerifyLoading(true);
    try {
      const digits = sanitize16(card);
      if (digits.length !== 16) throw new Error('Card number must be exactly 16 digits.');
      const cardHash = await sha256Hex(digits);
      const preauth = await getPreauthToken(cardHash);

      // Local intent + signature
      const now = Date.now();
      const nonce = Math.random().toString(36).slice(2);
      const id = await sha256Hex(`${digits}:${now}:${nonce}`);
      const sig = await sha256Hex(`${id}:sg-intent-salt`);
      setIntentId(id);
      setSignature(sig);

      // Backend options
      const data = await apiPost<OptionsResponse>(
        `${CRYPTO_TOPUP_BASE}/options`,
        { cardNumber: digits },
        { 'x-preauth': preauth }
      );

      const firstAsset = (data.assets[0]?.asset ?? 'USDT') as Asset;
      const firstNet =
        (data.assets.find((a) => a.asset === firstAsset)?.nets[0] as NetId) ||
        (firstAsset === 'BTC' ? 'bitcoin' : 'ethereum-erc20');

      setOptions(data.assets);
      setAsset(firstAsset);
      setNet(firstNet);

      const initCrypto = price > 0 ? clamp(parseLocaleNumber(fiatStr) / prices[firstAsset], 0, 1e16) : 0;
      setCryptoStr(smartFmt(initCrypto, firstAsset));

      setCardOk(true);
      setStep(2);
    } catch (e: any) {
      setVerr(e?.message || 'Verification failed');
      setCardOk(false);
    } finally {
      setVerifyLoading(false);
    }
  }

  async function confirmTopup() {
    setConfirmErr(null);
    setConfirmOk(null);
    setConfirmLoading(true);
    try {
      const digits = sanitize16(card);
      if (digits.length !== 16) throw new Error('Card number must be exactly 16 digits.');
      const usdAmount = parseLocaleNumber(fiatStr);
      if (!(usdAmount > 0)) throw new Error('Amount must be > 0');
      const cardHash = await sha256Hex(digits);
      const preauth = await getPreauthToken(cardHash);

      const data = await apiPost<{ success: boolean; amount: number; currency: string; txId?: string }>(
        `${CRYPTO_TOPUP_BASE}/confirm`,
        { cardNumber: digits, asset, net, usd: usdAmount, intentId, signature },
        { 'x-preauth': preauth }
      );

      if (!data?.success) throw new Error('Confirm failed');
      setTxId(data.txId || (await sha256Hex(`${intentId}:${Date.now()}`)).slice(0, 16));
      setConfirmOk({ amount: data.amount, currency: data.currency });
    } catch (e: any) {
      setConfirmErr(e?.message || 'Confirm failed');
    } finally {
      setConfirmLoading(false);
    }
  }

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 1400);
    } catch {}
  };

  /* ---------- Keypad handlers ---------- */
  function onPadTap(key: string) {
    const target = activeField === 'fiat' ? fiatStr : cryptoStr;
    if (key === '←') {
      const next = target.slice(0, -1);
      activeField === 'fiat' ? setFiatStr(next) : setCryptoStr(next);
      return;
    }
    if (key === ',' || key === '.') {
      if (target.includes('.') || target.includes(',')) return;
      const next = target.length ? `${target},` : '0,';
      activeField === 'fiat' ? setFiatStr(next) : setCryptoStr(next);
      return;
    }
    const next = (target + key).replace(/[^\d.,]/g, '');
    if (next.length > 18) return;
    activeField === 'fiat' ? setFiatStr(next) : setCryptoStr(next);
  }

  /* ---------- UI computed ---------- */
  const progressPct = ((step - 1) / 3) * 100;
  const feeUSD = Math.max(0, parseLocaleNumber(fiatStr) * 0.03);
  const feeCrypto = price > 0 ? feeUSD / price : 0;

  /* ---------- RENDER ---------- */
  return (
    <main className="topup">
      <div className="screen">
        {/* Header */}
        <div className="header">
          <div className="title">Card top-up</div>
          <div className="limit">Card load limit&nbsp; <b>$ 5 000</b></div>
        </div>

        {/* Step indicator */}
        <div className="steps">
          <div className={`dot ${step >= 1 ? 'on' : ''}`} />
          <div className={`dot ${step >= 2 ? 'on' : ''}`} />
          <div className={`dot ${step >= 3 ? 'on' : ''}`} />
          <div className={`dot ${step >= 4 ? 'on' : ''}`} />
          <div className="bar">
            <div className="barFill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <section className="cardView">
            <div className="label">Enter card number</div>
            <input
              className="cardInput"
              inputMode="numeric"
              value={group16(card)}
              onChange={(e) => setCard(e.target.value)}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
            />
            {verr && <div className="err">{verr}</div>}
            {cardOk === true && (
              <div className="ok"><Check size={16} /> Card verified</div>
            )}
            <button
              className="btnPrimary"
              onClick={verifyAndLoadOptions}
              disabled={verifyLoading}
            >
              {verifyLoading ? 'Verifying…' : 'Verify'}
            </button>
          </section>
        )}

        {/* STEP 2 — AMOUNT / NETWORK */}
        {step === 2 && (
          <section>
            {/* Top up amount */}
            <div className="box">
              <div className="boxRow">
                <div className="boxLabel">Top up amount</div>
                <div className="badgeSelect">
                  <select
                    value={asset}
                    onChange={(e) => {
                      const a = e.target.value as Asset;
                      setAsset(a);
                      setNet(a === 'BTC' ? 'bitcoin' : a === 'WER' ? 'wer-20' : 'ethereum-erc20');
                      setActiveField('fiat');
                    }}
                  >
                    {(['USDT', 'BTC', 'ETH', 'WER'] as Asset[]).map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="amountRow">
                <button
                  className={`toggle ${activeField === 'crypto' ? 'on' : ''}`}
                  onClick={() => setActiveField('crypto')}
                >
                  {asset}
                </button>
                <div className="amount">{cryptoStr || '0'}</div>
              </div>
            </div>

            {/* You send */}
            <div className="box">
              <div className="boxRow">
                <div className="boxLabel">You send</div>
                <div className="badge">USD</div>
              </div>
              <div className="amountRow">
                <button
                  className={`toggle ${activeField === 'fiat' ? 'on' : ''}`}
                  onClick={() => setActiveField('fiat')}
                >
                  USD
                </button>
                <div className="amount">{fiatStr || '0'}</div>
              </div>
            </div>

            {/* Rate / Fee */}
            <div className="kv">
              <div>
                <div className="kvTitle">Estimated rate</div>
                <div className="kvSub">We will pick the best rate at the moment we receive funds from you</div>
              </div>
              <div className="kvVal">1 {asset} ≈ {neatUSD(price || 0)}</div>
            </div>

            <div className="kv">
              <div>
                <div className="kvTitle">Service fee 3%</div>
                <div className="kvSub">All commission are included in the amount you pay</div>
              </div>
              <div className="kvVal">
                {fmtCrypto(feeCrypto, asset)} {asset}
                <div className="kvSubRight">({neatUSD(feeUSD)})</div>
              </div>
            </div>

            {/* Network */}
            <div className="kv">
              <div className="kvTitle">Network</div>
              <div className="badgeSelect">
                <select value={net} onChange={(e) => setNet(e.target.value as NetId)}>
                  {availableNets.map((n) => (
                    <option key={n} value={n}>
                      {n === 'bitcoin' ? 'Bitcoin' :
                       n === 'ethereum-erc20' ? 'Ethereum • ERC-20' :
                       n === 'tron-trc20' ? 'TRON • TRC-20' :
                       n === 'bsc-bep20' ? 'BSC • BEP-20' : 'WER-20'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button className="btnPrimary" onClick={() => setStep(3)}>Continue →</button>

            {/* keypad */}
            <div className="pad">
              {['1','2','3','4','5','6','7','8','9',',','0','←'].map(k => (
                <button key={k} className="padKey" onClick={() => onPadTap(k)}>{k}</button>
              ))}
            </div>
          </section>
        )}

        {/* STEP 3 — ADDRESS / SUMMARY */}
        {step === 3 && (
          <section>
            <div className="kvTop">
              <div className="kvTitle">Send</div>
              <div className="valBig">{fmtCrypto(amountCrypto, asset)} {asset}</div>
            </div>

            <div className="box">
              <div className="boxRow">
                <div className="boxLabel">To this address</div>
              </div>
              <div className="addrRow">
                <div className="addr">{address || '-'}</div>
                <button className="btnGhost" onClick={() => address && handleCopy(address, 'address')}>
                  <Copy size={16} />&nbsp; Tap for copy
                </button>
              </div>
            </div>

            <div className="kvTop">
              <div className="kvTitle">You will get</div>
              <div className="valBig">{neatUSD(usd)}</div>
            </div>

            <div className="summary">
              <div className="sumTitle">Order summary:</div>
              <div className="sumRow">
                <div className="sumKey">Fee 3% included</div>
                <div className="sumVal">{fmtCrypto(feeCrypto, asset)} {asset}</div>
              </div>
              <div className="sumRow">
                <div className="sumKey">Rate updates in</div>
                <div className="sumVal">{neatUSD(price || 0)}</div>
              </div>
              <div className="sumRow">
                <div className="sumKey">Blockchain fee included</div>
                <div className="sumVal">0 {asset === 'BTC' ? 'BTC' : asset}</div>
              </div>
              <div className="sumRow">
                <div className="sumKey">Arrival time</div>
                <div className="sumVal">~ 15 min</div>
              </div>
            </div>

            <button
              className="btnPrimary"
              onClick={() => { setStep(4); void confirmTopup(); }}
            >
              Payment sent
            </button>

            {copied && <div className="copied">Copied {copied}</div>}
          </section>
        )}

        {/* STEP 4 — EXCHANGING / SUCCESS */}
        {step === 4 && (
          <section>
            {!confirmOk && !confirmErr && (
              <>
                <div className="stage">2. Exchanging</div>
                <div className="sumRow mt8">
                  <div className="sumKey">You will get</div>
                  <div className="sumVal">{neatUSD(usd)}</div>
                </div>
                <div className="summary">
                  <div className="sumRow">
                    <div className="sumKey">Fee 3% included</div>
                    <div className="sumVal">{fmtCrypto(feeCrypto, asset)} {asset}</div>
                  </div>
                  <div className="sumRow">
                    <div className="sumKey">Rate updates in</div>
                    <div className="sumVal">{neatUSD(price || 0)}</div>
                  </div>
                  <div className="sumRow">
                    <div className="sumKey">Blockchain fee included</div>
                    <div className="sumVal">0 {asset === 'BTC' ? 'BTC' : asset}</div>
                  </div>
                  <div className="sumRow">
                    <div className="sumKey">Arrival time</div>
                    <div className="sumVal">~ 15 min</div>
                  </div>
                </div>
                {txId && (
                  <div className="box">
                    <div className="boxLabel">Transaction ID</div>
                    <div className="addrRow">
                      <div className="addr">{txId}</div>
                      <button className="btnGhost" onClick={() => handleCopy(txId, 'tx')}>
                        <Copy size={16} />&nbsp; Copy
                      </button>
                    </div>
                  </div>
                )}
                <div className="loaderBar"><div className="loaderFill" /></div>
              </>
            )}

            {confirmErr && <div className="err">{confirmErr}</div>}

            {confirmOk && (
              <>
                <div className="success"><Check size={18} /> Success</div>
                <div className="okText">
                  Funds credited: <b>{neatUSD(confirmOk.amount)} {confirmOk.currency}</b>
                </div>
                {txId && (
                  <div className="box">
                    <div className="boxLabel">Transaction ID</div>
                    <div className="addrRow">
                      <div className="addr">{txId}</div>
                      <button className="btnGhost" onClick={() => handleCopy(txId, 'tx')}>
                        <Copy size={16} />&nbsp; Copy
                      </button>
                    </div>
                  </div>
                )}
                <button
                  className="btnPrimary"
                  onClick={() => {
                    setStep(1);
                    setCard('');
                    setConfirmOk(null);
                    setTxId(null);
                  }}
                >
                  Done
                </button>
              </>
            )}
          </section>
        )}
      </div>

      {/* ======= INLINE STYLES (no animations) ======= */}
      <style jsx>{`
        .topup {
          min-height: 100dvh;
          background: #0b0b0f;
          color: #fff;
          display: flex;
          justify-content: center;
          padding: 16px;
        }
        .screen {
          width: 100%;
          max-width: 420px;
        }
        .header .title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.2px;
          margin-bottom: 4px;
        }
        .header .limit {
          color: #a3a3a3;
          font-size: 12px;
          margin-bottom: 14px;
        }
        .steps {
          position: relative;
          height: 18px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .steps .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #2a2a2f;
        }
        .steps .dot.on { background: #19d07e; }
        .steps .bar {
          position: absolute; left: 0; right: 0; top: 8px;
          height: 2px; background: #1a1a1e;
        }
        .steps .barFill {
          height: 100%; background: #19d07e;
        }

        section { padding-top: 6px; }

        .label { color: #a3a3a3; font-size: 13px; margin: 8px 2px; }
        .cardInput {
          width: 100%;
          background: #121217;
          color: #fff;
          border: 1px solid #1e1e23;
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 18px;
          letter-spacing: 1.2px;
          outline: none;
        }

        .btnPrimary {
          width: 100%;
          height: 48px;
          background: #19d07e;
          color: #0b0b0f;
          font-weight: 700;
          border: none;
          border-radius: 12px;
          margin-top: 14px;
        }
        .btnPrimary:disabled { opacity: 0.6; }

        .btnGhost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 36px;
          padding: 0 10px;
          background: #1b1b20;
          color: #eaeaea;
          border: 1px solid #2a2a30;
          border-radius: 10px;
        }

        .box {
          background: #121217;
          border: 1px solid #1e1e23;
          border-radius: 12px;
          padding: 12px;
          margin: 10px 0;
        }
        .boxRow {
          display: flex; align-items: center; justify-content: space-between;
        }
        .boxLabel { color: #a3a3a3; font-size: 13px; }
        .badge {
          background: #1b1b20; color: #eaeaea; font-size: 12px;
          border: 1px solid #2a2a30; border-radius: 8px; padding: 6px 10px;
        }
        .badgeSelect select {
          background: #1b1b20; color: #eaeaea;
          border: 1px solid #2a2a30; border-radius: 8px;
          height: 32px; padding: 0 8px; font-size: 12px;
          outline: none;
        }

        .amountRow {
          margin-top: 8px;
          display: flex; align-items: flex-end; gap: 10px;
        }
        .toggle {
          height: 38px; min-width: 78px;
          background: #1b1b20; color: #eaeaea;
          border: 1px solid #2a2a30; border-radius: 10px;
          font-weight: 600;
        }
        .toggle.on { background: #19d07e; color: #0b0b0f; border-color: #19d07e; }
        .amount {
          font-size: 36px; font-weight: 700; letter-spacing: 0.2px;
        }

        .kv {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding: 8px 2px;
        }
        .kvTitle { font-weight: 600; font-size: 14px; }
        .kvSub { color: #8f8f94; font-size: 12px; max-width: 65vw; }
        .kvVal { font-weight: 700; font-size: 14px; text-align: right; }
        .kvSubRight { color: #8f8f94; font-size: 12px; }

        .pad {
          margin-top: 12px;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        }
        .padKey {
          height: 56px; font-size: 22px; font-weight: 700; color: #fff;
          background: #121217; border: 1px solid #1e1e23; border-radius: 12px;
        }

        .kvTop { margin: 8px 2px; }
        .valBig { font-size: 28px; font-weight: 700; margin-top: 6px; }

        .addrRow { margin-top: 8px; display: flex; gap: 8px; align-items: center; }
        .addr {
          flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          background: #0f0f14; border: 1px solid #1e1e23; border-radius: 10px; padding: 10px 12px; font-size: 13px;
        }

        .summary {
          margin: 12px 2px 10px;
          background: #121217; border: 1px solid #1e1e23; border-radius: 12px; padding: 10px 12px;
        }
        .sumTitle { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
        .sumRow {
          display: flex; align-items: center; justify-content: space-between;
          padding: 6px 0;
        }
        .sumKey { color: #a3a3a3; font-size: 13px; }
        .sumVal { font-weight: 700; font-size: 13px; }

        .stage { font-weight: 700; margin: 4px 2px 8px; }
        .mt8 { margin-top: 8px; }

        .loaderBar { height: 6px; background: #1a1a1e; border-radius: 999px; overflow: hidden; margin-top: 12px; }
        .loaderFill { width: 90%; height: 100%; background: #19d07e; } /* статично, без анимации */

        .copied { margin-top: 8px; font-size: 12px; color: #19d07e; }
        .err { color: #ff6b6b; font-size: 13px; margin-top: 6px; }
        .ok { color: #19d07e; font-size: 13px; margin-top: 6px; display: inline-flex; gap: 6px; align-items: center; }
        .success {
          display: inline-flex; gap: 8px; align-items: center;
          background: #10281d; color: #19d07e; border: 1px solid #1f4535;
          border-radius: 10px; padding: 8px 10px; font-weight: 700; margin: 6px 2px 8px;
        }
        .okText { margin: 6px 2px 10px; }
      `}</style>
    </main>
  );
}
