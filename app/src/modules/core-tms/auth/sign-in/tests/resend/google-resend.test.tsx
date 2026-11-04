import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { useSignIn } from "../../application/useSignIn";
import { createSignInClient } from "../../data/sign-in-client";
import type { EmailChallenge } from "../../domain/sign-in";

void test("Google callback resend preserves its challenge and uses the cookie-bound endpoint",async t=>{
 let clock=Date.now();t.mock.method(Date,"now",()=>clock);
 const calls:{url:string;init:RequestInit}[]=[];
 const challenge:EmailChallenge={challengeId:"e137354d-a6a3-4aef-80a1-c88485bfb111",expiresAt:new Date(clock+600_000).toISOString(),retryAfterSeconds:60};
 const client=createSignInClient(async(input,init={})=>{
  const url=String(input);calls.push({url,init});
  return Response.json({data:url.endsWith("/methods")?{email:true,google:true,saml:false,signup:true}:challenge});
 });
 const proof={email:"google@example.test",challenge};let current!:ReturnType<typeof useSignIn>;
 function Probe(){current=useSignIn(client,"signup",proof);return null;}
 let view!:ReturnType<typeof create>;
 await act(async()=>{view=create(<Probe/>);});
 await act(async()=>{await current.resend();});
 assert.equal(calls.length,1,"resend observes the existing retry delay");
 clock+=60_000;await act(async()=>{await current.resend();});
 assert.equal(calls[1]?.url,"/api/v1/auth/email/resend");
 assert.equal(calls[1]?.init.body,JSON.stringify({challengeId:challenge.challengeId}));
 assert.equal(calls[1]?.init.credentials,"include");assert.equal(calls[1]?.init.redirect,"error");
 assert.equal(calls[1]?.init.cache,"no-store");assert.equal(current.state.challenge?.challengeId,challenge.challengeId);
 await act(async()=>view.unmount());
});
