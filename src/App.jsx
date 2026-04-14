import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dice5, Sparkles, Percent, TrendingUp, Calculator, Target, Trophy, ChevronRight, CircleDollarSign, RotateCw, ShieldCheck, WandSparkles } from 'lucide-react'

const FLEX = {
  3: { perfect: 3.25, oneLoss: 1.09 },
  4: { perfect: 6, oneLoss: 1.5 },
  5: { perfect: 10, oneLoss: 2.5 },
  6: { perfect: 25, oneLoss: 2.6, twoLoss: 0.25 },
  7: { perfect: 40, oneLoss: 2.75, twoLoss: 0.5 },
  8: { perfect: 80, oneLoss: 3, twoLoss: 1 },
}

const clamp = (n, min, max) => Math.min(Math.max(n, min), max)
const pct = (p) => `${(p * 100).toFixed(2)}%`
const oddsFmt = (n) => (!Number.isFinite(n) || n === 0 ? '—' : n > 0 ? `+${Math.round(n)}` : `${Math.round(n)}`)
const amerToProb = (odds) => {
  const n = Number(odds)
  if (!Number.isFinite(n) || n === 0) return 0
  return n > 0 ? 100 / (n + 100) : Math.abs(n) / (Math.abs(n) + 100)
}
const probToAmer = (prob) => {
  const p = clamp(Number(prob), 0.0001, 0.9999)
  return p >= 0.5 ? Math.round(-(p / (1 - p)) * 100) : Math.round(((1 - p) / p) * 100)
}
const decToProb = (d) => (!Number.isFinite(Number(d)) || Number(d) <= 1 ? 0 : 1 / Number(d))
const amerToDec = (odds) => {
  const n = Number(odds)
  if (!Number.isFinite(n) || n === 0) return 0
  return n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n)
}
const cleanOdds = (v) => String(v).replace(/[^0-9+-]/g, '') || '0'
const tier = (p) => p >= .75 ? ['Heavy Favorite','tier-green'] : p >= .55 ? ['Favored','tier-cyan'] : p >= .4 ? ['Coin Flip Range','tier-gold'] : p >= .2 ? ['Longer Shot','tier-orange'] : ['Lottery Ticket','tier-red']

function exactHits(probs) {
  let dp = [1]
  probs.forEach((p) => {
    const next = new Array(dp.length + 1).fill(0)
    for (let i = 0; i < dp.length; i += 1) {
      next[i] += dp[i] * (1 - p)
      next[i + 1] += dp[i] * p
    }
    dp = next
  })
  return dp
}

const normAngle = (a) => ((a % 360) + 360) % 360
const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
const donutPath = (cx, cy, outerR, innerR, start, end) => {
  const so = polar(cx, cy, outerR, end), eo = polar(cx, cy, outerR, start)
  const si = polar(cx, cy, innerR, end), ei = polar(cx, cy, innerR, start)
  const large = end - start <= 180 ? '0' : '1'
  return [`M ${so.x} ${so.y}`,`A ${outerR} ${outerR} 0 ${large} 0 ${eo.x} ${eo.y}`,`L ${ei.x} ${ei.y}`,`A ${innerR} ${innerR} 0 ${large} 1 ${si.x} ${si.y}`,'Z'].join(' ')
}
const pinResult = (zone) => String(zone?.label || '').toUpperCase().includes('FLEX') ? 'FLEX CASH' : String(zone?.label || '').toUpperCase().includes('MISS') ? 'MISS' : 'WIN'

function Card({ children, dark = false, className = '' }) { return <div className={`card ${dark ? 'card-dark' : ''} ${className}`}>{children}</div> }
function Pill({ children, icon: Icon }) { return <div className="hero-pill">{Icon ? <Icon size={14} /> : null}{children}</div> }
function Metric({ icon: Icon, label, value, sub }) { return <div className="stat-pill"><div><div className="eyebrow">{label}</div><div className="stat-value">{value}</div>{sub ? <div className="stat-sub">{sub}</div> : null}</div><div className="stat-icon"><Icon size={20} /></div></div> }
function Progress({ value }) { return <div className="progress-track"><div className="progress-fill" style={{ width: `${clamp(value,0,100)}%` }} /></div> }
function Header({ Icon, title, text }) { return <><div className="title-row"><Icon size={22} /><h2>{title}</h2></div><p className="section-sub">{text}</p></> }

