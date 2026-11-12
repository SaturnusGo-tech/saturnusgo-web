import React from 'react';
import {
  ArrowLeft, ArrowUpRight, Ban, Bot, Check, ChevronDown, Clock3,
  Coins, GitBranch, PencilLine, Search, ShieldCheck, Workflow, Zap,
} from 'lucide-react';
import './detail-scenes.css';
import {chartGeometry} from './chart-geometry.js';
import {TrendWave} from './chart-elements.jsx';
import {Connector} from './connector.jsx';

const clamp = (v) => Math.min(1, Math.max(0, v));
const appear = (time, at = 0, distance = 10) => {
  const p = clamp((time - at) / 0.38);
  const eased = 1 - Math.pow(1 - p, 3);
  return { opacity: eased, transform: `translateY(${(1 - eased) * distance}px)` };
};

function SceneHeading({ eyebrow, title, subtitle, children, time }) {
  return <>
    <button className="ag-back" aria-label="Go back" style={appear(time, 0.02, 4)}><ArrowLeft size={24} strokeWidth={1.5} /></button>
    <header className="ag-scene-heading" style={appear(time, 0.02, 6)}>
      <div className="ag-eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
    <div className="ag-heading-controls" style={appear(time, 0.08, 5)}>{children}</div>
  </>;
}

const access = ['Test cases', 'API contract', 'Test docs', 'Run history', 'Evidence'];
const tools = ['API Testing', 'Falcon Repository', 'Product Docs', 'Attachments', 'Linear'];
const actions = [
  ['Inspect coverage', 'Approved'], ['Revise cases', 'Approved'],
  ['Send sandbox requests', 'Approved'], ['Retain evidence', 'Approved'],
  ['File defect', 'Approval'], ['Delete project', 'Blocked'],
];

function AccessPanel({ title, rows, className = '', time, at = 0.3, action = false }) {
  return <section className={`ag-access-panel ${className}`} style={appear(time, at)}>
    <div className="ag-panel-heading"><h2>{title}</h2><PencilLine size={15} strokeWidth={1.6} /></div>
    <div className="ag-access-body">
      {rows.map((row, i) => action ? <div className="ag-action-row" key={row[0]} style={appear(time,at+i*.1,4)}>
        <span>{row[0]}</span>
        <span className={`ag-permission ${row[1].toLowerCase()}`}>
          {row[1] === 'Approved' ? <Check size={14} /> : row[1] === 'Approval' ? <Clock3 size={13} /> : <Ban size={14} />}{row[1]}
        </span>
      </div> : <div className="ag-access-row" key={row} style={appear(time,at+i*.1,4)}>
        <i className={i > 2 ? 'ag-dot orange' : 'ag-dot'} /><span>{row}</span>
      </div>)}
    </div>
  </section>;
}

function RiskSidebar({ time }) {
  const risks = [
    ['Data Access', 48, 'pale'], ['Tool Access', 72, 'orange'],
    ['Test Actions', 81, 'orange'], ['External Access', 24, 'green'],
    ['Model Risk', 42, 'green'],
  ];
  return <aside className="ag-risk-sidebar" style={appear(time, 2.1)}>
    <div className="ag-risk-search"><Search size={17} strokeWidth={1.4} /><span>Search</span></div>
    <div className="ag-risk-card">
      <div className="ag-muted ag-risk-label">Risk Level</div>
      <div className="ag-risk-total">62/100</div>
      <div className="ag-risk-meters">{risks.map(([name, value, color]) => <div className="ag-risk-meter" key={name}>
        <div><span>{name}</span><strong>{value}</strong></div>
        <div className="ag-meter-track"><i className={color} style={{ width: `${({48:38,72:69,81:82,24:13,42:33}[value])}%` }} /></div>
      </div>)}</div>
      <div className="ag-risk-subtitle">RECENT RISK FINDINGS</div>
      <div className="ag-risk-findings">
        <div><h3>Project actions</h3><p>Deleting a project is blocked by the active policy.</p></div>
        <div><h3>Sandbox access</h3><p>Agent can send requests to the test API.</p></div>
      </div>
    </div>
    <div className="ag-recent-activity">
      <h3>Recent Activity</h3>
      <div><span>14:32 • Idempotency test</span><strong>Failed</strong></div>
      <div><span>14:31 • Evidence attached</span><strong className="green">Allowed</strong></div>
    </div>
  </aside>;
}

