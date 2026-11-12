import React, {useMemo,useState} from 'react';
import {Button} from '@heroui/button';
import {Card} from '@heroui/card';
import {ArrowUpRight, BookOpen, CircleCheck, CircleX, Database, FileCheck2, FileText, Files, Link2, ListChecks, Network, Package, Play, ShieldAlert, SquareCheck, Workflow, ChevronRight, Check, Clock3, ExternalLink} from 'lucide-react';
import AnimatedList from './vendor/reactbits-animated-list.jsx';
import Dock from './vendor/reactbits-dock.jsx';
import {CodeComparison} from './vendor/magicui-code-comparison.tsx';
import {InteractiveHoverButton} from './vendor/magicui-interactive-hover-button.tsx';
import {useFilmCopy} from './locale-context.jsx';

export function FilmButton({children,icon:Icon,tone='quiet',className='',...props}) {
 return <Button size="sm" radius="sm" variant={tone==='primary'?'solid':'light'} disableRipple {...props} className={`film-button film-button-${tone} ${className}`} data-library="HeroUI">{Icon&&<Icon size={14} strokeWidth={1.65}/>} {children}</Button>;
}
export function FilmSurface({children,className='',...props}) {
 return <Card shadow="none" radius="lg" {...props} className={`film-surface ${className}`} data-library="HeroUI">{children}</Card>;
}
export function MotionAction({children,className='',...props}) {
 return <InteractiveHoverButton {...props} className={`magic-action ${className}`} data-library="Magic UI · Interactive Hover Button">{children}</InteractiveHoverButton>;
}
const listTokens={
 '--al-frame':'var(--film-list-frame)','--al-tile':'var(--film-list-tile)',
 '--al-well':'var(--film-list-well)','--al-tile-edge':'var(--film-list-tile-edge)','--al-tile-highlight':'var(--film-list-tile-highlight)',
 '--al-tile-shadow':'var(--film-list-tile-shadow)','--al-frame-shadow':'var(--film-list-frame-shadow)',
 '--al-frame-edge':'var(--film-list-frame-edge)','--al-frame-highlight':'var(--film-list-frame-highlight)',
 '--al-muted':'var(--film-list-muted)','--al-ring':'var(--film-list-ring)','--al-ring-fill':'var(--film-list-ring-fill)',
};
function NativeList({className='',...props}) {
 const {t,theme}=useFilmCopy();
 return <div className={`native-list ${className}`} data-library="React Bits · Animated List"><AnimatedList theme={theme} ariaLabel={t('Verification items')} width="100%" radius={11} gap={5} animation="fade" animateOnce stagger={.07} showGradients={false} displayScrollbar={false} selectOnHover={false} style={listTokens} {...props}/></div>;
}
const translateEntries=(items,t)=>items.map(item=>({...item,title:t(item.title),description:t(item.description),meta:typeof item.meta==='string'?t(item.meta):item.meta}));
const agentEntries={
 Codex:[{icon:<img src="/codex.png" alt=""/>,title:'Codex',description:'API verification agent',meta:<CircleCheck size={14}/>}],
 Repository:[{icon:<Files size={20}/>,title:'Repository',description:'Coverage & revisions',meta:<CircleCheck size={14}/>}],
 Documentation:[{icon:<BookOpen size={20}/>,title:'Documentation',description:'Requirements & guides',meta:<CircleCheck size={14}/>}],
};
export function AgentNode({title,risk='Low',style}) {
 const {t}=useFilmCopy();
 const entries=useMemo(()=>translateEntries(agentEntries[title]||[],t),[title,t]);
 return <article className={`home-agent library-node ${title==='Codex'?'codex-node':''}`} style={style}>
  <NativeList className="node-list" frame={false} items={entries} maxHeight={90}/>
  <div className="node-facts"><div><span>{t('Environment')}</span><strong><Database size={12}/>{t('Sandbox')}</strong></div><div><span>{t('Risk level')}</span><strong className={risk==='Medium'?'risk-medium':''}><i/>{t(risk)}</strong></div></div>
  <div className="node-note"><span className="connection-dot"/> {t(title==='Codex'?'Connected to Falcon':title==='Repository'?'128 cases · 18 reviewed':'Linked to this verification')}</div>
 </article>;
}
const contractEntry=[{icon:<FileCheck2 size={21}/>,title:'Contract checked',description:'Payment Intent Created',meta:<Check size={14}/>}];
export function ContractNode({style}) {
 const {t}=useFilmCopy();
 const entries=useMemo(()=>translateEntries(contractEntry,t),[t]);
 return <article className="home-event library-node" style={style}>
  <NativeList className="node-list" frame={false} items={entries} maxHeight={92}/>
  <div className="event-timeline"><div><i/><span>{t('Sandbox API')}</span><small>{t('Source')}</small></div><div><i/><span>{t('On demand')}</span><small>{t('Trigger')}</small></div><div><i/><span>{t('Evidence retained')}</span><Link2 size={12}/></div></div>
 </article>;
}
function ResponseDiff({compact=false}) {
 const {t}=useFilmCopy();
 return <CodeComparison className={`response-diff ${compact?'compact':''}`} beforeCode={compact?'409\nConflict':`409 Conflict\n${t('Intent unchanged')}`} afterCode={compact?'201\nCreated':`201 Created\n${t('New intent created')}`} beforeTitle={t('Expected')} afterTitle={t('Observed')} beforeLabel="" afterLabel=""/>;
}
export function RiskNode({style}) {
 const {t}=useFilmCopy();
 return <article className="home-risk library-node" style={style}>
  <header className="risk-title"><ShieldAlert size={16}/><h3>{t('Retry safety')}</h3><span>{t('1 gap')}</span></header>
  <ResponseDiff compact/>
  <p className="risk-evidence"><Link2 size={12}/> {t('Evidence attached')}</p>
 </article>;
}
const checkEntries=[
 {id:'original',icon:<CircleCheck size={18}/>,title:'Initial request',description:'Payment intent created',meta:'201'},
 {id:'retry',icon:<CircleCheck size={18}/>,title:'Identical retry',description:'Original intent returned',meta:'200'},
 {id:'changed',icon:<CircleX size={18}/>,title:'Changed payload',description:'A second intent was created',meta:<span className="check-failed">201</span>},
];
const summaryEntries=[
 {icon:<Package size={17}/>,title:'Payment API',description:'Sandbox environment',meta:<Database size={14}/>},
 {icon:<Files size={17}/>,title:'Evidence retained',description:'Requests, responses & logs',meta:'8 files'},
];
export function VerificationInspector({style}) {
 const {t}=useFilmCopy();
 const [linked,setLinked]=useState(false);
 const checks=useMemo(()=>translateEntries(checkEntries,t),[t]);
 const summary=useMemo(()=>translateEntries(summaryEntries,t),[t]);
 return <aside className="policy-side inspector library-inspector" style={style}>
  <section className="inspector-request">
   <header className="inspector-heading"><h3>{t('Test request')}</h3><span className="failure-indicator"><CircleX size={13}/>{t('Failed')}</span></header>
   <p className="inspector-caption">{t('Idempotency · changed amount')}</p>
   <ResponseDiff/>
   <NativeList className="request-checks" items={checks} initialSelectedIndex={2} maxHeight={200} frame={false}/>
  </section>
  <section className="inspector-insight">
   <header className="inspector-heading"><h3><img src="/codex.png" alt=""/>{t('Codex insight')}</h3><span className="insight-count">01</span></header>
   <p className="inspector-finding">{t('One key. Two payment intents.')}</p>
   <p>{t('The changed payload must return a conflict. Existing coverage missed this assertion.')}</p>
   <MotionAction onClick={()=>setLinked(true)}>{t(linked?'Evidence linked':'Link evidence')}</MotionAction>
  </section>
  <section className="inspector-summary"><h3>{t('Verification summary')}</h3><NativeList className="summary-list" items={summary} maxHeight={155} frame={false}/></section>
 </aside>;
}
const blockTypes=[['Contract',FileText],['Coverage',ListChecks],['API Check',Network],['Assertion',SquareCheck],['Evidence',Files],['Defect',ShieldAlert],['Result',CircleCheck],['Report',BookOpen]];
const dockTokens={
 '--dock-panel':'var(--film-dock-panel)','--dock-tile':'var(--film-dock-tile)',
 '--dock-panel-edge':'var(--film-dock-panel-edge)','--dock-panel-highlight':'var(--film-dock-panel-highlight)',
 '--dock-tile-edge':'var(--film-dock-tile-edge)','--dock-tile-highlight':'var(--film-dock-tile-highlight)','--dock-label':'var(--film-dock-label)',
};
export function VerificationToolbar({style}) {
 const {t,theme}=useFilmCopy();
 const [selected,setSelected]=useState('');
 const items=useMemo(()=>blockTypes.map(([label,Icon])=>({label:t(label),icon:<Icon size={21} strokeWidth={1.65}/>,onClick:()=>setSelected(label)})),[t]);
 return <div className="automation-tray verification-toolbar" style={style}>
  <div className="block-library-caption"><h3>{t('Verification blocks')}</h3><p aria-live="polite">{selected?`${t('Selected:')} ${t(selected)}`:t('Choose a step for the flow')}</p></div>
  <Dock theme={theme} ariaLabel={t('Verification blocks')} items={items} baseItemSize={46} magnification={59} distance={130} panelHeight={64} gap={9} roundness={.65} showIndicators={false} showBadges={false} bounce={false} accentColor="#b7addb" className="verification-dock" style={dockTokens}/>
 </div>;
}
const insightEntries=[{icon:<ShieldAlert size={20}/>,title:'Retry-safety gap',description:'Changed payload · same key',meta:'1'}];
export function QAInsight() {
 const {t}=useFilmCopy();
 const entries=useMemo(()=>translateEntries(insightEntries,t),[t]);
 return <div className="insights library-insights"><header><img src="/codex.png" alt=""/><span>{t('QA insights')}</span></header><NativeList items={entries} frame={false} maxHeight={95}/><MotionAction>{t('Investigate')}</MotionAction></div>;
}
export function AgentActions() {
 const {t}=useFilmCopy();
 return <><div className="agent-statuses" aria-label={t('Agent status')}><span><span className="connection-dot"/>{t('Active')}</span><span><ShieldAlert size={14}/>{t('Medium risk')}</span></div><div className="agent-action-group"><MotionAction>{t('Open Falcon')}</MotionAction><FilmButton icon={ListChecks}>{t('View results')}<ChevronRight size={12}/></FilmButton></div></>;
}
