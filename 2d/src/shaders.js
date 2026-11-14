/* ---------- shaders: one world per door ---------- */
const VERT = `#version 300 es
in vec2 aP; out vec2 vUv;
void main(){ vUv=aP*.5+.5; gl_Position=vec4(aP,0.,1.); }`;

const FRAG_FB = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uPrev,uSpr;
uniform float uDecay,uZoom,uRot,uFlow,uT,uAsp;
uniform vec2 uDrift;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
void main(){
  vec2 c=vUv-.5; c.x*=uAsp;
  float cs=cos(uRot),sn=sin(uRot);
  c=mat2(cs,-sn,sn,cs)*c*(1.-uZoom);
  c+=(vec2(noise(c*5.+uT*.3),noise(c*5.+7.3-uT*.25))-.5)*uFlow;
  c.x/=uAsp;
  vec3 prev=texture(uPrev,c+.5-uDrift).rgb*uDecay;
  prev=max(prev-.004,0.);
  vec3 s=texture(uSpr,vUv).rgb;
  o=vec4(max(prev,s),1.);
}`;

const FRAG_MAIN = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uFb;
uniform vec2 uRes,uPlayer,uVc;
uniform float uT,uG,uK,uBeat,uAuxA,uAuxB,uDawn;
uniform int uMA,uMB,uShardN;
uniform vec3 uShard[5];
uniform float uCA,uSat,uVig,uWob,uScan,uDbl,uBloom,uBlack,uFlash,uGrain;

float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return s; }
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
vec3 pal(float t,vec3 a,vec3 b,vec3 c,vec3 d){ return a+b*cos(6.28318*(c*t+d)); }

/* 0 MDMA: the warm room */
vec3 wMd(vec2 p,float t){
  vec2 q=p+.3*(vec2(fbm(p*1.2+t*.15),fbm(p*1.2-t*.12+7.))-.5);
  float f=fbm(q*1.6+vec2(0.,t*.1));
  vec3 c=mix(vec3(.22,0.,.2),vec3(1.,.14,.56),smoothstep(.25,.72,f));
  c=mix(c,vec3(1.,.78,.28),smoothstep(.58,.95,f+.18*uBeat));
  for(int i=0;i<3;i++){
    float fi=float(i);
    vec2 g=p*(1.4+fi*.9)+vec2(t*.05*(fi+1.),fi*3.1);
    vec2 id=floor(g),f2=fract(g)-.5;
    float h=hash(id+fi*17.);
    vec2 off=(vec2(hash(id+1.3),hash(id+2.7))-.5)*.5;
    float r=.12+.2*h,d=length(f2-off);
    float b=smoothstep(r,r*.8,d)*(.35+.65*smoothstep(r*.5,r,d));
    c+=b*mix(vec3(1.,.3,.6),vec3(1.,.8,.4),h)*(.1+.2*uBeat)*step(.45,h);
  }
  float d=length(p-uPlayer);
  c+=exp(-pow((d-(1.-uBeat)*1.7)*5.,2.))*uBeat*vec3(1.,.6,.7)*.45;
  c+=.3*exp(-d*d*3.)*vec3(1.,.5,.45);
  return c;
}
/* 1 Psychedelics: the garden */
vec3 wPs(vec2 p,float t){
  float r=length(p),a=atan(p.y,p.x);
  float seg=6.28318/6.;
  a=abs(mod(a+t*.05,seg)-seg*.5);
  vec2 q=r*vec2(cos(a),sin(a))*(1.+.12*sin(t*.6));
  vec2 w=q*2.2;
  w+=.7*vec2(fbm(w+t*.2),fbm(w+5.2-t*.17));
  float f=fbm(w*1.5);
  float veins=smoothstep(0.,.9,abs(sin(18.*f-6.*r+t*1.5)));
  vec3 c=pal(f*1.6+r*.5-t*.12,vec3(.55,.5,.55),vec3(.5,.5,.45),vec3(1.),vec3(0.,.33,.67));
  c*=.22+.95*veins;
  c+=pow(1.-veins,6.)*vec3(1.,.95,.8)*.6;
  return c;
}
/* 2 Cannabis: the slow green */
vec3 wCn(vec2 p,float t){
  t*=.35; vec2 q=p*1.1;
  vec2 w=vec2(fbm(q+vec2(0.,t)),fbm(q+vec2(5.2,-t*.8)));
  vec2 w2=vec2(fbm(q+3.*w+vec2(1.7,9.2)+t*.3),fbm(q+3.*w+vec2(8.3,2.8)-t*.25));
  float f=fbm(q+3.*w2);
  vec3 c=mix(vec3(.01,.06,.04),vec3(.06,.5,.24),smoothstep(.2,.7,f));
  c=mix(c,vec3(.95,.72,.22),smoothstep(.5,.95,length(w2))*f*1.5);
  c=mix(c,vec3(.3,.08,.45),smoothstep(.6,.2,f)*.7*w.x);
  return c*1.2;
}
/* 3 Alcohol: last call */
vec3 wAl(vec2 p,float t){
  p.x+=.1*sin(p.y*2.+t*.9); p.y+=.05*sin(p.x*3.-t*.7);
  float f=fbm(vec2(p.x*1.5,p.y*.8-t*.12)+fbm(p*2.+t*.1));
  vec3 c=mix(vec3(.1,.01,.05),vec3(.4,.04,.17),smoothstep(-.9,.9,p.y+f*.5));
  for(int i=0;i<2;i++){
    float fi=float(i);
    vec2 g=p*(1.6+fi)+vec2(fi*5.,t*.03);
    vec2 id=floor(g),f2=fract(g)-.5;
    float h=hash(id+fi*7.),d=length(f2-(vec2(hash(id+3.),hash(id+5.))-.5)*.5);
    c+=step(.55,h)*smoothstep(.2,.15,d)*mix(vec3(1.,.15,.2),vec3(.2,.5,1.),step(.8,h))*.16*smoothstep(-.2,.6,p.y);
  }
  float lvl=.14*sin(p.x*1.8+t*.8)+.05*sin(p.x*4.3-t*1.3)+.22*sin(t*.5)-.1;
  float liq=smoothstep(.015,-.015,p.y-lvl);
  vec3 amber=mix(vec3(.42,.13,.02),vec3(1.,.6,.12),clamp(f+.35*(p.y-lvl+1.2),0.,1.));
  c=mix(c,amber,liq*.92);
  c+=exp(-abs(p.y-lvl)*45.)*vec3(1.,.85,.5)*.8;
  for(int i=0;i<2;i++){
    float fi=float(i);
    vec2 g=vec2(p.x*(5.+fi*3.),p.y*(5.+fi*3.)-t*(.6+fi*.4));
    vec2 id=floor(g),f2=fract(g)-.5;
    float h=hash(id+fi*9.),rr=.08+.2*h;
    float d=length(f2-(vec2(hash(id+3.1),hash(id+7.7))-.5)*.5);
    c+=liq*step(.6,h)*smoothstep(.035,0.,abs(d-rr))*vec3(1.,.85,.55)*.5;
  }
  return c;
}
/* 4 Ketamine: the corridor */
vec3 wKt(vec2 p,float t){
  t=floor(t*9.)/9.;
  p*=rot(.18*sin(t*.2));
  float y=abs(p.y)+.07,z=1./y;
  vec2 g=vec2(p.x*z,z+t*1.1);
  vec2 gl=abs(fract(g)-.5);
  float w=max(fwidth(g.x),fwidth(g.y))*1.2+.02;
  float line=1.-smoothstep(0.,w,min(gl.x,gl.y));
  float fog=exp(-z*.2);
  vec3 c=vec3(.005,.035,.05)+line*fog*vec3(.45,.95,.92);
  c+=(1.-fog)*vec3(.5,.85,.85)*.3*smoothstep(.45,0.,abs(p.y));
  float r=length(p);
  c=mix(c,vec3(0.),smoothstep(.24,.2,r));
  c+=exp(-abs(r-.22)*34.)*vec3(.85,1.,1.);
  c+=exp(-r*3.)*vec3(.1,.3,.3)*step(.22,r);
  return c;
}
/* 5 Caffeine: nine a.m. */
vec3 wCf(vec2 p,float t){
  float r=length(p),a=atan(p.y,p.x);
  float rays=pow(.5+.5*sin(a*18.+t*.5),6.);
  vec3 tb=mix(vec3(.13,.06,.01),vec3(1.,.82,.02),rays*.9);
  tb*=1.-.4*smoothstep(1.,2.,r);
  float jit=sin(t*43.)*.004;
  float rip=.5+.5*sin((r+jit)*72.-t*11.);
  vec3 cof=mix(vec3(.09,.04,.01),vec3(.36,.17,.05),rip*smoothstep(.75,0.,r)*.8+.1);
  float sw=fbm(vec2(a*2.+t*.5,r*6.-t*.3)+p*2.);
  cof=mix(cof,vec3(.95,.8,.55),smoothstep(.62,.85,sw)*.45);
  vec3 c=mix(cof,vec3(1.,.96,.86),smoothstep(.735,.755,r));
  c=mix(c,tb,smoothstep(.83,.85,r));
  c*=1.-.5*exp(-max(r-.85,0.)*9.)*step(.85,r);
  return c;
}
/* 6 Nicotine: the ember */
vec3 wNc(vec2 p,float t,float e){
  vec2 q=p; q.y-=t*.12; q.x+=.3*sin(p.y*1.5+t*.3);
  float f=fbm(q*1.8+1.5*vec2(fbm(q*1.2+t*.1),fbm(q*1.2+4.)));
  float fil=pow(1.-abs(f*2.-1.),7.);
  vec3 c=vec3(.02,.025,.035)+fil*vec3(.4,.48,.6)*.9+f*f*vec3(.08,.1,.14);
  float d=length(p-uPlayer);
  c+=e*exp(-d*d*5.)*vec3(1.,.36,.05)*1.2;
  c+=e*fil*exp(-d*1.8)*vec3(1.,.45,.1)*.9;
  return c;
}
/* 7 Cocaine: the mirror */
vec3 wCo(vec2 p,float t){
  vec2 g=rot(.3)*p*3.;
  vec2 id=floor(g),f=fract(g);
  float md=8.,md2=8.; vec2 mid=vec2(0.);
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
    vec2 of=vec2(float(x),float(y));
    vec2 h=vec2(hash(id+of),hash(id+of+31.7));
    h=.5+.45*sin(t*.6+6.28318*h);
    float d=length(of+h-f);
    if(d<md){ md2=md; md=d; mid=id+of; } else if(d<md2){ md2=d; }
  }
  float edge=smoothstep(0.,.05,md2-md);
  float fac=hash(mid);
  float fl=pow(.5+.5*sin(t*(1.5+fac*5.)+fac*40.),14.);
  vec3 c=mix(vec3(.01,.02,.04),vec3(.5,.78,.95),fac*fac*.4)+fl*vec3(.9);
  c=c*edge+(1.-edge)*vec3(.9,.97,1.);
  float a=atan(p.y,p.x),r=length(p);
  float sl=pow(hash(vec2(floor(a*40.),3.)),9.);
  c+=sl*smoothstep(.2,1.4,r)*(.5+.5*sin(r*12.-t*30.+a*5.))*vec3(.8,.95,1.);
  return c;
}
/* 8 Adderall: the grid */
vec3 wAd(vec2 p,float t){
  vec2 g=p*8.;
  vec2 f=abs(fract(g)-.5);
  float line=1.-smoothstep(0.,.04,min(f.x,f.y));
  float dotp=smoothstep(.1,.05,length(f));
  vec2 id=floor(g+.5),lc=abs(fract(g+.5)-.5);
  float cell=step(.86,hash(id+floor(t*.7)))*smoothstep(.42,.34,max(lc.x,lc.y));
  vec3 c=vec3(.005,.015,.08)+line*vec3(.1,.25,1.)*.7+dotp*vec3(.4,.6,1.)+cell*vec3(1.,.48,.08)*.3;
  float d=length(p-uPlayer);
  c*=.1+1.7*exp(-d*d*2.2);
  return c;
}
/* 9 Dexedrine: the thread */
vec3 wDx(vec2 p,float t,float s){
  float th=.30*sin(p.x*1.3+t*.8)+.13*sin(p.x*3.1-t*1.3);
  vec3 c=vec3(.03,.025,.03);
  for(int i=0;i<9;i++){
    float fi=float(i)-4.;
    float d=abs(p.y-th-fi*.2*(1.+.15*sin(p.x*.8+t*.3)));
    float m=(i==4)?1.+1.5*s:.2;
    c+=m*vec3(1.,.2,.14)*(.005/(d+.005));
    c+=m*vec3(1.,.92,.85)*smoothstep(.007,0.,d);
  }
  return c;
}
/* 10 Xanax: the quiet */
vec3 wXn(vec2 p,float t){
  t*=.2;
  float f=fbm(p*.7+vec2(t,-t*.6)),g=fbm(p*.5-vec2(t*.7,t*.3)+4.);
  vec3 c=mix(vec3(.55,.52,.95),vec3(1.,.78,.72),smoothstep(.3,.7,f));
  c=mix(c,vec3(.7,.84,.95),smoothstep(.4,.8,g)*.7);
  return c*(.38+.3*f);
}
/* 11 2C-B: neon geometry */
vec3 wCb(vec2 p,float t){
  p*=rot(t*.05); vec2 g=p*3.6;
  vec2 s=vec2(1.,1.7320508);
  vec2 a=mod(g,s)-s*.5,b=mod(g-s*.5,s)-s*.5;
  vec2 h=dot(a,a)<dot(b,b)?a:b; vec2 id=g-h;
  float hd=max(dot(abs(h),s*.5),abs(h.x));
  float hh=hash(id);
  float rings=sin(hd*40.-t*4.+hh*6.28318);
  float edge=smoothstep(.5,.46,hd);
  float sel=fract(hh*3.+t*.08);
  vec3 col=sel<.333?vec3(1.,0.,.78):(sel<.666?vec3(.78,1.,0.):vec3(0.,.95,1.));
  vec3 c=col*smoothstep(-.1,.1,rings)*.6*edge+(1.-edge)*vec3(1.);
  c*=.55+.45*sin(length(p)*5.-t*2.);
  return c;
}
/* 12 4-MMC: the wave */
vec3 wMm(vec2 p,float t,float w){
  float d1=length(p-vec2(-.9,0.)),d2=length(p-vec2(.9,0.));
  float iw=sin(d1*26.-t*9.)+sin(d2*26.-t*9.);
  float band=smoothstep(0.,.25,abs(iw)-.6);
  vec3 c=mix(vec3(0.,.9,1.),vec3(.5,.15,1.),.5+.5*sin(p.x*2.+t*.7))*(1.-band)*.85;
  float fx=(w*2.2-1.1)*uRes.x/uRes.y;
  c+=exp(-pow((p.x-fx)*2.5,2.))*vec3(.8,1.,1.)*1.2;
  c+=vec3(.02,0.,.09);
  return c*(.75+.45*uBeat);
}
/* 13 DMT: the breakthrough */
vec3 wDm(vec2 p,float t){
  float r=length(p)+1e-4,a=atan(p.y,p.x);
  float z=log(r)*1.6-t*1.4;
  float n=8.;
  vec2 g=vec2(a*n/6.28318+sin(z*2.)*.5,z*2.);
  vec2 f=fract(g)-.5,id=floor(g);
  float pet=length(f*vec2(1.,1.3));
  float h=hash(vec2(mod(id.x,n),id.y));
  vec3 c=pal(h+z*.15+t*.2,vec3(.5),vec3(.5),vec3(1.,1.,.9),vec3(0.,.15,.55));
  c=pow(c,vec3(1.5))*smoothstep(.5,.2,pet)*1.4;
  c+=smoothstep(.06,0.,abs(pet-.38))*vec3(1.,.88,.55);
  c*=.6+.4*sin(z*6.+a*n);
  return mix(c,vec3(1.),exp(-r*r*12.));
}
vec3 world(int m,vec2 p,float t,float aux){
  if(m==0)return wMd(p,t);
  if(m==1)return wPs(p,t);
  if(m==2)return wCn(p,t);
  if(m==3)return wAl(p,t);
  if(m==4)return wKt(p,t);
  if(m==5)return wCf(p,t);
  if(m==6)return wNc(p,t,aux);
  if(m==7)return wCo(p,t);
  if(m==8)return wAd(p,t);
  if(m==9)return wDx(p,t,aux);
  if(m==10)return wXn(p,t);
  if(m==11)return wCb(p,t);
  if(m==12)return wMm(p,t,aux);
  return wDm(p,t);
}
/* the night, and the morning made of what you carried */
vec3 skyc(vec2 p,float t,float d){
  vec3 c=mix(vec3(.02,.012,.06),vec3(.08,.03,.17),smoothstep(.9,-.5,p.y));
  vec2 g=p*14.; vec2 id=floor(g),f=fract(g)-.5; float h=hash(id);
  float st=smoothstep(.09*h,0.,length(f-(vec2(hash(id+1.),hash(id+2.))-.5)*.7))*step(.72,h);
  c+=st*(.5+.5*sin(t*(1.+h*3.)+h*30.))*(1.-d)*vec3(.9,.9,1.);
  for(int i=0;i<5;i++){
    if(i>=uShardN)break;
    float fi=float(i);
    float w=fbm(vec2(p.x*1.1+fi*3.7+t*.05,t*.04+fi));
    float ya=.2+fi*.15+.3*(w-.5);
    float aur=exp(-pow((p.y-ya)*6.,2.))*(.35+.65*fbm(vec2(p.x*6.+fi*9.,t*.3)))*(1.-d)*.6;
    c+=uShard[i]*aur;
    float on=smoothstep(fi*.12,fi*.12+.3,d);
    float yb=-.3+(fi+.6)*.25;
    float band=exp(-pow((p.y-yb-.06*sin(p.x*1.4+t*.15+fi*2.))*3.2,2.))*on;
    c=mix(c,uShard[i],band*.85);
  }
  float rise=smoothstep(.5,1.,d);
  vec2 sp=vec2(0.,-.62+.62*rise);
  float sd=length(p-sp);
  c+=exp(-sd*2.)*vec3(1.,.72,.45)*rise*1.2;
  float a=atan(p.y-sp.y,p.x-sp.x);
  c+=pow(.5+.5*sin(a*12.+t*.15),5.)*exp(-sd*1.1)*vec3(1.,.9,.7)*.35*rise;
  return c+smoothstep(.17,.16,sd)*rise*vec3(2.6,2.4,1.9);
}
vec3 wSky(vec2 p,float t,float d){
  float hz=-.38;
  if(p.y>hz) return skyc(p,t,d)+exp(-abs(p.y-hz)*30.)*vec3(.5,.45,.8)*.22*(1.-d);
  vec2 q=vec2(p.x+.02*sin(p.y*50.+t*1.5)+.01*sin(p.y*120.-t*2.),2.*hz-p.y);
  return skyc(q,t,d)*(.5+.25*d)*(.65+.35*smoothstep(-1.,hz,p.y));
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  float asp=uRes.x/uRes.y;
  vec2 p=uv*2.-1.; p.x*=asp;
  vec2 wp=p+uWob*.05*vec2(sin(p.y*3.+uG*1.3),cos(p.x*2.5+uG*1.1));
  vec3 col=wSky(p,uG,uDawn);
  if(uK>.002){
    vec3 a=world(uMA,wp,uT,uAuxA);
    if(uMB>=0){
      vec3 b=world(uMB,wp,uT,uAuxB);
      float m=smoothstep(.36,.64,fbm(wp*1.3+vec2(uG*.12,-uG*.09))+.14*sin(uG*.3));
      a=mix(a,b,m);
    }
    col=mix(col,a,uK);
  }
  vec2 suv=uv+(wp-p)*vec2(.5/asp,.5);
  vec2 ca=(uv-.5)*uCA+vec2(uDbl,0.);
  vec3 s=vec3(texture(uFb,suv+ca).r,texture(uFb,suv).g,texture(uFb,suv-ca).b);
  vec3 bl=textureLod(uFb,suv,2.5).rgb*.5+textureLod(uFb,suv,4.5).rgb*.45+textureLod(uFb,suv,6.5).rgb*.35;
  col=col*(1.-.55*clamp(max(s.r,max(s.g,s.b)),0.,1.))+s*1.15+bl*uBloom;
  float l=dot(col,vec3(.299,.587,.114));
  col=mix(vec3(l),col,uSat);
  col*=1.-uVig*smoothstep(.35,1.3,length(p-uVc));
  col*=1.-uScan*.3*(.5+.5*sin(gl_FragCoord.y*2.2));
  col+=(hash(gl_FragCoord.xy+fract(uG)*91.)-.5)*uGrain;
  col=mix(col,vec3(0.),uBlack)+uFlash;
  col=1.-exp(-max(col,0.)*1.6);
  o=vec4(col,1.);
}`;
