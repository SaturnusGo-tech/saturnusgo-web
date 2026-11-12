import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { IntegrationSelect } from "../../../../common/integration-controls/select/IntegrationSelect";
import { IntegrationButton } from "../../../../common/integration-controls/button/IntegrationButton";
import type { YouTrackInboundWorkflow, YouTrackProject, YouTrackRouteDraft } from "../../../../../youtrack/model/youtrack-settings";
import type { HooksCopy } from "../../../shared/hooks-copy";
import surface from "../../../hooks.module.css";
import { updateInbound, routeWithStateField } from "./model/workflow-state";
import { StatusMultiSelect } from "./controls/StatusMultiSelect";
import { OutboundSelect } from "./controls/OutboundSelect";

type OutboundKey = keyof YouTrackRouteDraft["workflow"]["outbound"];
export function RouteWorkflow({ copy, route, project, loading, onUpdate }: {
  copy: HooksCopy; route: YouTrackRouteDraft; project: YouTrackProject | undefined; loading: boolean;
  onUpdate: (updater: (route: YouTrackRouteDraft) => YouTrackRouteDraft) => void;
}) {
  const [advanced, setAdvanced] = useState(false), id = useId();
  const fields = project?.stateFields ?? [], statuses = route.workflow.statuses.filter(status => !status.archived);
  const setInbound = (key: keyof YouTrackInboundWorkflow, values: string[]) => onUpdate(current => updateInbound(current, key, values));
  const label = `${copy.when} ${copy.matcherFields[route.match?.field ?? "component"]} “${route.match?.value || "…"}”`;
  return <section className={surface.workflowRoute}>
    <header><strong>{route.isDefault ? copy.defaultProject : label}</strong><span>{route.project.name} · {route.project.shortName}</span></header>
    {loading ? <p className={surface.projectLoading} role="status">{copy.loadingProject}</p> : <>
      <div className={surface.stateField}><IntegrationSelect label={copy.stateField} value={route.workflow.stateField.id}
        isDisabled={fields.length === 0} placeholder={copy.chooseStateField} options={fields.map(field => ({ value: field.id, label: field.name }))}
        onValueChange={value => { const field = fields.find(item => item.id === value); if (field) onUpdate(current => routeWithStateField(current, field)); }}/></div>
      <div className={surface.primaryMappings}>
        <StatusMultiSelect label={copy.readyStatuses} hint={copy.readyStatusesHint} statuses={statuses} values={route.workflow.inbound.readyForRetest}
          placeholder={copy.chooseStatuses} onChange={values => setInbound("readyForRetest", values)}/>
        <StatusMultiSelect label={copy.acceptedStatuses} hint={copy.acceptedStatusesHint} statuses={statuses} values={route.workflow.inbound.accepted}
          placeholder={copy.chooseStatuses} onChange={values => setInbound("accepted", values)}/>
      </div>
      <div className={surface.advancedMapping}>
        <IntegrationButton variant="light" className={surface.advancedTrigger} aria-expanded={advanced} aria-controls={id} onPress={() => setAdvanced(!advanced)}>
          <span><strong>{copy.advancedMapping}</strong><small>{copy.advancedMappingHint}</small></span><ChevronDown size={16} aria-hidden="true"/>
        </IntegrationButton>
        {advanced && <div className={surface.mappingBody} id={id}>
          <StatusMultiSelect label={copy.inboundGroups.backlog} statuses={statuses} values={route.workflow.inbound.backlog}
            placeholder={copy.chooseStatuses} onChange={values => setInbound("backlog", values)}/>
          <StatusMultiSelect label={copy.inboundGroups.inProgress} statuses={statuses} values={route.workflow.inbound.inProgress}
            placeholder={copy.chooseStatuses} onChange={values => setInbound("inProgress", values)}/>
          {(Object.keys(copy.outboundStates) as OutboundKey[]).map(key => <OutboundSelect key={key} label={copy.outboundStates[key]}
            route={route} state={key} statuses={statuses} empty={copy.notMapped} onUpdate={onUpdate}/>)}
        </div>}
      </div>
    </>}
  </section>;
}
