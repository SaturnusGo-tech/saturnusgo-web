import React, {useEffect,useRef,useState} from 'react';
import {FilmProvider} from './locale-context.jsx';
import {applyEmbedUpdate,isTrustedEmbedMessage,advanceEmbedTime,READY_TYPE,REDUCED_FRAME} from './embed-state.mjs';
import './embedded-app.css';

export function EmbeddedApp({Story,duration}) {
 const query=useRef(new URLSearchParams(location.search)).current;
 const [settings,setSettings]=useState({theme:query.get('theme')==='light'?'light':'dark',locale:query.get('lang')==='ru'?'ru':'en',active:false,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,restart:0});
 const [time,setTime]=useState(0);
 const [fit,setFit]=useState(0);
 const [visible,setVisible]=useState(!document.hidden);
 const current=useRef(0), frame=useRef(null);
 const reduced=settings.reducedMotion;
 useEffect(()=>{
  document.documentElement.dataset.embedded='true';
  const resize=new ResizeObserver(([entry])=>setFit(Math.min(entry.contentRect.width/1600,entry.contentRect.height/1200)));
  resize.observe(frame.current);
  const receive=event=>{
   if(!isTrustedEmbedMessage(event,window.parent,location.origin))return;
   if(event.data.restart===true){current.current=0;setTime(0);}
   setSettings(state=>applyEmbedUpdate(state,event.data));
  };
  const visibility=()=>setVisible(!document.hidden);
  window.addEventListener('message',receive);
  document.addEventListener('visibilitychange',visibility);
  window.parent.postMessage({type:READY_TYPE},location.origin);
  return()=>{resize.disconnect();window.removeEventListener('message',receive);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{document.documentElement.dataset.theme=settings.theme;document.documentElement.lang=settings.locale;},[settings.theme,settings.locale]);
 useEffect(()=>{
  if(!settings.active||!visible||reduced)return;
  const base=current.current,anchor=performance.now();let id;
  const tick=now=>{
   const next=advanceEmbedTime(base,(now-anchor)/1000,duration);
   current.current=next;setTime(next);
   if(next<duration-.65)id=requestAnimationFrame(tick);
  };
  id=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(id);
 },[settings.active,settings.restart,visible,reduced,duration]);
 return <FilmProvider locale={settings.locale} theme={settings.theme}>
  <main className="embedded-film" ref={frame} data-active={settings.active} data-reduced={reduced}>
   <div className="native-stage" style={{left:'50%',top:'50%',marginLeft:-800*fit,marginTop:-600*fit,transform:`scale(${fit})`}}>
    <Story time={reduced?REDUCED_FRAME:time} reducedMotion={reduced}/>
   </div>
  </main>
 </FilmProvider>;
}
