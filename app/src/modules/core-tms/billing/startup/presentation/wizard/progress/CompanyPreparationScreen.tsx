import {CompanyWizardFrame} from "../frame/CompanyWizardFrame";
import {CompanyProgressStep} from "./CompanyProgressStep";
export function CompanyPreparationScreen({ru,preparing=false,name=""}:{ru:boolean;preparing?:boolean;name?:string}) {
  return <CompanyWizardFrame stage={preparing?"preparing":"opening"} ru={ru} locked onClose={()=>{}}>
    <CompanyProgressStep name={name} ru={ru} kind={preparing?"preparing":"opening"} busy
      notice={preparing?(ru?"Мы отправим письмо, когда адрес компании будет готов. Можно вернуться сюда позже.":"We’ll email you when your company address is ready. You can return here later."):undefined}/>
  </CompanyWizardFrame>;
}
