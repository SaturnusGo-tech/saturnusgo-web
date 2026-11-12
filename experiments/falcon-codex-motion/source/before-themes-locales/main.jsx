import React, {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Home,Workflow,Network,ChartNoAxesCombined,Users,ShieldAlert,CircleHelp,Settings,Bell,Bot,ArrowUpRight,Zap,RefreshCw,Search,ArrowLeft,Play,Save,Send,Minus,Plus,Database,Check,FileText,GitBranch,Clock,ChevronRight} from 'lucide-react';
import {AgentDetail,LiveActivity} from './detail-scenes.jsx';
import {chartGeometry} from './chart-geometry.js';
import {TrendWave} from './chart-elements.jsx';
import {Connector} from './connector.jsx';
import {createCameraTrack, smoothstep} from './motion.mjs';
import './film.css';
import './detail-scenes.css';
import './professional-theme.css';
import './delivery.css';
import './vendor-utilities.css';
import './component-refinement.css';
import {AgentNode,ContractNode,RiskNode,VerificationInspector,VerificationToolbar,FilmButton,FilmSurface,QAInsight} from './scene-ui.jsx';
import {PromptIntro,INTRO_OFFSET,INTRO_END} from './prompt-intro.jsx';
const filmDuration=25.5;
const duration=filmDuration+INTRO_OFFSET;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>1-Math.pow(1-clamp(x),3);
const easeIO=x=>{x=clamp(x);return x*x*(3-2*x)};
const mix=(a,b,p)=>a+(b-a)*p;
function reveal(t,start=.15,d=.55){const p=ease((t-start)/d);return {opacity:p,transform:`translateY(${(1-p)*18}px)`,filter:p===1?'none':`blur(${(1-p)*3}px)`}}
function Icon({name,size=18}){const C={home:Home,flow:Workflow,network:Network,chart:ChartNoAxesCombined,users:Users,shield:ShieldAlert,help:CircleHelp}[name]||Bot;return <C size={size} strokeWidth={1.65}/>}
function Header(){return <header className="film-header"><div className="film-brand"><img src="/falcon.svg" alt="Falcon"/></div><span className="nav-divider">/</span>{['Repository','API Testing','Test Runs','Reports','Activity','Command Center'].map(s=><div key={s} className={'nav-tab '+(s==='Command Center'?'nav-active':'')}>{s}</div>)}<div className="header-right"><div className="health">System Health <i/></div><div className="nav-square"><Settings/></div><div className="nav-square"><Bell/></div><div className="nav-avatar"><img src="/codex.png" alt="Codex"/></div></div></header>}
function Rail(){return <aside className="film-rail">{['home','flow','network','chart','users'].map((n,i)=><div key={n} className={i===0?'selected':''}><Icon name={n}/></div>)}<div className="rail-bottom"><div><Icon name="shield"/></div><div><Icon name="help"/></div></div></aside>}
function Stat({title,value,index,time,icon: C=Bot}){const p=ease((time-[.65,.85,1.6,1.85][index])/.62);return <div className="stat" style={reveal(time,[.65,.85,1.6,1.85][index])}><div className="stat-top">{title}<C size={17}/></div><strong>{typeof value==='number'?Math.round(value*p).toLocaleString('en-US'):value}</strong><small><TrendWave/><span>{['1 connected','18 reviewed','24 executed','8 attached'][index]}</span><em>{index===0?'to this workspace':'in this verification'}</em></small></div>}
const overviewPoints=[[12,155],[44,91],[71,142],[92,111],[119,156],[156,76],[184,139],[211,113],[234,125],[255,43],[278,112],[294,86]];
const overviewGraph=chartGeometry(overviewPoints,190);
function LineChart({time}){return <svg viewBox="0 0 306 224" className="line-chart" role="img" aria-label="Run pass rate trend"><defs><linearGradient id="overview-shade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--film-chart-secondary)" stopOpacity=".10"/><stop offset="1" stopColor="var(--film-chart-secondary)" stopOpacity="0"/></linearGradient><clipPath id="overview-reveal"><rect x="0" y="0" width={306*ease((time-.8)/1.5)} height="224"/></clipPath></defs>{[30,68,106,144,182].map((y,i)=><g key={y}><path d={`M 34 ${y} H 294`} stroke="#ffffff12" strokeWidth=".6"/><text x="25" textAnchor="end" y={y+4} fill="var(--film-muted)" fontSize="10">{[100,90,80,70,60][i]}%</text></g>)}<g transform="translate(34 0) scale(.884 1)" clipPath="url(#overview-reveal)"><path d={overviewGraph.area} fill="url(#overview-shade)"/><path d={overviewGraph.line} fill="none" stroke="var(--film-chart-secondary)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></g>{['01','05','09','13','17','21'].map((s,i)=><text key={s} x={44+i*49} y="215" fill="var(--film-muted)" fontSize="10" textAnchor="middle">{s}</text>)}</svg>}
function AgentCard({title,desc,role,tone='neutral',time,delay,top}){return <AgentNode title={title} desc={desc} role={role} risk={tone==='warm'?'Medium':'Low'} style={{top,...reveal(time,delay)}}/>}

function HomeScene({time}){return <section className="scene home-scene"><div className="home-title" style={reveal(time,0)}><p className="eyebrow">SEE YOUR QA WORKSPACE AT A GLANCE</p><h1>Falcon Command Center</h1><p>Monitor Codex, coverage, API checks and evidence from one place.</p></div><div className="home-updated">Nov 12, 2026 <b>•</b> Last updated 2 min ago <RefreshCw size={15}/></div><div className="stats-grid"><Stat title="Connected Agents" value={1} time={time} index={0}/><Stat title="Test Cases" value={128} time={time} index={1} icon={Workflow}/><Stat title="Checks Executed" value={24} time={time} index={2} icon={Zap}/><Stat title="Evidence Files" value={8} time={time} index={3} icon={FileText}/></div><svg className="home-connections" viewBox="0 0 1344 650" aria-hidden="true">
<Connector id="workspace-codex" time={time} delay={3.35} d="M150 103 C225 103 235 103 300 103"/>
<Connector id="workspace-repository" time={time} delay={3.55} d="M150 103 C235 103 215 316 300 316"/>
<Connector id="workspace-documentation" time={time} delay={3.8} d="M150 103 C250 103 200 529 300 529"/>
<Connector id="codex-contract" time={time} color="var(--film-codex)" delay={4} d="M568 103 C635 103 605 185 674 185"/>
<Connector id="repository-contract" time={time} delay={4.2} d="M568 316 C625 316 615 260 674 260"/>
<Connector id="documentation-contract" time={time} delay={4.4} d="M568 529 C650 529 610 294 674 294"/>
<Connector id="contract-insights" time={time} delay={4.7} d="M939 235 C958 235 965 235 984 235"/>
</svg><FilmSurface className="workforce" style={reveal(time,3.05)}><h3>Falcon Workspace</h3><span>Codex connected</span></FilmSurface><AgentCard title="Codex" desc="Connected QA agent" role="API Verification" tone="warm" top={386} time={time} delay={3.38}/><AgentCard title="Repository" desc="Existing coverage and revisions" role="Test Coverage" top={599} time={time} delay={3.63}/><AgentCard title="Documentation" desc="Linked requirements and guides" role="Product Knowledge" top={812} time={time} delay={3.88}/><ContractNode style={reveal(time,4.13,.26)}/><RiskNode style={reveal(time,4.43,.26)}/><div className="home-right" style={reveal(time,3.1)}><div className="film-search"><Search size={16}/> Search</div><div className="run-chart"><h3>Run Pass Rate</h3><div className="chart-value">95.8%<small><TrendWave/> 4.2% <span>vs. previous run</span></small></div><LineChart time={time}/></div><QAInsight/></div></section>}
function WorkflowNode({className,title,subtitle,tag,items,time,start,style}){return <div className={'workflow-node '+className} style={{...style,...reveal(time,start,.3)}}>{tag&&<div className="node-tag"><Database size={13}/>{tag}</div>}<div className="node-content"><h3>{title}</h3><p>{subtitle}</p>{items&&<div className="node-items">{items.map((s,i)=><p key={s}>{s}<span className={className==='node-cream'&&i===2?'assertion-failed':''}><Check size={12}/>{className==='node-cream'&&i===2?'Mismatch':'Verified'}</span></p>)}</div>}</div><i className="node-pin top"/><i className="node-pin bottom"/></div>}
function PolicyScene({time}){return <section className="scene policy-scene"><div className="film-back"><ArrowLeft/></div><div className="policy-title" style={reveal(time,0)}><p className="eyebrow">API TESTING　/　PAYMENTS　/　VERIFICATION</p><h1>Verify API — Payment Retry Safety</h1><p>Review the contract. Execute checks. Keep the evidence.</p></div><div className="policy-actions" style={reveal(time,.15)}><FilmButton icon={Play}>Simulate</FilmButton><FilmButton icon={Save}>Save Draft</FilmButton><FilmButton icon={Send} tone="primary">Save Results</FilmButton></div><div className="workflow-surface" style={reveal(time,.25)}><div className="workflow-heading"><Workflow size={16}/> API Verification Flow <span><Minus/><Plus/></span></div><div className="when" style={reveal(time,.6)}>When</div><svg className="workflow-lines" viewBox="0 0 940 700" aria-hidden="true">
<Connector id="when-trigger" time={time} delay={.7} duration={.8} d="M470 68 V129"/>
<Connector id="trigger-context" time={time} delay={1.65} duration={1.05} d="M470 255 C470 308 260 290 260 354" color="var(--film-amber)"/>
<Connector id="trigger-validation" time={time} delay={1.8} duration={1.05} d="M470 255 C470 308 680 290 680 354" color="var(--film-teal)"/>
</svg><WorkflowNode className="node-green" tag="TRIGGER" title="Codex QA" subtitle="Starts sandbox verification" time={time} start={1.1} style={{left:350,top:194,width:270}}/><WorkflowNode className="node-warm" tag="CONTEXT" title="Read Existing Coverage" subtitle="Find the contract, reviewed cases and previous results." items={['API contract','Test cases','Revision history','Environment']} time={time} start={1.9} style={{left:115,top:419,width:320}}/><WorkflowNode className="node-cream" tag="VALIDATION" title="Verify Retry Safety" subtitle="Compare observed behaviour with the documented contract." items={['Create payment intent','Repeat identical request','Reuse key, change amount','Retain request evidence']} time={time} start={2.1} style={{left:535,top:419,width:320}}/><VerificationToolbar style={reveal(time,2.9)}/></div><VerificationInspector style={reveal(time,.35)}/></section>}
// Main framing poses only: continuous interpolation keeps momentum between them.
const cameraKeys=[
 [0,80,88,1,0],[.5,80,88,1,0],
 [1.65,35,-54,2.2,2],[1.95,35,-54,2.2,2],
 [3,-1546,-26,2.2,1],[3.3,-1546,-26,2.2,1],
 [4.3,40,59,1.026,0],[6.05,40,59,1.026,0],[6.5,80,88,1,0],
 [7.8,-11,-23,1.448,0],[8.1,-11,-23,1.448,0],
 [9,-472,-206,1.448,0],[9.35,-472,-206,1.448,0],
 [10.5,80,88,1,0],[11.5,80,88,1,0],
 [12.7,-17,-23,1.448,0],[14,-19,-297,1.448,0],[14.2,-19,-297,1.448,0],
 [15.25,46,64,1.023,0],[16.05,46,64,1.023,0],[16.5,80,88,1,0],
 [18,2,-231,1.4,0],[18.25,2,-231,1.4,0],
 [19.2,-403,-186,1.4,0],[19.5,-403,-186,1.4,0],
 [20.6,80,88,1,0],[21.5,80,88,1,0]
];
const cameraAt=createCameraTrack(cameraKeys);
const sceneCues=[['home',0],['detail',6.5],['policy',11.5],['activity',16.5]];
function sceneAt(t){if(t>=21.5)return ['brand',t-21.5,t-filmDuration];const cue=sceneCues.findLast(([,start])=>t>=start)||sceneCues[0];return [cue[0],Math.max(0,t-cue[1]),0]}
function SceneContent({scene,time}){return scene==='home'?<HomeScene time={time}/>:scene==='detail'?<AgentDetail time={time}/>:scene==='policy'?<PolicyScene time={time}/>:<LiveActivity time={time}/>}
function BrandEnd({time}){
  const entrance=(delay)=>{const p=ease((time-delay)/.8);return {opacity:p,transform:`translateY(${(1-p)*12}px)`,filter:`blur(${(1-p)*5}px)`}};
  return <section className="brand-slate" aria-label="Codex × Falcon">
    <div className="brand-lockup brand-codex" style={entrance(.3)}><img src="/codex.png" alt="Codex logo"/><span>Codex</span></div>
    <span className="brand-multiply" aria-hidden="true" style={entrance(.55)}>×</span>
    <div className="brand-lockup brand-falcon" style={entrance(.8)}><img src="/falcon.svg" alt="Falcon logo"/><span>Falcon</span></div>
  </section>;
}
function Film({time,reducedMotion=false}){
 const [scene,local]=sceneAt(time);
 if(scene==='brand')return <div className="film-stage" data-scene="brand" data-time={time.toFixed(3)}>
  <div className="brand-previous" style={{opacity:1-smoothstep(local/.7)}}><Film time={21.499} reducedMotion={reducedMotion}/></div>
  <div style={{opacity:smoothstep((filmDuration-time)/.55)}}><BrandEnd time={local}/></div>
 </div>;
 const [x,y,scale,rotation]=reducedMotion?[80,88,1,0]:cameraAt(time);
 const index=sceneCues.findIndex(([name])=>name===scene);
 const blend=index===0?1:smoothstep(local/.42);
 const previousFade=index===0?0:1-smoothstep(local/.26);
 const previous=sceneCues[index-1];
 return <div className="film-stage" data-scene={scene} data-time={time.toFixed(3)} style={{opacity:time<.35?smoothstep(time/.35):1}}>
  <div className="film-app" style={{left:0,top:0,transform:`translate3d(${x}px,${y}px,0) scale(${scale}) rotate(${rotation}deg)`}}>
   <Header/><Rail/>
   {previous&&previousFade>0&&<div className="screen-content" aria-hidden="true" style={{opacity:previousFade,filter:`blur(${smoothstep(local/.26)*5}px)`}}><SceneContent scene={previous[0]} time={sceneCues[index][1]-previous[1]}/></div>}
   <div className="screen-content" style={{opacity:blend,filter:blend<1?`blur(${(1-blend)*3}px)`:undefined}}><SceneContent scene={scene} time={local}/></div>
  </div>
  {time>15.18&&time<15.6&&<svg className="click-ring" width="90" height="90" style={{position:"absolute",left:1387,top:185,opacity:1-clamp((time-15.18)/.42),zIndex:13}}><circle cx="45" cy="45" r={6+clamp((time-15.18)/.42)*30} fill="none" stroke="var(--film-secondary)" strokeWidth="2"/></svg>}
  {!reducedMotion&&<FilmCursor time={time} scene={scene} local={local}/>}
 </div>;
}
function FilmCursor({time,scene,local}){const paths={home:[[4.5,930,860],[5.4,1160,1100],[6.3,1160,1100]],detail:[[6.7,550,530],[8.4,650,760],[10.4,1320,230],[11.3,1320,230]],policy:[[11.6,700,600],[13,1000,950],[14,1250,450],[15.2,1432,230],[15.8,1432,230]],activity:[[16.6,600,800],[18.3,830,650],[20,1360,210],[21.3,1360,210]]};const seq=paths[scene];let pos=seq[0];for(let i=1;i<seq.length;i++){const b=seq[i],a=seq[i-1];if(time<=b[0]){const p=easeIO((time-a[0])/(b[0]-a[0]));pos=[time,mix(a[1],b[1],p),mix(a[2],b[2],p)];break}pos=b}return <svg className="film-cursor" style={{left:pos[1],top:pos[2],opacity:time>4.3?Math.min(smoothstep((local-.15)/.35),smoothstep(((scene==='home'?6.5:scene==='detail'?11.5:scene==='policy'?16.5:21.5)-time)/.3)):0}} width="21" height="27" viewBox="0 0 21 27"><path d="M2 1L2 23L8 17L13 26L17 24L12 15L20 14Z" fill="#fff" stroke="#121212" strokeWidth="1.3"/></svg>}
function Story({time,reducedMotion=false}) {
 const filmTime=Math.max(0,time-INTRO_OFFSET);
 return <div className="story-stage" data-story-time={time.toFixed(3)} data-story-scene={time<INTRO_OFFSET?'prompt':'film'}>
  {time>=INTRO_OFFSET&&<div className="story-content" style={{opacity:smoothstep((time-INTRO_OFFSET)/.65)}}><Film time={filmTime} reducedMotion={reducedMotion}/></div>}
  {time<INTRO_END&&<PromptIntro time={time} reducedMotion={reducedMotion}/>}
 </div>;
}
function App(){const [reducedMotion,setReducedMotion]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReducedMotion(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[]);const query=new URLSearchParams(location.search);const initial=Number(query.get('t')||0);const [time,setTime]=useState(initial);const [playing,setPlaying]=useState(!query.has('t'));const [view,setView]=useState(query.get('view')||'falcon');const activeDuration=view==='source'?filmDuration:duration;const [fit,setFit]=useState(1);const viewer=useRef(null),video=useRef(null),current=useRef(initial);useEffect(()=>{current.current=time;if(video.current&&(!playing||view!=='source')&&Math.abs(video.current.currentTime-time)>.11)video.current.currentTime=time},[time,playing,view]);useEffect(()=>{if(!video.current)return;if(view==='source'&&playing){video.current.currentTime=current.current;video.current.play().catch(()=>{});}else video.current.pause()},[view,playing]);useEffect(()=>{const ob=new ResizeObserver(([entry])=>setFit(entry.contentRect.width/1600));if(viewer.current)ob.observe(viewer.current);return()=>ob.disconnect()},[]);useEffect(()=>{if(!playing)return;let id,anchor=performance.now(),base=current.current;function tick(now){if(document.hidden)return;const next=view==='source'&&video.current?video.current.currentTime:(base+(now-anchor)/1000)%activeDuration;current.current=next;setTime(next);id=requestAnimationFrame(tick)}function visibility(){cancelAnimationFrame(id);if(!document.hidden){anchor=performance.now();base=current.current;id=requestAnimationFrame(tick)}}document.addEventListener('visibilitychange',visibility);id=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(id);document.removeEventListener('visibilitychange',visibility)}},[playing,view,activeDuration]);return <main className={query.get('export')==='1'?'export-mode':undefined}><div className="review-toolbar"><a href="https://dribbble.com/shots/27800610-AgentGuard-AI-Agent-Control-Center-Animation" target="_blank" rel="noreferrer">AgentGuard reference ↗</a><div className="review-tabs">{[['falcon','Falcon × Codex'],['source','Original']].map(([v,l])=><button key={v} className={view===v?'on':''} onClick={()=>{if(v===view)return;setPlaying(false);setTime(v==='source'?Math.max(0,time-INTRO_OFFSET):Math.min(duration,time+INTRO_OFFSET));setView(v)}}>{l}</button>)}</div><span>Local motion study · illustrative QA data</span></div><div className="viewer" ref={viewer} style={{height:1200*fit}}><div className="native-stage" style={{transform:`scale(${fit})`}}><div style={{visibility:view==='falcon'?'visible':'hidden'}}><Story time={time} reducedMotion={reducedMotion}/></div><video ref={video} className="original-film" src="/reference.mp4" muted playsInline loop preload="auto" style={{visibility:view==='source'?'visible':'hidden'}}/></div></div><div className="review-controls"><button onClick={()=>setPlaying(!playing)} aria-label={playing?'Pause animation':'Play animation'}>{playing?'Pause':'Play'}</button><input aria-label="Timeline" type="range" min="0" max={activeDuration} step=".016667" value={time} onChange={e=>{setPlaying(false);setTime(Number(e.target.value))}}/><output>{time.toFixed(2)} / {activeDuration.toFixed(2)} s</output></div><div className="scene-controls">{[[0,'Prompt'],[5+INTRO_OFFSET,'Command Center'],[10+INTRO_OFFSET,'Codex QA'],[15+INTRO_OFFSET,'API Flow'],[20+INTRO_OFFSET,'Live Activity']].map(([t,l])=><button key={t} onClick={()=>{setTime(view==='source'?Math.max(0,t-INTRO_OFFSET):t);setPlaying(false)}}>{l}</button>)}</div></main>}
createRoot(document.getElementById('root')).render(<App/>);
