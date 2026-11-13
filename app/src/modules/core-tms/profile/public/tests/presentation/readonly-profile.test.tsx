import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import { act,create,type ReactTestRenderer } from 'react-test-renderer';
import ts from 'typescript';
import { profileCopy } from '../../../self/presentation/copy/profile-copy';
function load(path:string) {
 const module={exports:{}};
 runInNewContext(ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX}
 }).outputText,{module,exports:module.exports,require(name:string){
  if(name==='react')return React;if(name==='react/jsx-runtime')return jsx;
  if(name==='lucide-react')return {Camera:'svg',Link2:'svg',Mail:'svg',Pencil:'svg',Trash2:'svg'};
  if(name.endsWith('profile-copy'))return {profileCopy};
  if(name.endsWith('CodexMark'))return {CodexMark:()=>React.createElement('span',{'data-codex-mark':true})};
  if(name.endsWith('ProfileEditor'))return {ProfileEditor:()=>React.createElement('form')};
  if(name.endsWith('MarkdownField'))return {MarkdownField:({value}:{value:string})=>React.createElement('p',null,value)};
  if(name.endsWith('.css'))return{default:{}};
  throw new Error(name);
 }});
 return module.exports as {ProfileIdentity:React.ElementType;ProfileAbout:React.ElementType};
}
test('shared profile identity and about render professional data without editing or private controls',async()=>{
 const {ProfileIdentity}=load('../../../self/presentation/identity/ProfileIdentity.tsx');
 const {ProfileAbout}=load('../../../self/presentation/about/ProfileAbout.tsx');
 const profile={id:'member',name:'Member',kind:'human',provider:null,role:'tester',status:'active',introduction:'QA engineer',bio:'Professional bio',avatar:null,banner:null};
 let renderer!:ReactTestRenderer;
 await act(async()=>{renderer=create(<><ProfileIdentity profile={profile} ru={false} readOnly/><ProfileAbout profile={profile} ru={false} readOnly/></>);});
 assert.equal(renderer.root.findAllByType('input').length,0);assert.equal(renderer.root.findAllByType('button').length,0);
 assert.match(JSON.stringify(renderer.toJSON()),/Professional bio/);assert.doesNotMatch(JSON.stringify(renderer.toJSON()),/Edit profile|Introduce yourself/);
 await act(async()=>renderer.update(<ProfileIdentity profile={{...profile,kind:'agent',provider:'codex',name:'Codex'}} ru={false} readOnly/>));
 assert.equal(renderer.root.findAllByProps({'data-codex-mark':true}).length,1);
 await act(async()=>renderer.unmount());
});