function Wheel({ zones, label }) {
  const safeZones = useMemo(() => {
    const z = zones.map((x) => ({ ...x, probability: clamp(Number(x.probability) || 0, 0, 1) })).filter((x) => x.probability > 0)
    const total = z.reduce((s, x) => s + x.probability, 0)
    if (total < 1) z.push({ label: 'MISS', probability: 1 - total, color: '#ef4444' })
    return z
  }, [zones])
  const segments = useMemo(() => { let start = 0; return safeZones.map((z) => { const seg = { ...z, start, end: start + z.probability * 360 }; start = seg.end; return seg }) }, [safeZones])
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState('')

  const spin = () => {
    if (spinning || !segments.length) return
    const roll = Math.random()
    let acc = 0
    let chosen = segments[segments.length - 1]
    for (const seg of segments) { acc += seg.probability; if (roll <= acc) { chosen = seg; break } }
    const span = Math.max(chosen.end - chosen.start, .5)
    const pad = Math.min(7, span * .12)
    const landing = chosen.start + pad + Math.random() * Math.max(chosen.end - chosen.start - pad * 2, 0)
    const nextRotation = rotation + 2160 + Math.random() * 720 - landing
    setSpinning(true); setResult(''); setRotation(nextRotation)
    window.setTimeout(() => {
      const pinAngle = 270
      const wheelAngle = normAngle(pinAngle - normAngle(nextRotation))
      const underPin = segments.find((s) => wheelAngle >= s.start && wheelAngle < s.end) || segments[segments.length - 1]
      setResult(pinResult(underPin)); setSpinning(false)
    }, 3600)
  }

  return (
    <Card>
      <div className="panel-head-row"><div><h3>{label}</h3><p>The left pin is the only deciding spot.</p></div><div className="soft-badge">{safeZones.length} Zones</div></div>
      <div className="wheel-stage">
        <div className={`wheel-aura ${spinning ? 'wheel-aura-live' : ''}`} />
        <div className="wheel-pin" />
        <motion.div animate={{ scale: spinning ? [1, 1.02, 1] : 1 }} transition={{ duration: .8, repeat: spinning ? Infinity : 0, ease: 'easeInOut' }} className="wheel-backdrop" />
        <motion.div animate={{ rotate: rotation }} transition={{ duration: 3.6, ease: [0.08, 0.82, 0.18, 1] }} className="wheel-disc">
          <svg viewBox="0 0 240 240" className="wheel-svg">
            {segments.map((seg) => <path key={`${seg.label}-${seg.start}`} d={donutPath(120,120,120,66,seg.start,seg.end)} fill={seg.color} stroke="none" />)}
            <circle cx="120" cy="120" r="117" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="6" />
          </svg>
          <div className="wheel-center"><span className="eyebrow">Fixed Pin</span><strong>Left Side</strong></div>
        </motion.div>
      </div>
      <div className="legend-list">{safeZones.map((z) => <div key={`${z.label}-${z.color}`} className="legend-row"><div className="legend-left"><span className="legend-dot" style={{ background: z.color }} /><span>{z.label}</span></div><strong>{pct(z.probability)}</strong></div>)}</div>
      <button className="primary-btn full-width top-gap" onClick={spin} disabled={spinning}><span className="inline-row"><RotateCw size={18} className={spinning ? 'spinning-icon' : ''} />{spinning ? 'Spinning' : 'Spin the Wheel'}</span></button>
      <div className={`wheel-result ${result === 'WIN' ? 'result-win' : result.includes('FLEX') ? 'result-flex' : result === 'MISS' ? 'result-miss' : ''}`}>{result ? `Pin result: ${result}` : 'Ready to spin'}</div>
    </Card>
  )
}

function SinglePanel() {
  const [mode, setMode] = useState('american')
  const [input, setInput] = useState('-145')
  const probability = useMemo(() => mode === 'american' ? amerToProb(Number(input)) : mode === 'decimal' ? decToProb(Number(input)) : clamp(Number(input) / 100, 0, 1), [mode, input])
  const [label, tierClass] = tier(probability)
  return (
    <div className="grid-two single-grid">
      <Card dark>
        <Header Icon={Calculator} title="Single Bet Probability" text="Drop in American odds, decimal odds, or a raw win rate and get the implied chance instantly." />
        <div className="auto-grid top-gap">
          <label className="field"><span>Input Type</span><select value={mode} onChange={(e) => setMode(e.target.value)}><option value="american">American Odds</option><option value="decimal">Decimal Odds</option><option value="probability">Win Probability %</option></select></label>
          <label className="field"><span>{mode === 'american' ? 'Odds' : mode === 'decimal' ? 'Decimal' : 'Probability %'}</span><input value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'american' ? '-145' : mode === 'decimal' ? '1.75' : '58'} /></label>
        </div>
        <div className="hero-metric top-gap"><div><div className="eyebrow">Implied chance</div><div className="metric-value">{pct(probability)}</div></div><div className={`tier-pill ${tierClass}`}>{label}</div></div>
        <Progress value={probability * 100} />
        <div className="auto-grid top-gap"><Metric icon={Percent} label="Fair American" value={oddsFmt(probToAmer(probability))} sub="No sportsbook juice removed" /><Metric icon={Target} label="Raw Win Rate" value={pct(probability)} sub="Your current edge baseline" /></div>
      </Card>
      <Wheel label="Single Leg Spinner" zones={[{ label: 'WIN', probability, color: '#10b981' }, { label: 'MISS', probability: 1 - probability, color: '#ef4444' }]} />
    </div>
  )
}

