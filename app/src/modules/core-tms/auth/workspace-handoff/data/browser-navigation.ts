import type { WorkspaceHandoffNavigation } from "../domain/handoff-port";
export function navigateWorkspaceHandoff(destination:WorkspaceHandoffNavigation) {
  if(destination.kind==="desktop"){window.location.assign(destination.url);return;}
  const source=new URL(destination.action);
  if(source.origin!==window.location.origin||source.pathname!=="/api/v1/auth/workspace-handoffs"||source.search||source.hash)throw new Error("Invalid handoff form");
  const form=document.createElement("form");form.method="post";form.action=source.href;form.hidden=true;
  for(const [name,value] of Object.entries(destination.fields)){const input=document.createElement("input");input.type="hidden";input.name=name;input.value=value;form.append(input);}
  document.body.append(form);
  try{form.submit();}finally{form.remove();}
}
