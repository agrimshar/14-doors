/* ---------- post: the house seen through whatever is in your blood ---------- */
const WORLDS = FRAG_MAIN.slice(FRAG_MAIN.indexOf('float hash'), FRAG_MAIN.indexOf('void main()'));
const POST_VERT = `in vec3 position;
void main(){ gl_Position=vec4(position.xy,0.,1.); }`;
const POST_FRAG = `precision highp float;
precision highp int;
out vec4 o;
uniform sampler2D uScene,uPrev;
uniform vec2 uRes,uPlayer;
uniform float uT,uG,uK,uBeat,uAuxA,uAuxB,uDawn,uSky,uMixB;
uniform int uMA,uMB,uShardN;
uniform vec3 uShard[5];
uniform float uCA,uSat,uVig,uWob,uScan,uDbl,uBloom,uBlack,uFlash,uGrain,uKal,uTrail,uPix,uZoom,uRed;
${WORLDS}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  float asp=uRes.x/uRes.y;
  vec2 p=uv*2.-1.; p.x*=asp;
  vec2 q=p+uWob*.035*vec2(sin(p.y*3.+uG*1.3),cos(p.x*2.5+uG*1.1));
  q*=1.-uZoom*.06*(.5+.5*sin(uG*1.7));
  if(uKal>.001){
    float a=atan(q.y,q.x),r=length(q),seg=6.28318/6.;
    float af=abs(mod(a+uG*.05,seg)-seg*.5)+1.5708-seg*.25;
    q=mix(q,r*vec2(cos(af),sin(af)),uKal);
  }
  vec2 suv=vec2(q.x/asp,q.y)*.5+.5;
  if(uPix>.001){ vec2 g=uRes/mix(1.,7.,uPix); suv=(floor(suv*g)+.5)/g; }
  vec2 ca=(suv-.5)*uCA+vec2(uDbl,0.);
  vec3 sc=vec3(texture(uScene,suv+ca).r,texture(uScene,suv).g,texture(uScene,suv-ca).b);
  vec3 bl=textureLod(uScene,suv,3.).rgb*.5+textureLod(uScene,suv,5.).rgb*.5;
  sc+=max(bl-.22,0.)*uBloom;
  vec3 col=sc;
  if(uK>.002){
    vec3 a=world(uMA,q,uT,uAuxA);
    if(uMB>=0){
      vec3 b=world(uMB,q,uT,uAuxB);
      float m=smoothstep(.36,.64,fbm(q*1.3+vec2(uG*.12,-uG*.09))+.14*sin(uG*.3));
      a=mix(a,b,m*uMixB);
    }
    float l=dot(sc,vec3(.3,.6,.1));
    col=mix(sc,sc*(.4+1.5*a)+a*(.1+.55*l),uK);
  }
  if(uSky>.002) col=mix(col,wSky(p,uG,uDawn),uSky);
  float lum=dot(col,vec3(.299,.587,.114));
  col=mix(vec3(lum),col,uSat);
  col=mix(col,vec3(1.,.12,.1)*(lum+.25),uRed);
  col*=1.-uVig*smoothstep(.35,1.3,length(p-uPlayer));
  col*=1.-uScan*.3*(.5+.5*sin(gl_FragCoord.y*2.2));
  col+=(hash(gl_FragCoord.xy+fract(uG)*91.)-.5)*uGrain;
  col=mix(col,vec3(0.),uBlack)+uFlash;
  col=1.-exp(-max(col,0.)*1.4);
  col=max(col,texture(uPrev,uv).rgb*uTrail-.006);
  o=vec4(col,1.);
}`;
const COPY_FRAG = `precision highp float;
out vec4 o;
uniform sampler2D uTex; uniform vec2 uRes;
void main(){ o=vec4(texture(uTex,gl_FragCoord.xy/uRes).rgb,1.); }`;
