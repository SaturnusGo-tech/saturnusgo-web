import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { Modal } from "../../presentation/common/modal/Modal";
import { useSupportForm } from "../application/useSupportForm";
import { supportScreenshot } from "../data/capture/support-screenshot";
import { SupportForm } from "../presentation/form/SupportForm";
import { SupportToast } from "../presentation/toast/SupportToast";
import css from "../presentation/support.module.css";
import nav from "../../presentation/workspace/tms-shell.module.css";
function cleanPageUrl() {
  const url=new URL(window.location.href);url.hash='';
  const keep=new Set(['workspaceId','projectId','view','caseId','defectId','runId','suiteId','folderId','portfolioId','catalogProjectId']);
  Array.from(url.searchParams.keys()).forEach(key=>{if(!keep.has(key))url.searchParams.delete(key);});return url.href;
}
export function SupportContact({workspaceId}:{workspaceId:string}) {
  const {locale}=useTmsLocale();const ru=locale==='ru';const http=useTmsHttpClient();
  const model=useSupportForm(http,workspaceId,ru);const [open,setOpen]=useState(false);
  const [accepted,setAccepted]=useState<string|null>(null);
  const dismissToast=useCallback(()=>setAccepted(null),[]);
  useEffect(()=>{if(model.receipt){setOpen(false);setAccepted(model.receipt.id);}},[model.receipt]);
  const [pageUrl,setPageUrl]=useState('');const [capturing,setCapturing]=useState(false);
  const shot=useRef<File|null>(null);const snapshot=useRef<Promise<File>|null>(null);
  const screenshot=Boolean(shot.current&&model.files.some(entry=>entry.file===shot.current));
  function show(){if(model.receipt){model.reset();shot.current=null;snapshot.current=null;}if(pageUrl!==cleanPageUrl()){if(shot.current){const entry=model.files.find(e=>e.file===shot.current);if(entry)model.remove(entry.id);}shot.current=null;snapshot.current=null;}setPageUrl(cleanPageUrl());setOpen(true);}
  async function capture(){
    if(capturing)return;setCapturing(true);model.setError('');
    try {snapshot.current??=supportScreenshot();shot.current=await snapshot.current;model.add([shot.current]);}
    catch{snapshot.current=null;model.setError(ru?'Не удалось создать снимок. Можно прикрепить скриншот файлом.':'Could not capture this screen. You can attach a screenshot file.');}
    finally{setCapturing(false);}
  }
  const close=()=>{if(!model.busy&&!capturing)setOpen(false);};
  return <><button type="button" className={nav.navigationUtilityButton} onClick={show} title={ru?'Связаться с нами':'Contact us'} data-testid="nav-support-utility">
    <span className={nav.navigationIcon} aria-hidden="true"><MessageCircle size={20}/></span><span className={nav.navigationLabel}>{ru?'Связаться с нами':'Contact us'}</span>
  </button>{typeof document!=='undefined'&&createPortal(<><SupportToast receiptId={accepted} ru={ru} onDismiss={dismissToast}/><AnimatePresence>{open&&<motion.div data-support-overlay className={css.overlay}
    initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.18}}>
    <Modal title={ru?'Новое обращение':'Contact Falcon'} onClose={close} panelClassName={css.panel} wide>
      <SupportForm model={model} ru={ru} pageUrl={pageUrl} capture={()=>void capture()} capturing={capturing} screenshot={screenshot} onClose={close}/>
    </Modal></motion.div>}</AnimatePresence></>,document.body)}</>;
}
