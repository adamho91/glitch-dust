import test from 'node:test';
import assert from 'node:assert/strict';
import {MEDIA_TEMPLATES,mediaTemplatePlan,isComparison,secondaryMediaScene,resolveSceneAsset} from '../video-media-layouts.mjs';
import {FORMATS,createScene,normalizeProject,renderScene,usesMediaFlow,setSceneLayout} from '../video-core.mjs';

test('12 media templates fit every canvas format and keep media apart from headlines',()=>{
 assert.equal(MEDIA_TEMPLATES.length,12);
 for(const [layout] of MEDIA_TEMPLATES)for(const [w,h] of Object.values(FORMATS)){
  const p=mediaTemplatePlan(layout,w,h);
  assert.equal(p.frames.length,isComparison(layout)?2:1);
  for(const r of [p.title,p.body,...p.frames,...p.labels,...p.notes].filter(Boolean)){
   assert.ok(r.every(Number.isFinite));assert.ok(r[0]>=0&&r[1]>=0&&r[2]>0&&r[3]>0);
   assert.ok(r[0]+r[2]<=w+.001&&r[1]+r[3]<=h+.001,layout);
  }
  for(const a of p.frames){const b=p.title;assert.ok(a[0]>=b[0]+b[2]||b[0]>=a[0]+a[2]||a[1]>=b[1]+b[3]||b[1]>=a[1]+a[3],layout);}
 }
});
test('comparison media and labels retain independent settings through save/open',()=>{
 const s=createScene({layout:'compare-side',mediaId:'a',mediaIdB:'b',mediaFit:'contain',mediaFitB:'adapt',mediaZoomB:160,mediaXB:23,mediaYB:72,mediaStartB:8,mediaDimB:32,mediaLoopB:false,mediaLabelA:'Previous',mediaLabelB:'Updated'});
 const saved=normalizeProject(JSON.parse(JSON.stringify({version:1,format:'wide',scenes:[s]}))).scenes[0];
 assert.equal(saved.mediaIdB,'b');assert.equal(saved.mediaLabelB,'Updated');
 const b=secondaryMediaScene(saved);
 assert.equal(b.mediaId,'b');assert.equal(b.mediaZoom,160);assert.equal(b.mediaFit,'adapt');assert.equal(b.mediaX,23);assert.equal(b.mediaY,72);assert.equal(b.mediaStart,8);assert.equal(b.mediaDim,32);assert.equal(b.mediaLoop,false);
 assert.equal(saved.mediaFit,'contain');assert.equal(saved.mediaStart,0);
 assert.equal(usesMediaFlow(s,saved),false);
 const old=createScene();setSceneLayout(old,'compare-side');assert.equal(old.transition,'fade');
});
test('comparisons render the two actual sources and report slot-specific hit bounds',()=>{
 const a={element:{naturalWidth:1600,naturalHeight:900}},b={element:{naturalWidth:900,naturalHeight:1600}};
 for(const [layout] of MEDIA_TEMPLATES.filter(([id])=>isComparison(id))){
  const s=createScene({layout,mediaId:'a',mediaIdB:'b',title:'',body:'',pattern:'none'});
  const draws=[],bounds=[];
  const ctx=new Proxy({measureText:()=>({width:0,actualBoundingBoxAscent:0,actualBoundingBoxDescent:0}),getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),drawImage(el){draws.push(el)}},{get:(target,key)=>key in target?target[key]:()=>{}});
  renderScene(ctx,{...s,onMediaBounds:r=>bounds.push(r)},1,1280,720,resolveSceneAsset(new Map([['a',a],['b',b]]),s));
  assert.deepEqual(draws,[a.element,b.element]);assert.deepEqual(bounds.map(r=>r.slot),['primary','secondary']);
 }
});
test('comparison B can render alone and uses its scene video instance in exports',()=>{
 const s=createScene({layout:'compare-side',mediaIdB:'b'}),source={element:{}},instance={element:{videoWidth:1920}};
 const asset=resolveSceneAsset(new Map([['b',source],[s.id+':secondary',instance]]),s);
 assert.equal(asset.element,undefined);assert.equal(asset.secondary,instance);
 s.layout='feature-hero';assert.equal(resolveSceneAsset(new Map([['b',source]]),s),undefined);
});
