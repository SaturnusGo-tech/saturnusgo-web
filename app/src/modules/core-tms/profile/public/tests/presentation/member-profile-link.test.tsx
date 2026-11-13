import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import { act,create,type ReactTestRenderer } from 'react-test-renderer';
import ts from 'typescript';
import { memberProfileUrl } from '../../../navigation/member-profile-route';
test('hovercard profile link opens the exact workspace identity and preserves native modified clicks',async()=>{
 const visits:string[]=[],module={exports:{}};
 runInNewContext(ts.transpileModule(readFileSync(new URL('../../../presentation/MemberProfileLink.tsx',import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX}
 }).outputText,{module,exports:module.exports,window:{location:{href:'https://falcon.test/work/?workspaceId=team&projectId=project&view=product-docs&docId=doc'}},
 require(name:string){if(name==='react/jsx-runtime')return jsx;if(name.endsWith('member-profile-route'))return{memberProfileUrl};
  if(name.endsWith('workspace-history'))return{visitWorkspace:(url:string)=>visits.push(url)};throw new Error(name);}});
 const {MemberProfileLink}=module.exports as {MemberProfileLink:React.ElementType};let renderer!:ReactTestRenderer;
 await act(async()=>{renderer=create(<MemberProfileLink workspaceId='team' identityId='codex:service'><strong>Codex</strong></MemberProfileLink>);});
 const link=renderer.root.findByType('a');assert.equal(link.props.href,'/work/?workspaceId=team&projectId=project&view=profile&memberId=codex%3Aservice');
 assert.equal(link.findAllByType('button').length,0);
 let prevented=0,stopped=0;
 const event={defaultPrevented:false,button:0,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,preventDefault(){prevented++;},stopPropagation(){stopped++;}};
 act(()=>link.props.onClick({...event,metaKey:true}));assert.equal(visits.length,0);
 act(()=>link.props.onClick(event));assert.deepEqual(visits,[link.props.href]);assert.equal(prevented,1);assert.equal(stopped,1);
 await act(async()=>renderer.unmount());
});
