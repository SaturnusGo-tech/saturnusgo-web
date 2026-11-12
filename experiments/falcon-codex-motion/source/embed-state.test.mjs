import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyEmbedUpdate, isTrustedEmbedMessage, advanceEmbedTime} from './embed-state.mjs';
const initial = {theme:'dark',locale:'en',active:false,reducedMotion:false,restart:0};
test('only the same-origin parent can control playback',()=>{
 const parent={}; const data={type:'falcon-film:update',active:true};
 assert.equal(isTrustedEmbedMessage({source:parent,origin:'https://falcon.test',data},parent,'https://falcon.test'),true);
 assert.equal(isTrustedEmbedMessage({source:{},origin:'https://falcon.test',data},parent,'https://falcon.test'),false);
 assert.equal(isTrustedEmbedMessage({source:parent,origin:'https://other.test',data},parent,'https://falcon.test'),false);
 assert.equal(isTrustedEmbedMessage({source:parent,origin:'https://falcon.test',data:null},parent,'https://falcon.test'),false);
});
test('theme and locale preserve restart state and playback intent',()=>{
 const playing={...initial,active:true,restart:3};
 assert.deepEqual(applyEmbedUpdate(playing,{theme:'light',locale:'ru'}),{...playing,theme:'light',locale:'ru'});
 assert.deepEqual(applyEmbedUpdate(playing,{active:true}),playing);
 assert.equal(applyEmbedUpdate(playing,{restart:true}).restart,4);
});
test('malformed controls cannot activate the timeline or mutate theme',()=>{
 assert.deepEqual(applyEmbedUpdate(initial,{theme:'pink',locale:'xx',active:'true',reducedMotion:1,restart:'true'}),initial);
});
test('end of playback holds a fully visible final frame',()=>{
 assert.equal(advanceEmbedTime(30,10,31),30.35);
 assert.equal(advanceEmbedTime(5,-2,31),5);
 assert.equal(advanceEmbedTime(2,.125,31),2.125);
});
