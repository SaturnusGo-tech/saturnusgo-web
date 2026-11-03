import { test } from "node:test";
import assert from "node:assert/strict";
import React, {useRef,useState} from "react";
import {create,act} from "react-test-renderer";
import {useTextareaEmoji} from "../selection/useTextareaEmoji";
import {useStepHistory} from "../../../cases/inspector/steps/markdown/history/useStepHistory";

test("textarea emoji is one undoable replacement with caret restoration and redo", async () => {
  const original=globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame=(callback)=>{callback(0);return 1;};
  const node={selectionStart:6,selectionEnd:11,isConnected:true,addEventListener(){},removeEventListener(){},focus(){},
    setSelectionRange(start:number,end:number){this.selectionStart=start;this.selectionEnd=end;}};
  let api:any;
  function Harness(){const[value,setValue]=useState("hello world"),input=useRef(node as unknown as HTMLTextAreaElement);
    const history=useStepHistory(value,setValue,input);
    const emoji=useTextareaEmoji(value,input,(next,caret)=>{history.boundary();history.record(next,false,{start:caret,end:caret});},history.boundary);
    api={value,emoji,history};return null;}
  let tree:ReturnType<typeof create>;
  try {
    await act(async()=>{tree=create(<Harness/>);});
    act(()=>api.emoji.remember()); act(()=>api.emoji.insert("👩🏽‍💻"));
    assert.equal(api.value,"hello 👩🏽‍💻"); assert.equal(node.selectionStart,13);
    const key=(shiftKey=false)=>({nativeEvent:{isComposing:false},metaKey:true,ctrlKey:false,altKey:false,key:"z",shiftKey,preventDefault(){},stopPropagation(){}});
    act(()=>api.history.onKeyDown(key())); assert.equal(api.value,"hello world"); assert.equal(node.selectionStart,6);assert.equal(node.selectionEnd,11);
    act(()=>api.history.onKeyDown(key(true))); assert.equal(api.value,"hello 👩🏽‍💻");assert.equal(node.selectionStart,13);
  } finally {act(()=>tree!.unmount());globalThis.requestAnimationFrame=original;}
});
