import { useMemo, useRef, useState } from "react";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { supportClient } from "../data/support-client";
import { fileTypes, type SupportFile, type SupportInput, type SupportReceipt } from "../domain/support";
export function useSupportForm(http:TmsHttpClient,workspaceId:string,ru:boolean) {
  const client=useMemo(()=>supportClient(http,workspaceId),[http,workspaceId]);
  const [kind,setKind]=useState<SupportInput["kind"]>("question");
  const [topic,setTopic]=useState<SupportInput["topic"]>("other");
  const [subject,setSubject]=useState("");const [description,setDescription]=useState("");
  const [files,setFiles]=useState<SupportFile[]>([]); const filesRef=useRef(files);filesRef.current=files;
  const [busy,setBusy]=useState(false);const busyRef=useRef(false);
  const [progress,setProgress]=useState(0);const [error,setError]=useState("");
  const [receipt,setReceipt]=useState<SupportReceipt|null>(null);
  const attempt=useRef<{key:string;id:string}|null>(null);
  function add(incoming:File[]) {
    if(busyRef.current) return;
    const next=[...filesRef.current];
    for(const file of incoming) {
      const ext=file.name.split('.').pop()?.toLowerCase()??'';
      if(!fileTypes[ext]||file.size<1||file.size>10*1024*1024||next.length>=10||next.reduce((n,e)=>n+e.file.size,0)+file.size>25*1024*1024) {
        setError(ru?"До 10 файлов: изображения, PDF, TXT, JSON, CSV или ZIP. До 10 МБ каждый, 25 МБ вместе.":"Up to 10 images, PDF, TXT, JSON, CSV or ZIP files. 10 MB per file, 25 MB total.");continue;
      }
      if(next.some(e=>e.file.name===file.name&&e.file.size===file.size&&e.file.lastModified===file.lastModified)) continue;
      next.push({id:crypto.randomUUID(),file});
    }
    filesRef.current=next;setFiles(next);
  }
  function remove(id:string) {if(!busyRef.current){const next=filesRef.current.filter(f=>f.id!==id);filesRef.current=next;setFiles(next);}}
  async function submit(pageUrl:string) {
    if(busyRef.current||subject.trim().length<3||description.trim().length<3) return;
    busyRef.current=true;setBusy(true);setError("");setProgress(0);
    try {
      const manifest=await Promise.all(files.map(async entry=>({id:entry.id,name:entry.file.name,size:entry.file.size,
        mime:fileTypes[entry.file.name.split('.').pop()!.toLowerCase()],
        sha256:Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",await entry.file.arrayBuffer()))).map(n=>n.toString(16).padStart(2,'0')).join('')})));
      const input:SupportInput={kind,topic,subject,description,pageUrl,files:manifest};const key=JSON.stringify(input);
      if(attempt.current?.key!==key) attempt.current={key,id:crypto.randomUUID()};
      const result=await client.send(attempt.current.id,input,files,setProgress);
      setReceipt(result);
    } catch(error) {
      if(error instanceof Error && (error.message==="DRAFT_EXPIRED" || ("status" in error && error.status===410))) attempt.current=null;
      const id=error&&typeof error==='object'&&'requestId' in error?error.requestId:null;
      setError((ru?"Не удалось отправить обращение. Текст и файлы сохранены в форме. Повторите отправку.":"Could not send your request. Your text and files remain in this form. Please retry.")+(id?` (${id})`:''));
    } finally {busyRef.current=false;setBusy(false);}
  }
  function reset(){setSubject('');setDescription('');setFiles([]);filesRef.current=[];setReceipt(null);setError('');attempt.current=null;}
  return {kind,setKind,topic,setTopic,subject,setSubject,description,setDescription,files,add,remove,busy,progress,error,setError,receipt,submit,reset};
}
export type SupportFormModel=ReturnType<typeof useSupportForm>;
