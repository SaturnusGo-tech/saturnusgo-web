import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { components } from "../../../../core/tms/generated/tms-api";
import type { SupportFile, SupportInput } from "../domain/support";
type Schemas = components["schemas"];
function upload(url: string, headers: Record<string,string>, file: File, progress: (value:number)=>void) {
  return new Promise<void>((resolve,reject)=>{
    const xhr = new XMLHttpRequest(); xhr.open("PUT",url); xhr.timeout=120000;
    for(const [key,value] of Object.entries(headers)) xhr.setRequestHeader(key,value);
    xhr.upload.onprogress=event=>{if(event.lengthComputable) progress(event.loaded/event.total);};
    xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error("UPLOAD_FAILED"));
    xhr.onerror=xhr.ontimeout=()=>reject(new Error("UPLOAD_FAILED"));xhr.send(file);
  });
}
export function supportClient(http:TmsHttpClient,workspaceId:string) {
  const path=(suffix="")=>`/support/requests${suffix}?${new URLSearchParams({workspaceId})}`;
  return {
    async send(id:string,input:SupportInput,files:SupportFile[],progress:(value:number)=>void) {
      const receipt=(await http.mutateResource<Schemas["SupportReceiptResponse"]>(path(),"POST",input,{idempotencyKey:id})).data.data;
      if(receipt.state==="expired") throw new Error("DRAFT_EXPIRED");
      if(receipt.state!=="draft") return receipt;
      let issued=Date.now();
      let grants=(await http.mutate<Schemas["SupportUploadResponse"]>(path(`/${id}/uploads`),"POST")).data.files;
      for(let index=0;index<files.length;index++) {
        if(Date.now()-issued>120000){grants=(await http.mutate<Schemas["SupportUploadResponse"]>(path(`/${id}/uploads`),"POST")).data.files;issued=Date.now();}
        const entry=files[index]; const grant=grants.find(g=>g.id===entry.id);
        if(!grant) throw new Error("UPLOAD_FAILED");
        await upload(grant.url,grant.headers,entry.file,n=>progress((index+n)/Math.max(files.length,1)));
      }
      progress(1);
      return (await http.mutate<Schemas["SupportReceiptResponse"]>(path(`/${id}/submit`),"POST")).data;
    },
  };
}
