'use strict';
// Coordinates and viewport are in km, EPSG:3035. No dependence on BW identifiers.
window.PlaceLabels = (() => {
 const NS='http://www.w3.org/2000/svg';
 const canvas=document.createElement('canvas'), ctx=canvas.getContext('2d');
 const overlaps=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
 function layout(cities, origin, view, width, height, measure, reserved=[],font=12,includeAll=false) {
  const scale=Math.min(width/view[2],height/view[3]);
  if(!Number.isFinite(scale)||scale<=0)return [];
  const kmPerPixel=1/scale;
  const minimum=includeAll?0:kmPerPixel>1.2?100000:kmPerPixel>.35?50000:kmPerPixel>.12?10000:kmPerPixel>.05?2500:0;
  const boxes=[...reserved], result=[];
  const left=(width-view[2]*scale)/2, top=(height-view[3]*scale)/2;
  for(const c of cities){
   if(c[4]<minimum)continue;
   const x=c[2]-origin[0],y=origin[1]-c[3];
   if(x<view[0]||y<view[1]||x>view[0]+view[2]||y>view[1]+view[3])continue;
   const px=left+(x-view[0])*scale,py=top+(y-view[1])*scale,w=measure(c[1],font);
   // Keep every visible point and its label together, avoiding labels already placed.
   const candidates=[[7,-4],[7,14],[-w-7,-4],[-w-7,14]];
   for(const [dx,dy] of candidates){
    const box=[Math.min(px-4,px+dx-3),Math.min(py-4,py+dy-font-2),Math.max(px+4,px+dx+w+3),Math.max(py+4,py+dy+4)];
    if(box[0]<left+4||box[1]<top+4||box[2]>width-left-4||box[3]>height-top-4||boxes.some(b=>overlaps(box,b)))continue;
    boxes.push(box);result.push({id:c[0],name:c[1],x,y,dx:dx/scale,dy:dy/scale,font:font/scale,r:2.4/scale,halo:3/scale,box});break;
   }
   if(result.length>=160)break;
  }
  return result;
 }
 function draw(svg,{data,transform,view,enabled,exportSize=null,visibleIds=null}){
  svg.querySelector('[data-layer="cities"]')?.remove();
  if(!enabled||!data?.cities||!transform?.origin)return;
  const rect=exportSize?{width:exportSize[0],height:exportSize[1]}:svg.getBoundingClientRect(), scale=Math.min(rect.width/view[2],rect.height/view[3]);
  const reserved=[];
  for(const el of exportSize?[]:svg.parentElement.querySelectorAll('.map-tools,.map-legend,.map-caption')){
   const r=el.getBoundingClientRect();if(r.width&&r.height)reserved.push([r.left-rect.left,r.top-rect.top,r.right-rect.left,r.bottom-rect.top]);
  }
  for(const el of exportSize?[]:svg.querySelectorAll('.county-label')){
   const r=el.getBoundingClientRect();reserved.push([r.left-rect.left-2,r.top-rect.top-2,r.right-rect.left+2,r.bottom-rect.top+2]);
  }
  const measure=(name,font)=>{ctx.font=`600 ${font}px Arial, sans-serif`;return ctx.measureText(name).width;};
  const candidates=visibleIds?data.cities.filter(c=>visibleIds.has(String(c[0]))):data.cities;
  const labels=layout(candidates,transform.origin,view,rect.width,rect.height,measure,reserved,exportSize?16:12,!!exportSize);
  const g=document.createElementNS(NS,'g');g.setAttribute('data-layer','cities');g.setAttribute('pointer-events','none');
  for(const c of labels){
   const dot=document.createElementNS(NS,'circle');
   for(const [key,value] of Object.entries({cx:c.x,cy:c.y,r:c.r,fill:'#26372f',stroke:'#fff','stroke-width':1/scale}))dot.setAttribute(key,value);
   const text=document.createElementNS(NS,'text');
   for(const [key,value] of Object.entries({x:c.x+c.dx,y:c.y+c.dy,'font-family':'Arial, sans-serif','font-weight':600,'font-size':c.font,fill:'#26372f',stroke:'#fff','stroke-width':c.halo,'stroke-linejoin':'round','paint-order':'stroke','data-place':c.id}))text.setAttribute(key,value);
   text.textContent=c.name;g.append(dot,text);
  }
  svg.append(g);
 }
 return {layout,draw};
})();