export function AgentDetail({ time = 0 }) {
  return <div className="ag-detail-scene">
    <SceneHeading eyebrow="UNDERSTAND EXACTLY WHAT EVERY AGENT CAN ACCESS" title="Codex QA" subtitle="Autonomous QA operations agent" time={time}>
      <span className="ag-pill active"><i />Active</span>
      <span className="ag-pill medium"><i />Medium Risk</span>
      <button className="ag-outline-button">Open Falcon</button>
      <button className="ag-outline-button">View Results</button>
    </SceneHeading>

    <section className="ag-agent-card" style={appear(time, .12)}>
      <div className="ag-agent-name"><h2>Codex</h2><p>Autonomous QA operations agent</p></div>
      <dl>
        <div><dt>Role :</dt><dd>Quality Assurance</dd></div>
        <div><dt>Status :</dt><dd>Active</dd></div>
        <div><dt>Environment :</dt><dd>Sandbox</dd></div>
        <div><dt>Risk :</dt><dd>Medium</dd></div>
      </dl>
    </section>

    <div className="ag-agent-meta" style={appear(time, .15)}>
      <div><span>Owner</span><strong>QA Team</strong></div>
      <div><span>Model</span><strong>Codex</strong></div>
      <div><span>Project</span><strong>Falcon Guide</strong></div>
      <div><span>Last active</span><strong>Current verification • Sandbox</strong></div>
    </div>
    <div className="ag-detail-stats">
      {[['Tests Executed', '24'], ['Failed Tests', '1'], ['Cases Revised', '5'], ['Evidence Linked', '8']].map(([label, value], i) =>
        <div key={label} style={appear(time, .2 + i * .04)}><span>{label}</span><strong>{value}</strong></div>
      )}
    </div>

    <svg className="ag-access-wires" viewBox="0 0 970 150" fill="none" aria-hidden="true">
      <Connector id="codex-data-access" time={time} delay={1} duration={1.35} d="M135 0 C135 60 158 44 158 106"/>
      <Connector id="codex-tools" time={time} delay={1.15} duration={1.5} d="M135 0 C135 60 168 56 200 56 L420 56 C468 56 486 75 486 106" color="var(--film-codex)"/>
      <Connector id="codex-actions" time={time} delay={1.3} duration={1.65} d="M135 0 C135 57 170 44 205 44 L754 44 C798 44 814 74 814 106" color="var(--film-amber)"/>
    </svg>

    <AccessPanel title="Data Access" rows={access} className="ag-data-access" time={time} at={1.15} />
    <AccessPanel title="Tools" rows={tools} className="ag-tools-access" time={time} at={1.45} />
    <AccessPanel title="Actions" rows={actions} className="ag-actions-access" action time={time} at={1.7} />
    <RiskSidebar time={time} />
  </div>;
}

const activityRows = [
  { time: '14:34:21', title: 'Codex QA - Idempotency test failed', status: 'Blocked', type: 'blocked', details: ['Policy: Sandbox-Requests-01', 'Reason: A duplicate request returned a second resource.'], action: 'View Incident' },
  { time: '14:33:52', title: 'Codex QA - Successful retry', status: 'Allowed', type: 'allowed', details: ['Policy: Sandbox-Requests-01'] },
  { time: '14:32:41', title: 'Codex QA - Coverage gap detected', status: 'Blocked', type: 'blocked', details: ['Reason: A required response path has no test case.'] },
  { time: '14:32:10', title: 'Codex QA - Case revised', status: 'Approval', type: 'approval', details: ['Policy: Repository-Write-01', 'Reason: Review the new idempotency assertions.'] },
  { time: '14:31:12', title: 'Codex QA - Evidence linked', status: 'Allowed', type: 'allowed', details: [] },
  { time: '14:30:41', title: 'Codex QA - Delete project', status: 'Blocked', type: 'blocked', details: ['Reason: Destructive project actions are blocked.'] },
];

function ActivityTimeline({ time }) {
  return <section className="ag-activity-timeline" style={appear(time, .28)}>
    <div className="ag-timeline-rule" />
    {activityRows.map((row, i) => <div className={`ag-timeline-row ${row.type}`} key={row.time} style={appear(time, .32 + i * .06, 5)}>
      <div className="ag-timeline-status">{row.type === 'allowed' ? <Check size={13} /> : row.type === 'approval' ? <Clock3 size={12} /> : <Ban size={13} />}</div>
      <time>{row.time}</time>
      <div className="ag-timeline-event">
        <div className="ag-event-heading"><span>{row.title}</span><b className={`ag-event-badge ${row.type}`}>{row.status}</b></div>
        {row.details.map(detail => <p key={detail}>{detail}</p>)}
        {row.action && <strong className="ag-event-action">{row.action}</strong>}
      </div>
    </div>)}
  </section>;
}