function ParlayPanel() {
  const [legs, setLegs] = useState([{ id: 1, name: 'Leg 1', americanOdds: '-145' }, { id: 2, name: 'Leg 2', americanOdds: '+115' }, { id: 3, name: 'Leg 3', americanOdds: '-110' }])
  const [flexMode, setFlexMode] = useState(false)
  const parsed = useMemo(() => legs.map((leg) => { const raw = Number(cleanOdds(leg.americanOdds)); return { ...leg, probability: amerToProb(raw), decimal: amerToDec(raw) } }), [legs])
  const probs = parsed.map((x) => x.probability)
  const dist = exactHits(probs)
  const parlayProb = parsed.reduce((a, x) => a * clamp(x.probability, .01, .99), 1)
  const parlayDec = parsed.reduce((a, x) => a * clamp(x.decimal, 1.01, 1000), 1)
  const [label, tierClass] = tier(parlayProb)
  const fair = probToAmer(parlayProb)
  const bust = 1 - parlayProb
  const count = legs.length
  const flex = FLEX[count] || null
  const flexAvailable = count >= 3 && count <= 8
  const oneMiss = dist[count - 1] || 0
  const twoMiss = dist[count - 2] || 0
  const flexCash = flex ? oneMiss + (flex.twoLoss ? twoMiss : 0) : 0
  const flexTotal = parlayProb + flexCash
  const wheelZones = flexMode && flex ? [{ label: 'WIN', probability: parlayProb, color: '#10b981' }, { label: 'FLEX CASH', probability: oneMiss, color: '#94a3b8' }, ...(flex.twoLoss ? [{ label: 'FLEX SAVE', probability: twoMiss, color: '#64748b' }] : []), { label: 'MISS', probability: Math.max(0, 1 - parlayProb - oneMiss - (flex.twoLoss ? twoMiss : 0)), color: '#ef4444' }] : [{ label: 'WIN', probability: parlayProb, color: '#10b981' }, { label: 'MISS', probability: 1 - parlayProb, color: '#ef4444' }]
  const updateLeg = (id, key, value) => setLegs((prev) => prev.map((leg) => leg.id === id ? { ...leg, [key]: value } : leg))

  return (
    <div className="grid-two">
      <Card dark>
        <div className="split-row">
          <Header Icon={Dice5} title="Parlay Builder" text="Enter real betting odds for each leg and let the slip calculate the true hit rate." />
          <button className={`toggle-wrap ${flexMode && flexAvailable ? 'toggle-wrap-on' : ''} ${!flexAvailable ? 'toggle-wrap-disabled' : ''}`} onClick={() => flexAvailable && setFlexMode((p) => !p)}>
            <div><div className="eyebrow">Flex Bet Mode</div><div className="toggle-sub">Protected payout structure</div></div>
            <div className="toggle-track"><div className={`toggle-knob ${flexMode && flexAvailable ? 'toggle-knob-on' : ''}`} /></div>
          </button>
        </div>
        {!flexAvailable ? <div className="helper-text">Flex mode is available for 3 to 8 legs.</div> : null}
        <div className="stack top-gap">
          <AnimatePresence>
            {legs.map((leg, index) => <motion.div key={leg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="leg-card"><div className="leg-head"><div className="leg-left"><div className="leg-num">{index + 1}</div><input className="leg-name-input" value={leg.name} onChange={(e) => updateLeg(leg.id, 'name', e.target.value)} /></div><button className="ghost-btn" onClick={() => legs.length > 2 && setLegs((prev) => prev.filter((x) => x.id !== leg.id))}>Remove</button></div><div className="leg-grid"><label className="field"><span>American Odds</span><input value={leg.americanOdds} onChange={(e) => updateLeg(leg.id, 'americanOdds', e.target.value)} placeholder="-110" /></label><div className="mini-card">{pct(amerToProb(Number(cleanOdds(leg.americanOdds))))}</div><div className="mini-card">x{amerToDec(Number(cleanOdds(leg.americanOdds))).toFixed(2)}</div></div></motion.div>)}
          </AnimatePresence>
          <button className="primary-btn full-width" onClick={() => setLegs((prev) => [...prev, { id: Date.now(), name: `Leg ${prev.length + 1}`, americanOdds: '-110' }])}>Add Another Leg</button>
        </div>
      </Card>
      <div className="stack-lg">
        <Card>
          <div className="title-row"><ShieldCheck size={22} /><h3>Slip Result</h3></div>
          <p className="section-sub">{flexMode && flex ? 'Flex mode protects part of the slip at lower payout tiers.' : 'The fun part to build. The brutal part to look at honestly.'}</p>
          <div className="hero-metric metric-gold top-gap"><div><div className="eyebrow">{flexMode && flex ? 'Flex slip cash rate' : 'Parlay hit rate'}</div><div className="metric-value">{pct(flexMode && flex ? flexTotal : parlayProb)}</div><div className="metric-sub">{flexMode && flex ? `Perfect hit: x${flex.perfect} · Flex cash zone: ${pct(flexCash)}` : `Combined decimal payout: x${parlayDec.toFixed(2)}`}</div></div><div className={`tier-pill ${tierClass}`}>{label}</div></div>
          <Progress value={(flexMode && flex ? flexTotal : parlayProb) * 100} />
          <div className="auto-grid top-gap"><Metric icon={CircleDollarSign} label={flexMode && flex ? 'Top flex payout' : 'Fair Odds'} value={flexMode && flex ? `x${flex.perfect}` : oddsFmt(fair)} sub={flexMode && flex ? 'All legs must still hit' : 'Before boost or hold'} /><Metric icon={TrendingUp} label={flexMode && flex ? 'Protected cash chance' : 'Bust Chance'} value={pct(flexMode && flex ? flexCash : bust)} sub={flexMode && flex ? 'Gray wheel zone' : 'Any single leg can ruin it'} /></div>
          {flexMode && flex ? <div className="ladder-box top-gap"><div className="eyebrow">Flex payout ladder</div><div className="ladder-row top-gap-small"><span>All {count} hit</span><strong className="accent-green">x{flex.perfect}</strong></div><div className="ladder-row"><span>Exactly 1 miss</span><strong className="accent-slate">x{flex.oneLoss}</strong></div>{flex.twoLoss ? <div className="ladder-row"><span>Exactly 2 misses</span><strong className="accent-slate">x{flex.twoLoss}</strong></div> : null}</div> : null}
          <div className="divider top-gap" />
          <div className="legend-list top-gap">{parsed.map((leg) => <div key={leg.id} className="legend-row"><div><div className="zone-title">{leg.name}</div><div className="zone-sub">{leg.americanOdds} · x{leg.decimal.toFixed(2)}</div></div><strong>{pct(leg.probability)}</strong></div>)}</div>
        </Card>
        <Wheel zones={wheelZones} label={flexMode && flex ? 'Flex Parlay Spinner' : 'Parlay Spinner'} />
      </div>
    </div>
  )
}

function SimulatorPanel() {
  const [winRate, setWinRate] = useState(55)
  const [trials, setTrials] = useState(1000)
  const [sample, setSample] = useState(null)
  const run = () => { let wins = 0; const p = winRate / 100; for (let i = 0; i < trials; i += 1) if (Math.random() < p) wins += 1; setSample({ wins, losses: trials - wins, actual: wins / trials }) }
  return (
    <div className="grid-two sim-grid">
      <Card dark>
        <Header Icon={Sparkles} title="Hit Rate Simulator" text="Test how often a leg or strategy actually cashes over a batch of simulated runs." />
        <div className="top-gap"><div className="range-head"><span>Expected win rate</span><strong>{winRate}%</strong></div><input type="range" min={1} max={99} step={1} value={winRate} onChange={(e) => setWinRate(Number(e.target.value))} className="range-input" /></div>
        <label className="field top-gap"><span>Simulation Size</span><select value={String(trials)} onChange={(e) => setTrials(Number(e.target.value))}><option value="100">100 Trials</option><option value="500">500 Trials</option><option value="1000">1,000 Trials</option><option value="5000">5,000 Trials</option></select></label>
        <button className="primary-btn full-width top-gap" onClick={run}>Run the Table</button>
      </Card>
      <Card>
        <div className="title-row"><WandSparkles size={22} /><h3>Simulation Result</h3></div><p className="section-sub">Useful for checking whether your edge still feels good over volume.</p>
        {sample ? <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="top-gap"><div className="auto-grid three-up"><Metric icon={Trophy} label="Wins" value={sample.wins} sub="Simulated cashes" /><Metric icon={ChevronRight} label="Losses" value={sample.losses} sub="Simulated misses" /><Metric icon={Percent} label="Actual Rate" value={pct(sample.actual)} sub="Observed in run" /></div><div className="summary-box top-gap">Over <strong>{trials.toLocaleString()}</strong> trials, a strategy expected to hit at <strong>{winRate}%</strong> landed at <strong>{(sample.actual * 100).toFixed(2)}%</strong> this run.</div></motion.div> : <div className="empty-box top-gap">Hit the button and the table will run a fresh simulation.</div>}
      </Card>
    </div>
  )
}

function EVPanel() {
  const [americanOdds, setAmericanOdds] = useState('-110')
  const [stake, setStake] = useState('100')
  const odds = Number(cleanOdds(americanOdds))
  const risk = Number(stake) || 0
  const implied = amerToProb(odds)
  const profit = odds > 0 ? (risk * odds) / 100 : odds < 0 ? (risk * 100) / Math.abs(odds) : 0
  const totalReturn = risk + profit
  const roi = risk > 0 ? profit / risk : 0
  return (
    <div className="grid-two sim-grid">
      <Card dark>
        <Header Icon={CircleDollarSign} title="Expected Value" text="The odds set the implied win rate automatically, then the bet shows a clean ROI based on the actual payout." />
        <div className="auto-grid top-gap"><label className="field"><span>Sportsbook Odds</span><input value={americanOdds} onChange={(e) => setAmericanOdds(e.target.value)} placeholder="-110" /></label><label className="field"><span>Stake</span><input value={stake} onChange={(e) => setStake(e.target.value)} placeholder="100" /></label></div>
        <div className="hero-metric top-gap"><div><div className="eyebrow">Implied win rate from odds</div><div className="metric-value">{pct(implied)}</div><div className="metric-sub">This is calculated directly from the line you entered.</div></div></div>
      </Card>
      <Card>
        <div className="title-row"><TrendingUp size={22} /><h3>Value Readout</h3></div><p className="section-sub">A simple payout view based on the odds, your risk, and the return if the bet cashes.</p>
        <div className="auto-grid top-gap"><Metric icon={CircleDollarSign} label="Profit if it hits" value={`$${profit.toFixed(2)}`} sub="Net winnings only" /><Metric icon={TrendingUp} label="Total return" value={`$${totalReturn.toFixed(2)}`} sub="Stake plus winnings" /></div>
        <div className="summary-box top-gap"><div className="eyebrow">ROI if it hits</div><div className="metric-value metric-good">+{(roi * 100).toFixed(2)}%</div></div>
      </Card>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('parlay')
  return (
    <div className="app-shell">
      <div className="container">
        <Card className="hero-card">
          <div className="hero-glow glow-one" /><div className="hero-glow glow-two" /><div className="hero-glow glow-three" />
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="hero-content">
            <Pill icon={Dice5}>Casino Mode Probability Lab</Pill>
            <h1>Run the odds like a sharp, not like a guesser.</h1>
            <p>A cleaner, sharper probability lab with premium visuals, live betting math, flex logic, and animated wheel tests that feel fun to use.</p>
            <div className="auto-grid hero-stats top-gap"><Metric icon={Percent} label="Fast Reads" value="Instant" sub="Implied probability" /><Metric icon={ShieldCheck} label="Flex Logic" value="Built In" sub="Protected parlay paths" /><Metric icon={Sparkles} label="Casino Feel" value="Sharper" sub="Cleaner animated interface" /></div>
          </motion.div>
        </Card>
        <div className="tab-bar">{[['parlay','Parlay Builder'],['single','Single Leg'],['simulator','Simulator'],['ev','Expected Value']].map(([value, text]) => <button key={value} className={`tab-btn ${tab === value ? 'tab-active' : ''}`} onClick={() => setTab(value)}>{text}</button>)}</div>
        <div className="top-gap-lg">{tab === 'parlay' && <ParlayPanel />}{tab === 'single' && <SinglePanel />}{tab === 'simulator' && <SimulatorPanel />}{tab === 'ev' && <EVPanel />}</div>
      </div>
    </div>
  )
}
