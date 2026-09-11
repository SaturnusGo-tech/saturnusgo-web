import { Bug, CircleHelp, Lightbulb, Camera, Send, Check } from "lucide-react";
import { MarkdownField } from "../../../presentation/cases/inspector/markdown/MarkdownField";
import { MarkdownAttachmentButton } from "../../../presentation/cases/inspector/markdown/attachments/MarkdownAttachmentUi";
import type { SupportFormModel } from "../../application/useSupportForm";
import { topics } from "../../domain/support";
import { SupportFiles } from "../SupportFiles";
import css from "../support.module.css";
export function SupportForm({model:m,ru,pageUrl,capture,capturing,screenshot,onClose}:{model:SupportFormModel;ru:boolean;pageUrl:string;capture:()=>void;capturing:boolean;screenshot:boolean;onClose:()=>void}) {
  return <form onSubmit={e=>{e.preventDefault();if(!capturing)void m.submit(pageUrl);}} className={css.form}
    onDragOver={e=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();e.dataTransfer.dropEffect='copy';}}}
    onDrop={e=>{if(e.dataTransfer.files.length){e.preventDefault();m.add(Array.from(e.dataTransfer.files));}}}
    onPasteCapture={e=>{if(e.clipboardData.files.length){e.preventDefault();e.stopPropagation();m.add(Array.from(e.clipboardData.files));}}}>
    <fieldset ref={element=>{if(element)element.inert=m.busy;}} disabled={m.busy} className={css.fields}>
      <div className={css.kinds} role="group" aria-label={ru?'Тип обращения':'Request type'}>
        {([['question',CircleHelp,ru?'Вопрос':'Question'],['bug',Bug,ru?'Баг':'Bug'],['improvement',Lightbulb,ru?'Улучшение':'Improvement']] as const).map(([kind,Icon,label])=>
          <button type="button" key={kind} aria-pressed={m.kind===kind} onClick={()=>m.setKind(kind)}><Icon size={19}/>{label}</button>)}
      </div>
      <label className={css.row}><span>{ru?'О чём обращение':'Topic'}</span><select value={m.topic} onChange={e=>m.setTopic(e.target.value as typeof m.topic)}>
        {topics.map(([id,rus,en])=><option key={id} value={id}>{ru?rus:en}</option>)}</select></label>
      <label className={css.row}><span>{ru?'Ссылка на страницу':'Page URL'}</span><input readOnly value={pageUrl}/></label>
      <input className={css.subject} aria-label={ru?'Тема обращения':'Subject'} placeholder={ru?'Тема обращения':'Subject'} value={m.subject} minLength={3} maxLength={250} required onChange={e=>m.setSubject(e.target.value)}/>
      <div className={css.editor}>
        <MarkdownField value={m.description} onChange={m.setDescription} label={ru?'Описание обращения':'Request description'} appearance="plain" allowAttachments={false}/>
        <div className={css.editorFooter}>
          <MarkdownAttachmentButton locale={ru?'ru':'en'} disabled={m.busy} onFiles={m.add}/><span className={css.separator} aria-hidden="true"/>
          <button type="button" disabled={capturing||screenshot||m.busy} onClick={capture} className={css.capture} title={ru?'Текущий экран без окна обращения':'Current screen without this dialog'}>
            {screenshot?<Check size={16}/>:<Camera size={16}/>}<span>{capturing?(ru?'Создаём снимок…':'Capturing…'):screenshot?(ru?'Скриншот добавлен':'Screenshot attached'):(ru?'Добавить скриншот':'Add screenshot')}</span>
          </button><small>{ru?'Вставьте или перетащите файл':'Paste or drop a file'}</small>
        </div>
      </div>
      <SupportFiles files={m.files} remove={m.remove} busy={m.busy} ru={ru}/>
    </fieldset>
    {m.description.length>30000&&<p className={css.error} role="alert">{ru?'Описание должно быть не длиннее 30 000 символов.':'Description must be at most 30,000 characters.'}</p>}
    {m.error&&<p className={css.error} role="alert">{m.error}</p>}
    {m.busy&&<div className={css.progress} role="status"><span>{m.progress<1?(ru?'Загружаем вложения':'Uploading attachments'):(ru?'Отправляем обращение':'Submitting request')}</span><progress max={1} value={m.progress}/></div>}
    <footer className={css.actions}><button type="button" disabled={m.busy} onClick={onClose}>{ru?'Закрыть':'Close'}</button>
      <button type="submit" className={css.primary} disabled={m.busy||capturing||m.subject.trim().length<3||m.description.trim().length<3||m.description.length>30000}><Send size={16}/>{ru?'Создать обращение':'Send request'}</button></footer>
  </form>;
}