function ActionsChart({ time }) {
  const points = [[20,214],[89,154],[159,200],[227,123],[297,196],[366,137],[435,203],[505,129],[575,171],[644,127]];
  const graph=chartGeometry(points,274);
  const progress = clamp((time - 1.1) / .6);
  return <section className="ag-actions-chart" style={appear(time, .3)}>
    <h2>Actions Over Time</h2>
    <svg viewBox="0 0 664 316" aria-label="Actions over time smooth line chart">
      <defs>
        <linearGradient id="ag-actions-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--film-chart)" stopOpacity=".07" /><stop offset="1" stopColor="var(--film-chart)" stopOpacity="0" /></linearGradient>
        <clipPath id="ag-actions-reveal"><rect x="0" y="0" width={664 * progress} height="316" /></clipPath>
      </defs>
      <g clipPath="url(#ag-actions-reveal)">
        <path d={graph.area} fill="url(#ag-actions-shade)" />
        <path d={graph.line} fill="none" stroke="var(--film-chart)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="644" cy="127" r="3.2" fill="var(--film-chart)" stroke="var(--film-panel)" strokeWidth="1.3" />
      </g>
    </svg>
    <span className="ag-chart-now">Now</span>
  </section>;
}

function EvidenceChart({ time }) {
  const p = clamp((time - 1.65) / .7);
  const graph=chartGeometry([[52,211],[106,137],[159,201],[211,162],[264,226],[318,121],[371,201],[424,159],[478,178],[530,92],[583,162],[637,138]],273);
  return <section className="ag-evidence-chart" style={appear(time, .4)}>
    <h2>Evidence Over Time</h2>
    <svg viewBox="0 0 664 316" aria-label="Evidence linked over time smooth line chart">
      <defs>
        <linearGradient id="ag-evidence-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--film-chart-secondary)" stopOpacity=".09" /><stop offset="1" stopColor="var(--film-chart-secondary)" stopOpacity="0" /></linearGradient>
        <clipPath id="ag-evidence-reveal"><rect width={664*p} height="316" /></clipPath>
      </defs>
      {[68,109,150,191,232,273].map((y,i) => <g key={y}><line x1="52" y1={y} x2="642" y2={y} stroke="#888" strokeOpacity=".18" /><text x="19" y={y+2}>{[30,25,20,15,10,5][i]}</text></g>)}
      <g clipPath="url(#ag-evidence-reveal)">
        <path d={graph.area} fill="url(#ag-evidence-shade)" />
        <path d={graph.line} fill="none" stroke="var(--film-chart-secondary)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {['01', '05', '09', '13', '17', '21'].map((m,i) => <text key={m} x={52+i*117} y="296">{m}</text>)}
    </svg>
  </section>;
}

export function LiveActivity({ time = 0 }) {
  const metrics = [
    { title: 'Tests Executed', value: '24', change: '4 this run', Icon: Bot },
    { title: 'Failure Rate', value: '4.2%', change: '.5%', Icon: Workflow },
    { title: 'Review Queue', value: '5', change: '12.8%', Icon: Zap },
    { title: 'High-Risk Actions', value: '1', change: '8.4%', Icon: Coins },
  ];
  return <div className="ag-live-scene">
    <SceneHeading eyebrow="MONITOR AI ACTIONS IN REAL TIME" title="Live Activity" subtitle="Follow API checks, case updates and linked evidence in Falcon." time={time}>
      <div className="ag-activity-filters"><button className="selected">All</button><button>Allowed</button><button>Approval</button><button>Blocked</button><button>High Risk</button></div>
    </SceneHeading>
    <div className="ag-live-metrics">
      {metrics.map(({ title, value, change, Icon }, i) => <section key={title} style={appear(time, .12 + i*.035)}>
        <div className="ag-live-metric-top"><span>{title}</span><Icon size={17} strokeWidth={1.4} /></div>
        <strong>{value}</strong>
        <p><TrendWave /><span>{change}</span><span className="ag-comparison">vs. previous period</span></p>
      </section>)}
    </div>
    <ActivityTimeline time={time} />
    <ActionsChart time={time} />
    <EvidenceChart time={time} />
  </div>;
}
