import assert from "node:assert/strict";
import { test } from "node:test";
import { completedStartupCheckout } from "../../domain/completed-startup";
import { result,summary } from "../../../tests/fixtures/billing-fixtures";
const checkout={id:"checkout",workspaceId:"workspace",planId:"startup" as const,status:"completed" as const,provider:"mock" as const,testMode:true as const,createdAt:"2026-11-06T00:00:00Z",expiresAt:"2026-11-06T00:30:00Z",subtotal:5900,currency:"USD" as const,periodEnd:"2026-12-06T00:00:00Z",prorated:false};
test("only confirmed Startup activation in the same workspace enables a domain transition",()=>{
 const paid=result({checkout});assert.equal(completedStartupCheckout(paid,summary,"workspace"),"checkout");
 for(const candidate of [null,result({checkout:{...checkout,status:"open"}}),result({checkout:{...checkout,status:"failed"}}),result({checkout,subscription:null}),result({checkout,subscription:{...paid.subscription!,status:"past_due"}})])assert.equal(completedStartupCheckout(candidate,summary,"workspace"),null);
 assert.equal(completedStartupCheckout(paid,{...summary,workspaceKind:"personal"},"workspace"),null);
 assert.equal(completedStartupCheckout(paid,summary,"other"),null);
});
