// Media compositions share the editor's Focal headlines, prompt labels and square frames.
export const MEDIA_TEMPLATES = [
  ['compare-side', 'Before / after', 'media'],
  ['compare-stack', 'Stacked comparison', 'media'],
  ['compare-focus', 'Old / new feature', 'media'],
  ['compare-detail', 'Overview / detail', 'media'],
  ['compare-columns', 'Two feature demos', 'media'],
  ['compare-band', 'Comparison strips', 'media'],
  ['feature-hero', 'Feature launch', 'media'],
  ['feature-sidebar', 'Feature notes', 'media'],
  ['feature-steps', 'What changed', 'media'],
  ['feature-spotlight', 'Feature spotlight', 'media'],
  ['feature-release', 'Release update', 'media'],
  ['feature-caption', 'Demo / takeaway', 'media'],
];
export const isComparison = layout => layout.startsWith('compare-') && MEDIA_TEMPLATES.some(([id]) => id === layout);
export const MEDIA_FIELDS = ['mediaFit','mediaZoom','mediaX','mediaY','mediaDim','mediaStart','mediaLoop'];
export function secondaryMediaScene(scene) {
  return {...scene, id:scene.id + ':secondary', mediaId:scene.mediaIdB, mediaFlow:false,
    ...Object.fromEntries(MEDIA_FIELDS.map(key => [key,scene[key+'B'] ?? scene[key]]))};
}
export function resolveSceneAsset(assets, scene) {
  const primary=assets.get(scene.id)||assets.get(scene.mediaId);
  const secondary=assets.get(scene.id+':secondary')||assets.get(scene.mediaIdB);
  return secondary && isComparison(scene.layout) ? {...primary,secondary} : primary;
}
// Relative grid geometry is shared by rendering and layout bounds checks.
export function mediaTemplatePlan(layout,w,h) {
  const k=Math.min(w,h)/720,p=50*k,g=28*k,W=w-2*p,H=h-2*p,vertical=h>w;
  const box=(x,y,ww,hh)=>[p+x*W,p+y*H,ww*W,hh*H];
  let title=box(0,0,1,.2),body=box(0,.9,1,.1),frames=[],labels=[],notes=[];
  const pair=(stacked=false)=>{
    if(stacked||vertical){frames=[box(0,.29,1,.23),box(0,.64,1,.23)];labels=[box(0,.22,1,.06),box(0,.57,1,.06)];}
    else {const cw=(W-g)/2;frames=[[p,p+H*.3,cw,H*.52],[p+cw+g,p+H*.3,cw,H*.52]];labels=[[p,p+H*.22,cw,H*.065],[p+cw+g,p+H*.22,cw,H*.065]];}
  };
  switch(layout) {
    case 'compare-side': pair();break;
    case 'compare-stack': pair(true);break;
    case 'compare-columns':
      pair();if(!vertical){title=box(0,0,.75,.16);frames.forEach(f=>{f[1]=p+H*.28;f[3]=H*.58});}break;
    case 'compare-band':
      pair(true);frames=[box(0,.31,1,.2),box(0,.66,1,.2)];break;
    case 'compare-focus':
      if(vertical)pair(true);else{title=box(0,0,.8,.19);frames=[box(0,.46,.29,.34),box(.35,.29,.65,.51)];labels=[box(0,.37,.29,.07),box(.35,.21,.65,.07)];}break;
    case 'compare-detail':
      if(vertical)pair(true);else{frames=[box(0,.3,.64,.53),box(.7,.45,.3,.38)];labels=[box(0,.22,.64,.06),box(.7,.36,.3,.07)];}break;
    case 'feature-hero':
      title=box(0,0,1,.2);frames=[box(0,.28,1,.56)];break;
    case 'feature-sidebar':
      if(vertical){title=box(0,0,1,.18);frames=[box(0,.25,1,.45)];body=box(0,.77,1,.23);}
      else{title=box(0,.05,.32,.34);body=box(0,.47,.32,.46);frames=[box(.4,0,.6,1)];}break;
    case 'feature-steps':
      title=box(0,0,1,.17);body=null;
      if(vertical){frames=[box(0,.23,1,.4)];notes=[box(0,.7,1,.085),box(0,.805,1,.085),box(0,.91,1,.085)];}
      else{frames=[box(0,.26,.65,.74)];notes=[box(.72,.3,.28,.17),box(.72,.55,.28,.17),box(.72,.8,.28,.17)];}break;
    case 'feature-spotlight':
      title=box(0,0,1,.21);frames=[vertical?box(0,.29,1,.44):box(.18,.28,.64,.55)];body=box(0,.83,1,.17);break;
    case 'feature-release':
      if(vertical){title=box(0,0,1,.2);frames=[box(0,.3,1,.45)];body=box(0,.82,1,.18);}
      else{title=box(0,.02,.4,.39);body=box(.58,.04,.42,.31);frames=[box(0,.44,1,.56)];}break;
    case 'feature-caption':
      frames=[box(0,0,1,.61)];title=box(0,.7,1,.18);body=box(0,.93,1,.07);break;
  }
  return {title,body,frames,labels,notes};
}
export function renderMediaTemplate(ctx,s,t,w,h,asset,helpers) {
  if(!MEDIA_TEMPLATES.some(([id])=>id===s.layout))return false;
  const {headline,drawPrompt,media,reserveGraphic}=helpers,k=Math.min(w,h)/720;
  const plan=mediaTemplatePlan(s.layout,w,h);
  const prompt=(text,rect,size=26,animate=false)=>{
    if(!text||!rect)return;
    let style={...s,tracking:0,promptSize:size,align:'left',promptReveal:animate && s.promptReveal};
    for(let i=0;i<40&&drawPrompt(ctx,style,text,t,0,0,rect[2],k,true)>rect[3];i++)
      style={...style,promptSize:style.promptSize*.93,promptPadding:style.promptPadding*.93,promptGap:style.promptGap*.93};
    drawPrompt(ctx,style,text,t,rect[0],rect[1],rect[2],k);
  };
  plan.frames.forEach((rect,i)=>{
    reserveGraphic?.(rect);
    const mediaScene=i?secondaryMediaScene(s):s;
    media(ctx,{...mediaScene,mediaSlot:i?'secondary':'primary',mediaMotion:s.mediaMotion},i?asset?.secondary:asset,rect);
    prompt(i?s.mediaLabelB:s.mediaLabelA,plan.labels[i]);
  });
  headline(ctx,{...s,fontSize:s.fontSize*.66},t,plan.title,k);
  prompt(s.body,plan.body,26,true);
  const lines=s.body.split('\n').map(x=>x.trim()).filter(Boolean);
  plan.notes.forEach((rect,i)=>prompt(lines[i],rect,30,true));
  return true;
}
