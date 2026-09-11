import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import type { SupportFile } from "../domain/support";
import css from "./support.module.css";
function Preview({file}:{file:File}) {
  const [url,setUrl]=useState('');
  useEffect(()=>{if(!file.type.startsWith('image/'))return;const next=URL.createObjectURL(file);setUrl(next);return()=>URL.revokeObjectURL(next);},[file]);
  return url?<a href={url} target="_blank" rel="noreferrer" title={file.name}><img src={url} alt={file.name}/></a>:<FileText size={20}/>;
}
export function SupportFiles({files,remove,busy,ru}:{files:SupportFile[];remove:(id:string)=>void;busy:boolean;ru:boolean}) {
  return <div className={css.files}>{files.map(entry=><div className={css.file} key={entry.id}>
    <Preview file={entry.file}/><span>{entry.file.name}<small>{(entry.file.size/1024).toFixed(0)} KB</small></span>
    <button type="button" disabled={busy} aria-label={`${ru?'Удалить':'Remove'} ${entry.file.name}`} onClick={()=>remove(entry.id)}><X size={16}/></button>
  </div>)}</div>;
}
