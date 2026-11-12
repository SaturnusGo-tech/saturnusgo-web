import React, {useId,useState} from 'react';
import {Button, ButtonGroup} from '@heroui/button';
import {Card} from '@heroui/card';
import {Tabs, Tab} from '@heroui/tabs';
import {ArrowUpRight, BookOpen, CircleCheck, CircleX, Database, FileCheck2, FileText, Files, GitBranch, Link2, ListChecks, Network, Package, Play, ShieldAlert, SquareCheck, Workflow} from 'lucide-react';
import {TransitionPanel} from './vendor/transition-panel.jsx';

// HeroUI controls use Falcon's neutral tokens; these are not imitation controls.
export function FilmButton({children, icon:Icon, tone='quiet', className='', ...props}) {
  return <Button size="sm" radius="sm" variant={tone==='primary'?'solid':'light'} disableRipple
    {...props} className={`film-button film-button-${tone} ${className}`} data-library="HeroUI">
    {Icon&&<Icon size={14} strokeWidth={1.65}/>} {children}
  </Button>;
}

export function FilmSurface({children,className='',...props}) {
  return <Card shadow="none" radius="lg" {...props} className={`film-surface ${className}`} data-library="HeroUI">{children}</Card>;
}

export function PropertyList({items,className=''}) {
  return <dl className={`film-properties ${className}`}>{items.map(({icon:Icon,label,value,tone})=><div key={label}>
    <dt><Icon size={14} strokeWidth={1.6}/><span>{label}</span></dt>
    <dd className={tone?`property-${tone}`:undefined}>{value}</dd>
  </div>)}</dl>;
}

export function AgentNode({title,desc,role,risk='Low',style}) {
  return <FilmSurface className="home-agent" style={style}>
    <header className="node-identity">
      {title==='Codex'?<img src="/codex.png" alt=""/>:title==='Repository'?<Files size={22}/>:<BookOpen size={22}/>}
      <h3>{title}</h3><CircleCheck size={14} className="node-connected" aria-label="Connected"/>
    </header>
    <p className="node-description">{desc}</p>
    <PropertyList items={[
      {icon:Workflow,label:'Role',value:role},
      {icon:Database,label:'Environment',value:'Sandbox'},
      {icon:ShieldAlert,label:'Risk',value:risk},
    ]}/>
  </FilmSurface>;
}

export function ContractNode({style}) {
  return <FilmSurface className="home-event" style={style}>
    <header className="node-identity"><FileCheck2 size={20}/><h3>Contract Checked</h3></header>
    <p className="node-description">Starts verification when the API contract is reviewed.</p>
    <PropertyList items={[
      {icon:Package,label:'Event',value:'Payment Intent Created'},
      {icon:Database,label:'Source',value:'Sandbox API'},
      {icon:Play,label:'Frequency',value:'On demand'},
      {icon:Link2,label:'Evidence',value:'Retained'},
    ]}/>
  </FilmSurface>;
}

export function RiskNode({style}) {
  return <FilmSurface className="home-risk" style={style}>
    <header className="node-identity"><ShieldAlert size={18}/><h3>Risk Assessment</h3></header>
    <p className="node-description">Payment retry safety</p>
    <ResponseComparison compact/>
    <p className="risk-evidence"><Link2 size={12}/> Evidence linked to the failed check.</p>
  </FilmSurface>;
}

function ResponseComparison({compact=false}) {
  return <dl className={`response-comparison ${compact?'compact':''}`}>
    <div><dt>Expected</dt><dd><CircleCheck size={14}/>409 Conflict</dd></div>
    <div><dt>Observed</dt><dd className="response-failed"><CircleX size={14}/>201 Created</dd></div>
  </dl>;
}

export function VerificationInspector({style}) {
  const requestId=useId();
  const [request,setRequest]=useState('changed');
  const [linked,setLinked]=useState(false);
  return <aside className="policy-side inspector" style={style}>
    <section className="inspector-request">
      <header className="inspector-heading"><h3>Test Request</h3><span className="failure-indicator"><CircleX size={14}/>Failed</span></header>
      <p className="inspector-caption">Payment retry safety</p>
      <Tabs aria-label="Request comparison" selectedKey={request} onSelectionChange={setRequest} size="sm" variant="light"
        classNames={{base:'film-tabs',tabList:'film-tab-list',tab:'film-tab',tabContent:'film-tab-label',cursor:'film-tab-cursor',panel:'film-tab-panel'}}>
        <Tab key="original" id={`${requestId}-original`} aria-controls={`${requestId}-panel`} title="Original request"/>
        <Tab key="changed" id={`${requestId}-changed`} aria-controls={`${requestId}-panel`} title="Changed amount"/>
      </Tabs>
      <div role="tabpanel" id={`${requestId}-panel`} aria-labelledby={`${requestId}-${request}`} tabIndex={0}>
      <TransitionPanel activeIndex={request==='original'?0:1} className="request-transition"
        variants={{enter:{opacity:0,y:4},center:{opacity:1,y:0},exit:{opacity:0,y:-4}}}
        transition={{duration:.18,ease:'easeOut'}}>
        <p className="request-context">Create the original payment intent.</p>
        <p className="request-context">Reuse the same key with a changed amount.</p>
      </TransitionPanel>
      </div>
      <ResponseComparison/>
    </section>
    <section className="inspector-insight">
      <header className="inspector-heading"><h3><img src="/codex.png" alt=""/>Codex Insight</h3></header>
      <p>I found a missing assertion in the existing coverage.</p>
      <p className="inspector-finding">Reusing a key with a changed payload must return a conflict.</p>
      <div className="inspector-footnote"><CircleX size={13}/><span>The response created a second payment intent.</span></div>
      <FilmButton icon={linked?CircleCheck:Link2} onPress={()=>setLinked(true)}>{linked?'Evidence linked':'Link evidence to defect'}</FilmButton>
    </section>
    <section className="inspector-summary">
      <h3>Verification Summary</h3>
      <PropertyList items={[
        {icon:Package,label:'Applies to',value:'Payment API'},
        {icon:Database,label:'Environment',value:'Sandbox'},
        {icon:Files,label:'Evidence',value:'8 linked files'},
      ]}/>
    </section>
  </aside>;
}

const blockTypes=[
  ['Contract',FileText],['Coverage',ListChecks],['API Check',Network],['Assertion',SquareCheck],
  ['Evidence',Files],['Defect',ShieldAlert],['Result',CircleCheck],['Report',BookOpen],
];

export function VerificationToolbar({style}) {
  return <div className="automation-tray verification-toolbar" style={style}>
    <h3>Verification Block <span>Drag or click to add to canvas</span></h3>
    <ButtonGroup className="verification-tools" aria-label="Verification blocks" data-library="HeroUI">
      {blockTypes.map(([label,Icon])=><FilmButton key={label} icon={Icon}>{label}</FilmButton>)}
    </ButtonGroup>
  </div>;
}

export function AgentActions() {
  return <><div className="agent-statuses" aria-label="Agent status">
    <span><CircleCheck size={14}/>Active</span><span><ShieldAlert size={14}/>Medium risk</span>
  </div><ButtonGroup className="agent-action-group" data-library="HeroUI">
    <FilmButton icon={ArrowUpRight}>Open Falcon</FilmButton>
    <FilmButton tone="secondary" icon={ListChecks}>View Results</FilmButton>
  </ButtonGroup></>;
}
