(() => {
"use strict";
const canvas=document.getElementById("scene"),ctx=canvas.getContext("2d");
const $=id=>document.getElementById(id);
const panels=["menu","help","paused","over"];
const assets={};
const names={background:"lava_background.jpg",dragon1:"dragon_01.png",dragon2:"dragon_02.png",dragon3:"dragon_03.png",volcano1:"volcano_01.png",volcano2:"volcano_02.png",volcano3:"volcano_03.png",cloud:"ash_cloud.png",top:"pipe_top.png",bottom:"pipe_bottom.png"};
Object.entries(names).forEach(([key,file])=>{const im=new Image();im.src="assets/"+file;assets[key]=im;});
const sounds={};
for(const s of ["flap","score","hit"]){let a=new Audio("assets/"+s+".wav");a.preload="auto";sounds[s]=a;}
let audioEnabled=true;
function sound(name){if(!audioEnabled)return;try{const a=sounds[name].cloneNode();a.volume=name==="flap"?.28:.45;a.play().catch(()=>{});}catch(e){}}
const WORLD_H=700,GROUND=632,GRAVITY=1180,FLAP=-420;
let W=1000,H=WORLD_H,dpr=1,state="menu",score=0,best=0,dragon={x:260,y:300,vy:0},pipes=[],volcanoes=[],clouds=
(() => {
"use strict";

const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");
const $ = id => document.getElementById(id);

const panels = ["menu", "help", "paused", "over"];
const assets = {};

const names = {
  background: "lava_background.jpg",
  dragon1: "dragon_01.png",
  dragon2: "dragon_02.png",
  dragon3: "dragon_03.png",
  volcano1: "volcano_01.png",
  volcano2: "volcano_02.png",
  volcano3: "volcano_03.png",
  cloud: "ash_cloud.png",
  top: "pipe_top.png",
  bottom: "pipe_bottom.png"
};

Object.entries(names).forEach(([key, file]) => {
  const im = new Image();
  im.src = "assets/" + file;
  assets[key] = im;
});

const sounds = {};

for (const s of ["flap", "score", "hit"]) {
  const a = new Audio("assets/" + s + ".wav");
  a.preload = "auto";
  sounds[s] = a;
}

let audioEnabled = true;

function sound(name) {
  if (!audioEnabled) return;

  try {
    const a = sounds[name].cloneNode();
    a.volume = name === "flap" ? 0.28 : 0.45;
    a.play().catch(() => {});
  } catch (e) {}
}

const WORLD_H = 700;
const GROUND = 632;
const GRAVITY = 1180;
const FLAP = -420;

let W = 1000;
let H = WORLD_H;
let dpr = 1;

let state = "menu";
let score = 0;
let best = 0;

let dragon = { x: 260, y: 300, vy: 0 };
let pipes = [];
let volcanoes = [];
let clouds = [];

let distance = 0;
let nextDistance = 420;
let lastGap = 310;
let elapsed = 0;
let anim = 0;
let worldTime = 0;
let prevTime = 0;

try {
  best = Number(
    localStorage.getItem("flappyDragonBest") || 0
  ) || 0;
} catch (e) {}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

function isMobile() {
  return window.matchMedia(
    "(max-width: 700px), (pointer: coarse)"
  ).matches;
}

function loaded(im) {
  return im && im.complete && im.naturalWidth > 0;
}

function image(im, x, y, w, h) {
  if (loaded(im)) {
    ctx.drawImage(im, x, y, w, h);
  }
}

function cover(im, x, y, w, h) {
  if (!loaded(im)) return;

  const s = Math.max(
    w / im.naturalWidth,
    h / im.naturalHeight
  );

  const dw = im.naturalWidth * s;
  const dh = im.naturalHeight * s;

  ctx.drawImage(
    im,
    x + (w - dw) / 2,
    y + (h - dh) / 2,
    dw,
    dh
  );
}

function resize() {
  const r = canvas.getBoundingClientRect();

  dpr = Math.min(
    2,
    window.devicePixelRatio || 1
  );

  canvas.width = Math.max(
    1,
    Math.round(r.width * dpr)
  );

  canvas.height = Math.max(
    1,
    Math.round(r.height * dpr)
  );

  const oldW = W;

  W = Math.max(
    350,
    WORLD_H * r.width / Math.max(1, r.height)
  );

  if (oldW && oldW !== W) {
    const shift = W - oldW;

    dragon.x = W * 0.29;

    for (const p of pipes) {
      p.x += shift * 0.5;
    }

    for (const v of volcanoes) {
      v.x += shift * 0.5;
    }
  }
}

window.addEventListener("resize", resize);
resize();

function showPanel(name) {
  $("overlay").classList.toggle(
    "hidden",
    name === null
  );

  panels.forEach(p => {
    $(p).classList.toggle("hidden", p !== name);
  });

  $("hud").classList.toggle(
    "hidden",
    state !== "playing" && state !== "paused"
  );

  $("tip").classList.toggle(
    "hidden",
    state !== "playing" ||
    score > 0 ||
    elapsed > 3.5
  );

  $("best").textContent = "BEST " + best;
  $("menu-best").textContent = best;
}

function resetWorld() {
  volcanoes = Array.from(
    {
      length: Math.max(
        3,
        Math.ceil(W / 390) + 1
      )
    },
    (_, i) => ({
      x: i * 390 + rand(-80, 90),
      size: rand(235, 345),
      parallax: rand(0.2, 0.38),
      cooldown: rand(3, 14),
      burst: 0,
      burstAge: 0
    })
  );

  clouds = Array.from(
    {
      length: Math.max(
        3,
        Math.ceil(W / 290) + 1
      )
    },
    (_, i) => ({
      x: i * 290 + rand(-70, 60),
      y: rand(55, 210),
      size: rand(140, 220),
      parallax: rand(0.15, 0.29)
    })
  );
}

resetWorld();

function start() {
  state = "playing";
  score = 0;
  elapsed = 0;
  anim = 0;
  distance = 0;

  nextDistance = rand(370, 470);
  lastGap = GROUND * 0.48;
  pipes = [];

  dragon = {
    x: W * 0.29,
    y: GROUND * 0.45,
    vy: 0
  };

  resetWorld();

  $("score").textContent = "0";
  showPanel(null);
}

function end() {
  if (state !== "playing") return;

  state = "over";
  sound("hit");

  const old = best;

  if (score > best) {
    best = score;

    try {
      localStorage.setItem(
        "flappyDragonBest",
        String(best)
      );
    } catch (e) {}
  }

  $("final-score").textContent = score;
  $("final-best").textContent = best;

  $("new-best").classList.toggle(
    "hidden",
    score <= old || score === 0
  );

  showPanel("over");
}

function pause() {
  if (state === "playing") {
    state = "paused";
    showPanel("paused");
  } else if (state === "paused") {
    state = "playing";
    showPanel(null);
  }
}

function flap() {
  if (state === "menu" || state === "over") {
    start();
  }

  if (state === "playing") {
    dragon.vy = FLAP;
    sound("flap");
  }
}

// MOBILE-SPECIFIC DIFFICULTY
function difficulty() {
  if (isMobile()) {
    return {
      // Starts 36% slower than desktop
      speed: clamp(
        205 + score * 3.5,
        205,
        335
      ),

      // Slightly larger openings
      gap: clamp(
        205 - score * 1.3,
        155,
        205
      )
    };
  }

  // Original desktop difficulty
  return {
    speed: clamp(
      320 + score * 6,
      320,
      495
    ),

    gap: clamp(
      193 - score * 1.6,
      143,
      193
    )
  };
}

function spawn() {
  const { gap } = difficulty();

  const actual = clamp(
    gap + rand(-12, 12),
    140,
    205
  );

  const large = Math.random() < 0.32;

  const shift = large
    ? rand(105, 175) *
      (Math.random() < 0.5 ? -1 : 1)
    : rand(-110, 110);

  lastGap = clamp(
    lastGap + shift,
    actual / 2 + 78,
    GROUND - actual / 2 - 80
  );

  pipes.push({
    x: W + 90,
    w: Math.min(
      108,
      Math.max(76, W * 0.105)
    ),
    gapY: lastGap,
    gap: actual,
    scored: false
  });

  // More consistent spacing on mobile
  nextDistance = isMobile()
    ? rand(300, 390)
    : rand(
        Math.max(270, W * 0.37),
        Math.max(370, W * 0.52)
      );
}

function collision(p) {
  const radius = 21;
  const half = p.gap / 2;

  const top = p.gapY - half;
  const bottom = p.gapY + half;

  const l = p.x + 13;
  const r = p.x + p.w - 13;

  if (
    dragon.x + radius < l ||
    dragon.x - radius > r
  ) {
    return false;
  }

  return (
    dragon.y - radius < top ||
    dragon.y + radius > bottom
  );
}

function update(dt) {
  worldTime += dt;

  if (
    state === "menu" ||
    state === "help" ||
    state === "playing"
  ) {
    const speed =
      state === "playing"
        ? difficulty().speed
        : 100;

    for (const v of volcanoes) {
      v.x -= speed * v.parallax * dt;

      if (v.x + v.size < 0) {
        v.x = W + rand(40, 260);
        v.cooldown = rand(4, 15);
        v.burst = 0;
      }

      if (v.burst > 0) {
        v.burst -= dt;
        v.burstAge += dt;

        if (v.burst <= 0) {
          v.cooldown = rand(5, 16);
        }
      } else {
        v.cooldown -= dt;

        if (v.cooldown <= 0) {
          v.burst = rand(0.7, 1.5);
          v.burstAge = 0;
        }
      }
    }

    for (const c of clouds) {
      c.x -= speed * c.parallax * dt;

      if (c.x + c.size < 0) {
        c.x = W + rand(30, 200);
        c.y = rand(45, 220);
      }
    }
  }

  if (state !== "playing") return;

  elapsed += dt;
  anim += dt;

  dragon.vy = Math.min(
    700,
    dragon.vy + GRAVITY * dt
  );

  dragon.y += dragon.vy * dt;

  const { speed } = difficulty();

  distance += speed * dt;

  if (distance >= nextDistance) {
    distance = 0;
    spawn();
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];

    p.x -= speed * dt;

    if (p.x + p.w < 0) {
      pipes.splice(i, 1);
      continue;
    }

    if (
      !p.scored &&
      p.x + p.w < dragon.x - 14
    ) {
      p.scored = true;
      score++;

      $("score").textContent = score;
      sound("score");
    }

    if (collision(p)) {
      end();
      return;
    }
  }

  if (
    dragon.y - 22 < 0 ||
    dragon.y + 22 > GROUND
  ) {
    end();
  }

  if (elapsed > 3.5) {
    $("tip").classList.add("hidden");
  }
}

function drawVolcano(v) {
  const s = v.size;
  const x = v.x;
  const y = GROUND - s * 0.83 + 14;

  if (v.burst > 0) {
    const frame = Math.min(
      2,
      Math.floor(v.burstAge * 5) % 3
    );

    image(
      assets["volcano" + (frame + 1)],
      x, y, s, s
    );
  } else {
    // Dormant volcano: no eruption plume
    const im = assets.volcano1;

    if (loaded(im)) {
      const cropY = im.naturalHeight * 0.45;
      const cropH = im.naturalHeight - cropY;

      ctx.drawImage(
        im,
        0,
        cropY,
        im.naturalWidth,
        cropH,
        x,
        y + s * 0.45,
        s,
        s * 0.55
      );
    }
  }
}

function drawPillar(p, top) {
  const edge = top
    ? p.gapY - p.gap / 2
    : p.gapY + p.gap / 2;

  const h = top
    ? Math.max(0, edge)
    : Math.max(0, GROUND - edge);

  if (h <= 0) return;

  const x = p.x;
  const w = p.w;
  const y = top ? 0 : edge;

  const cap = Math.min(48, h * 0.32);
  const shaft = Math.max(0, h - cap);

  const im = top ? assets.top : assets.bottom;

  if (!loaded(im)) {
    ctx.fillStyle = "#382630";
    ctx.fillRect(x, y, w, h);
    return;
  }

  const sw = im.naturalWidth;
  const sh = im.naturalHeight;

  // Only gap-facing caps remain visible.
  if (top) {
    if (shaft > 0) {
      ctx.drawImage(
        im,
        0, sh * 0.30,
        sw, sh * 0.43,
        x, y, w, shaft
      );
    }

    ctx.drawImage(
      im,
      0, sh * 0.76,
      sw, sh * 0.24,
      x, y + shaft, w, cap
    );
  } else {
    ctx.drawImage(
      im,
      0, 0,
      sw, sh * 0.23,
      x, y, w, cap
    );

    if (shaft > 0) {
      ctx.drawImage(
        im,
        0, sh * 0.23,
        sw, sh * 0.47,
        x, y + cap, w, shaft
      );
    }
  }
}

function drawDragon() {
  const t =
    state === "playing"
      ? anim
      : worldTime;

  const im = assets[
    "dragon" + (1 + Math.floor(t * 8) % 3)
  ];

  const size = 108;

  ctx.save();

  ctx.translate(
    dragon.x,
    dragon.y +
      (state === "menu"
        ? Math.sin(worldTime * 3) * 6
        : 0)
  );

  const deg =
    state === "playing"
      ? clamp(-dragon.vy * 0.07, -55, 27)
      : Math.sin(worldTime * 2) * 6;

  ctx.rotate(deg * Math.PI / 180);

  image(
    im,
    -size / 2,
    -size / 2,
    size,
    size
  );

  ctx.restore();
}

function draw() {
  ctx.setTransform(
    canvas.width / W,
    0,
    0,
    canvas.height / H,
    0,
    0
  );

  ctx.clearRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(
    0, 0, 0, GROUND
  );

  grad.addColorStop(0, "#3c1429");
  grad.addColorStop(0.65, "#d45d2b");
  grad.addColorStop(1, "#fa9b3e");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  cover(assets.background, 0, 0, W, H);

  for (const c of clouds) {
    ctx.globalAlpha = 0.72;

    image(
      assets.cloud,
      c.x,
      c.y,
      c.size,
      c.size * 0.65
    );

    ctx.globalAlpha = 1;
  }

  for (const v of volcanoes) {
    drawVolcano(v);
  }

  for (const p of pipes) {
    drawPillar(p, true);
    drawPillar(p, false);
  }

  // Lava foreground
  ctx.fillStyle = "#3c1920";
  ctx.fillRect(
    0,
    GROUND,
    W,
    H - GROUND
  );

  const lava = ctx.createLinearGradient(
    0, GROUND, 0, H
  );

  lava.addColorStop(0, "#ffb638");
  lava.addColorStop(0.22, "#ef5a1b");
  lava.addColorStop(1, "#762021");

  ctx.fillStyle = lava;

  ctx.fillRect(
    0,
    GROUND + 6,
    W,
    H - GROUND - 6
  );

  ctx.fillStyle = "#ffd15e";
  ctx.fillRect(0, GROUND, W, 5);

  for (let i = 0; i < Math.ceil(W / 90); i++) {
    const x =
      i * 90 + (worldTime * 20) % 90;

    ctx.fillStyle =
      i % 2 ? "#ffa23d" : "#f46b25";

    ctx.beginPath();

    ctx.ellipse(
      x,
      GROUND + 36 +
        Math.sin(worldTime + i) * 8,
      25,
      4,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  if (
    state !== "menu" &&
    state !== "help"
  ) {
    drawDragon();
  } else {
    ctx.globalAlpha = 0.65;
    drawDragon();
    ctx.globalAlpha = 1;
  }
}

function loop(time) {
  const dt = Math.min(
    (time - prevTime) / 1000 || 0,
    0.035
  );

  prevTime = time;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

const actions = {
  play: start,

  instructions: () => {
    state = "help";
    showPanel("help");
  },

  "help-back": () => {
    state = "menu";
    showPanel("menu");
  },

  resume: pause,

  "pause-restart": start,

  "pause-menu": () => {
    state = "menu";
    showPanel("menu");
  },

  again: start,

  "over-menu": () => {
    state = "menu";
    showPanel("menu");
  },

  pause: pause
};

for (const [id, fn] of Object.entries(actions)) {
  $(id).addEventListener("click", e => {
    e.stopPropagation();
    fn();
  });
}

// Touch and mouse controls
canvas.addEventListener("pointerdown", e => {
  e.preventDefault();

  if (state === "playing") {
    flap();
  }
});

// Keyboard controls
document.addEventListener("keydown", e => {
  if (
    ["Space", "ArrowUp", "KeyW"].includes(e.code)
  ) {
    e.preventDefault();

    if (
      !e.repeat &&
      state !== "paused" &&
      state !== "help"
    ) {
      flap();
    }
  }

  if (
    ["KeyP", "Escape"].includes(e.code)
  ) {
    e.preventDefault();

    if (
      state === "playing" ||
      state === "paused"
    ) {
      pause();
    } else if (state === "help") {
      state = "menu";
      showPanel("menu");
    }
  }

  if (
    e.code === "KeyR" &&
    state !== "help"
  ) {
    start();
  }

  if (
    e.code === "KeyF" &&
    !e.repeat
  ) {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen?.()
        .catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }
});

// Automatically pause when the browser loses focus
document.addEventListener(
  "visibilitychange",
  () => {
    if (
      document.hidden &&
      state === "playing"
    ) {
      pause();
    }
  }
);

showPanel("menu");
})();
[],distance=0,nextDistance=420,lastGap=310,elapsed=0,anim=0,worldTime=0,prevTime=0,buttonsLocked=false;
try{best=Number(localStorage.getItem("flappyDragonBest")||0)||0;}catch(e){}
function rand(a,b){return a+Math.random()*(b-a);}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function loaded(im){return im&&im.complete&&im.naturalWidth>0;}
function image(im,x,y,w,h){if(loaded(im))ctx.drawImage(im,x,y,w,h);}
function cover(im,x,y,w,h){if(!loaded(im))return;const s=Math.max(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*s,dh=im.naturalHeight*s;ctx.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);}
function resize(){
 const r=canvas.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));
 const oldW=W;W=Math.max(350,WORLD_H*r.width/Math.max(1,r.height));
 if(oldW&&oldW!==W){const shift=W-oldW;dragon.x=W*.29;for(const p of pipes)p.x+=shift*.5;for(const v of volcanoes)v.x+=shift*.5;}
}
window.addEventListener("resize",resize);resize();
function showPanel(name){
 $("overlay").classList.toggle("hidden",name===null);
 panels.forEach(p=>$(p).classList.toggle("hidden",p!==name));
 $("hud").classList.toggle("hidden",state!=="playing"&&state!=="paused");
 $("tip").classList.toggle("hidden",state!=="playing"||score>0||elapsed>3.5);
 $("best").textContent="BEST "+best;
 $("menu-best").textContent=best;
}
function resetWorld(){
 volcanoes=Array.from({length:Math.max(3,Math.ceil(W/390)+1)},(_,i)=>({x:i*390+rand(-80,90),size:rand(235,345),parallax:rand(.2,.38),cooldown:rand(3,14),burst:0,burstAge:0}));
 clouds=Array.from({length:Math.max(3,Math.ceil(W/290)+1)},(_,i)=>({x:i*290+rand(-70,60),y:rand(55,210),size:rand(140,220),parallax:rand(.15,.29)}));
}
resetWorld();
function start(){
 state="playing";score=0;elapsed=0;anim=0;distance=0;nextDistance=rand(370,470);lastGap=GROUND*.48;pipes=[];
 dragon={x:W*.29,y:GROUND*.45,vy:0};resetWorld();$("score").textContent="0";showPanel(null);
}
function end(){
 if(state!=="playing")return;state="over";sound("hit");
 const old=best;if(score>best){best=score;try{localStorage.setItem("flappyDragonBest",String(best));}catch(e){}}
 $("final-score").textContent=score;$("final-best").textContent=best;
 $("new-best").classList.toggle("hidden",score<=old||score===0);showPanel("over");
}
function pause(){if(state==="playing"){state="paused";showPanel("paused");}else if(state==="paused"){state="playing";showPanel(null);}}
function flap(){if(state==="menu"||state==="over"){start();}if(state==="playing"){dragon.vy=FLAP;sound("flap");}}
function difficulty(){return {speed:clamp(320+score*6,320,495),gap:clamp(193-score*1.6,143,193)};}
function spawn(){
 const {gap}=difficulty(),actual=clamp(gap+rand(-12,12),140,205);
 const large=Math.random()<.32,shift=large?rand(105,175)*(Math.random()<.5?-1:1):rand(-110,110);
 lastGap=clamp(lastGap+shift,actual/2+78,GROUND-actual/2-80);
 pipes.push({x:W+90,w:Math.min(108,Math.max(76,W*.105)),gapY:lastGap,gap:actual,scored:false});
 // Variable spacing, with a safety floor so the pattern remains beatable.
 nextDistance=rand(Math.max(270,W*.37),Math.max(370,W*.52));
}
function collision(p){
 const radius=21,half=p.gap/2,top=p.gapY-half,bottom=p.gapY+half;
 const l=p.x+13,r=p.x+p.w-13;
 if(dragon.x+radius<l||dragon.x-radius>r)return false;
 return dragon.y-radius<top||dragon.y+radius>bottom;
}
function update(dt){
 worldTime+=dt;
 if(state==="menu"||state==="help"||state==="playing"){
  const speed=state==="playing"?difficulty().speed:100;
  for(const v of volcanoes){
   v.x-=speed*v.parallax*dt;
   if(v.x+v.size<0){v.x=W+rand(40,260);v.cooldown=rand(4,15);v.burst=0;}
   if(v.burst>0){v.burst-=dt;v.burstAge+=dt;if(v.burst<=0)v.cooldown=rand(5,16);}
   else{v.cooldown-=dt;if(v.cooldown<=0){v.burst=rand(.7,1.5);v.burstAge=0;}}
  }
  for(const c of clouds){c.x-=speed*c.parallax*dt;if(c.x+c.size<0){c.x=W+rand(30,200);c.y=rand(45,220);}}
 }
 if(state!=="playing")return;
 elapsed+=dt;anim+=dt;dragon.vy=Math.min(700,dragon.vy+GRAVITY*dt);dragon.y+=dragon.vy*dt;
 const {speed}=difficulty();distance+=speed*dt;
 if(distance>=nextDistance){distance=0;spawn();}
 for(let i=pipes.length-1;i>=0;i--){
  const p=pipes[i];p.x-=speed*dt;
  if(p.x+p.w<0){pipes.splice(i,1);continue;}
  if(!p.scored&&p.x+p.w<dragon.x-14){p.scored=true;score++;$("score").textContent=score;sound("score");}
  if(collision(p)){end();return;}
 }
 if(dragon.y-22<0||dragon.y+22>GROUND)end();
 if(elapsed>3.5)$("tip").classList.add("hidden");
}
function drawVolcano(v){
 const s=v.size,x=v.x,y=GROUND-s*.83+14;
 if(v.burst>0){
  const frame=Math.min(2,Math.floor(v.burstAge*5)%3);
  image(assets["volcano"+(frame+1)],x,y,s,s);
 }else{
  // Dormant mountain: crop the eruption plume from the source.
  const im=assets.volcano1;
  if(loaded(im)){
   const cropY=im.naturalHeight*.45,cropH=im.naturalHeight-cropY;
   ctx.drawImage(im,0,cropY,im.naturalWidth,cropH,x,y+s*.45,s,s*.55);
  }
 }
}
function drawPillar(p,top){
 const edge=top?p.gapY-p.gap/2:p.gapY+p.gap/2;
 const h=top?Math.max(0,edge):Math.max(0,GROUND-edge);
 if(h<=0)return;
 const x=p.x,w=p.w,y=top?0:edge,cap=Math.min(48,h*.32),shaft=Math.max(0,h-cap);
 const im=top?assets.top:assets.bottom;
 if(!loaded(im)){ctx.fillStyle="#382630";ctx.fillRect(x,y,w,h);return;}
 const sw=im.naturalWidth,sh=im.naturalHeight;
 // Only the cap facing the gap is drawn; the decorative outer foot is discarded.
 if(top){
  if(shaft>0)ctx.drawImage(im,0,sh*.30,sw,sh*.43,x,y,w,shaft);
  ctx.drawImage(im,0,sh*.76,sw,sh*.24,x,y+shaft,w,cap);
 }else{
  ctx.drawImage(im,0,0,sw,sh*.23,x,y,w,cap);
  if(shaft>0)ctx.drawImage(im,0,sh*.23,sw,sh*.47,x,y+cap,w,shaft);
 }
}
function drawDragon(){
 const t=state==="playing"?anim:worldTime;
 const im=assets["dragon"+(1+Math.floor(t*8)%3)],size=108;
 ctx.save();ctx.translate(dragon.x,dragon.y+(state==="menu"?Math.sin(worldTime*3)*6:0));
 const deg=state==="playing"?clamp(-dragon.vy*.07,-55,27):Math.sin(worldTime*2)*6;
 ctx.rotate(deg*Math.PI/180);image(im,-size/2,-size/2,size,size);ctx.restore();
}
function draw(){
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
 ctx.clearRect(0,0,W,H);
 const grad=ctx.createLinearGradient(0,0,0,GROUND);grad.addColorStop(0,"#3c1429");grad.addColorStop(.65,"#d45d2b");grad.addColorStop(1,"#fa9b3e");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
 cover(assets.background,0,0,W,H);
 for(const c of clouds){ctx.globalAlpha=.72;image(assets.cloud,c.x,c.y,c.size,c.size*.65);ctx.globalAlpha=1;}
 for(const v of volcanoes)drawVolcano(v);
 for(const p of pipes){drawPillar(p,true);drawPillar(p,false);}
 // Foreground covers the hidden pillar ends and mountain bases.
 ctx.fillStyle="#3c1920";ctx.fillRect(0,GROUND,W,H-GROUND);
 const lava=ctx.createLinearGradient(0,GROUND,0,H);lava.addColorStop(0,"#ffb638");lava.addColorStop(.22,"#ef5a1b");lava.addColorStop(1,"#762021");ctx.fillStyle=lava;ctx.fillRect(0,GROUND+6,W,H-GROUND-6);
 ctx.fillStyle="#ffd15e";ctx.fillRect(0,GROUND,W,5);
 for(let i=0;i<Math.ceil(W/90);i++){let x=i*90+(worldTime*20)%90;ctx.fillStyle=i%2?"#ffa23d":"#f46b25";ctx.beginPath();ctx.ellipse(x,GROUND+36+Math.sin(worldTime+i)*8,25,4,0,0,Math.PI*2);ctx.fill();}
 if(state!=="menu"&&state!=="help")drawDragon();
 else{ // ambient flying dragon behind the menu overlay
  ctx.globalAlpha=.65;drawDragon();ctx.globalAlpha=1;
 }
}
function loop(time){
 const dt=Math.min((time-prevTime)/1000||0,.035);prevTime=time;
 update(dt);draw();requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
const actions={
 play:start,instructions:()=>{state="help";showPanel("help");},
 "help-back":()=>{state="menu";showPanel("menu");},
 resume:pause,"pause-restart":start,"pause-menu":()=>{state="menu";showPanel("menu");},
 again:start,"over-menu":()=>{state="menu";showPanel("menu");},pause
};
for(const [id,fn] of Object.entries(actions))$(id).addEventListener("click",e=>{e.stopPropagation();fn();});
canvas.addEventListener("pointerdown",e=>{e.preventDefault();if(state==="playing")flap();});
document.addEventListener("keydown",e=>{
 if(["Space","ArrowUp","KeyW"].includes(e.code)){e.preventDefault();if(!e.repeat&&state!=="paused"&&state!=="help")flap();}
 if(["KeyP","Escape"].includes(e.code)){e.preventDefault();if(state==="playing"||state==="paused")pause();else if(state==="help"){state="menu";showPanel("menu");}}
 if(e.code==="KeyR"&&state!=="help")start();
 if(e.code==="KeyF"&&!e.repeat){if(!document.fullscreenElement)document.documentElement.requestFullscreen?.().catch(()=>{});else document.exitFullscreen?.();}
});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&state==="playing")pause();});
showPanel("menu");
})();