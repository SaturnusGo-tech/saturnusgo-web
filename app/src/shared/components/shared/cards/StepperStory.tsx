'use client';
import { useState } from 'react';

type Step = { title: string; text: string };

const STEPS: Step[] = [
  { title: 'Unified flow', text: 'One motion from doorstep to destination across rides, hotels, events, and wallet.' },
  { title: 'Smart weekender', text: 'Curated short trips with overlap guards, time windows and budget preferences.' },
  { title: 'Trust & comms', text: 'Clarity between riders and drivers with real-time updates and guardrails.' },
  { title: 'Financial clarity', text: 'Spend insights, local rails, bonuses and flexible subscriptions.' }
];

export default function StepperStory(){
  const [index, setIndex] = useState(0);

  return (
    <div className="story">
      <div className="story__pin">
        <div className="story__panel">
          <h3 style={{marginTop:0}}>How it feels</h3>
          {STEPS.map((s, i)=>(
            <button
              key={i}
              data-step={i}
              className={`story__step ${index===i?'story__step--on':''}`}
              onMouseEnter={()=>setIndex(i)}
              onFocus={()=>setIndex(i)}
              style={{display:'block', textAlign:'left', background:'transparent', border:'none', padding:0, cursor:'pointer'}}
            >
              <strong>{s.title}</strong>
              <p className="sub" style={{margin:'6px 0 0'}}>{s.text}</p>
            </button>
          ))}
        </div>
        <div className="story__screen" aria-hidden>
          <AnimatedBackdrop idx={index}/>
        </div>
      </div>
    </div>
  );
}

function AnimatedBackdrop({ idx }: { idx: number }){
  const palette = [
    'linear-gradient(135deg,#6a8bff22,#50e3c220), radial-gradient(600px 300px at 70% 30%,#6a8bff33,transparent 60%)',
    'linear-gradient(135deg,#50e3c222,#6a8bff20), radial-gradient(600px 300px at 40% 70%,#50e3c233,transparent 60%)',
    'linear-gradient(135deg,#6a8bff26,#ffffff10), radial-gradient(600px 300px at 30% 30%,#7f89ff33,transparent 60%)',
    'linear-gradient(135deg,#50e3c226,#ffffff10), radial-gradient(600px 300px at 60% 60%,#50e3c233,transparent 60%)'
  ];
  return <div style={{
    width:'100%', height:'100%', transition:'background 400ms ease',
    background: palette[idx], borderRadius: '22px'
  }}/>;
}
