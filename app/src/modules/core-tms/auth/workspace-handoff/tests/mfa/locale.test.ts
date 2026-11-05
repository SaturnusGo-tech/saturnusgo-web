import assert from "node:assert/strict";
import {test} from "node:test";
import {createSignInClient} from "../../../sign-in/data/sign-in-client";
test("SAML starts with the current selected UI language while retaining the same client owner",async()=>{
 let locale:"ru"|"en"="ru";const bodies:unknown[]=[];
 const send:typeof fetch=async(_input,init)=>{bodies.push(JSON.parse(String(init?.body)));return Response.json({data:{redirectUrl:"https://idp.example/"}});};
 const client=createSignInClient(send,()=>locale);
 await client.startSaml("team",new AbortController().signal);locale="en";await client.startSaml("team",new AbortController().signal);
 assert.deepEqual(bodies,[{organization:"team",locale:"ru"},{organization:"team",locale:"en"}]);
});
