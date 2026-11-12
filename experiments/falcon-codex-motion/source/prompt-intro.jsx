import React from 'react';
import {ArrowUp,Paperclip} from 'lucide-react';
import {smoothstep} from './motion.mjs';
import './prompt-intro.css';
import {useFilmCopy} from './locale-context.jsx';

// Reuses Falcon landing's ChangeStory composer and word-preserving blur typing.
// Timing is driven by the film clock, so pausing/seeking never starts new timers.
export const INTRO_OFFSET=5.5;
export const INTRO_END=6;
export const QA_PROMPT='Review Payment API coverage. Verify idempotent retries in Sandbox and link any defect to its evidence.';

export function PromptIntro({time,reducedMotion=false}) {
 const {t}=useFilmCopy();
 const prompt=t(QA_PROMPT);
 const glyphStep=Math.min(.028,2.8/Math.max(1,prompt.length-1));
 const arrival=smoothstep(time/.65);
 const departure=smoothstep((time-5.15)/.85);
 const cursorIn=smoothstep((time-4.05)/.25);
 const cursorOut=1-smoothstep((time-5.15)/.35);
 const cursorMove=smoothstep((time-4.15)/.65);
 const press=smoothstep((time-4.82)/.09)*(1-smoothstep((time-4.94)/.17));
 let offset=0;
 return <section className="prompt-intro" role="img" aria-label={`${t('A QA task is sent to Codex:')} ${prompt}`}>
  <div className="codex-composer" style={{
   opacity:arrival*(1-departure),
   transform:reducedMotion?undefined:`translateY(${22*(1-arrival)-28*departure}px) scale(${.97+.03*arrival+.055*departure})`,
   filter:reducedMotion?undefined:`blur(${10*(1-arrival)+16*departure}px)`,
  }}>
   <div className="composer-text" aria-hidden="true">{prompt.split(' ').map((word,wordIndex)=>{
    const start=offset;offset+=word.length+1;
    return <span className="composer-word" key={wordIndex}>{Array.from(word).map((char,index)=>{
     const born=.55+(start+index)*glyphStep;
     const opacity=reducedMotion?1:smoothstep((time-born)/.16);
     const resolve=reducedMotion?1:smoothstep((time-born)/.23);
     return <span className="composer-glyph" key={index} style={{opacity,filter:resolve===1?'none':`blur(${4*(1-resolve)}px)`,transform:resolve===1?undefined:`translateY(${3*(1-resolve)}px)`}}>{char}</span>;
    })}{' '}</span>;
   })}</div>
   <div className="composer-bottom" aria-hidden="true">
    <img src="/codex.png" alt=""/><strong>Codex</strong><span className="composer-divider"/>
    <img className="composer-falcon" src="/falcon.svg" alt=""/><span>Falcon</span>
    <Paperclip size={18} className="composer-attachment"/>
    <span className="composer-send" data-ready={time>=4} style={{transform:reducedMotion?undefined:`scale(${1-.12*press})`}}><ArrowUp size={21}/></span>
   </div>
   {!reducedMotion&&<div className="composer-cursor" aria-hidden="true" style={{opacity:cursorIn*cursorOut,transform:`translate(${64*cursorMove}px,${-29*cursorMove}px)`}}>
    <span className="composer-agent-cursor"><svg width="25" height="30" viewBox="0 0 25 30" fill="none"><path d="M2 2L21.5 15.7L12.5 17.3L8.2 25.9L2 2Z" fill="var(--film-canvas)" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/></svg><span>QA</span></span>
   </div>}
  </div>
 </section>;
}
