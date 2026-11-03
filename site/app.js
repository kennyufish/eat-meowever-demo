// EatMeowever demo: the app's Ticket Stack draw screen (printer cat, order tickets, swipe pile), ported from the prototype
// to plain JS, with Overture places instead of a saved list. Nothing is sent or saved: only this site's data tiles and,
// after a draw, the Google map embed are fetched. Theme, sound, language and unit are remembered in this browser only.
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=document.documentElement;
const mq=matchMedia('(prefers-reduced-motion: reduce)');let RM=mq.matches;mq.addEventListener?.('change',e=>RM=e.matches);
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const restart=(el,c)=>{el.classList.remove(c);void el.offsetWidth;el.classList.add(c)};
const live=m=>{$('#live').textContent=m};
const buzz=ms=>{try{const u=navigator.userActivation;if(navigator.vibrate&&(!u||u.hasBeenActive))navigator.vibrate(ms)}catch(e){}};
const tf=(x,y,r,s)=>`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${r.toFixed(2)}deg) scale(${s})`;
const on=(el,e,f,o)=>el.addEventListener(e,f,o);
const store={get:k=>{try{return localStorage.getItem('em-'+k)}catch(e){return null}},set:(k,v)=>{try{v==null?localStorage.removeItem('em-'+k):localStorage.setItem('em-'+k,v)}catch(e){}}};
on(document,'touchstart',()=>{},{passive:true});

/* ---------- words ---------- */
const W={
 zh:{title:'今天吃什麼好？',subtitle:'不用想太久，幫你選一家。',pile:'一疊點菜單',filters:'篩選',settings:'設定',petCat:'摸摸貓咪',
  notOrdered:'今天還沒點單',start:'幫我選一家',startHint:'喵喵馬上幫你印一張點菜單。',
  noLoc:'你在哪裡？',noLocHint:'用你的位置，或選一個加州城市。',setLoc:'選位置',lcdNoLoc:'先選位置',
  noMatch:'沒有符合的店',noMatchHint:'放寬一點距離或分類試試。',relax:'放寬篩選',noMatchLcd:'沒有符合的店 · 放寬篩選',
  loading:'載入中…',loadFail:'載入不了',loadFailHint:'檢查網路後再試一次。',retry:'再試一次',
  lcdPre:'符合條件',lcdPost:'家',printing:'出單中…',printed:'No.{no} 已出單',fateLcd:'★ 命中註定 ★',fate:'命中註定',fateSay:'命中註定喵！✨',
  printedLive:'出單：{name}。點兩下就這家，右滑看詳細，左滑丟掉',discarded:'丟掉了 {name}',skipHint:'點一下跳過',
  gestureHint:'← 左滑丟掉　點兩下就這家　右滑看詳細 →',reroll:'換一張',rerollLabel:'換一張：再印一張新的',choose:'就這家',chooseLabel:'就這家（Enter）',chosen:'已選好',
  look:'看詳細',lookLabel:'看詳細（右方向鍵）',discard:'丟掉',onlyOne:'只有一家符合 · 放寬篩選',
  brand:'吃什喵茶餐廳',head:'點菜單',table:'桌 {t}',dish:'菜色',kind:'分類',area:'地區',addr:'地址',distance:'距離',footer:'謝謝光臨 · 歡迎再來',stamp:'就是它',
  ticketLabel:'點菜單：{name}，{kind}。按 Enter 就這家，右方向鍵看詳細，左方向鍵丟掉',
  lookTag:'今天吃這家？',chosenTag:'今天就吃這家',again:'再選一家',share:'分享',copied:'已複製，貼給朋友吧',copyFailed:'無法複製，請手動複製：{name}',
  mapTitle:'地圖',mapCap:'地圖由 Google 提供，用店名和地址搜尋，圖釘可能有點偏。',noAddr:'資料沒有地址',chosenLive:'選好了：{name}',
  cat:'分類',all:'全部',food:'吃的',drink:'喝的',dessert:'甜點',cuisine:'菜系',anyCuisine:'不限',more:'更多篩選',distanceLabel:'距離',unitLabel:'單位',km:'公里',mi:'英里',done:'完成',
  where:'位置',near:'在 {x} 附近',change:'改位置',me:'你的位置',countIn:'符合條件 <b id="fcount">{n}</b> 家',
  locTitle:'你在哪裡？',locSub:'這個 demo 只有加州。位置只留在這個瀏覽器，不會傳出去。',useMine:'用我的位置',locating:'定位中…',
  locDenied:'拿不到位置，請選一個城市。',locOutside:'你好像不在加州，這個 demo 只有加州的店。請選一個城市。',orCity:'或選城市',
  appearance:'外觀',themeSystem:'跟隨系統',themeLight:'淺色',themeDark:'深色',sound:'聲音',language:'語言',
  credit:'店家資料：',creditsLink:'授權與來源',privacy:'不用帳號、不存任何資料，位置只留在你的裝置。',hungry:'先告訴我你在哪喵～',
  pets:['喵～','肚子餓了喵','快點選啦','摸摸頭 ♡','今天吃什麼好喵？'],impatient:['選啦喵！','還在選？','快點選啦喵～','喵…又換？','肚子餓啦喵！'],
  kinds:['不限','中式','日式','韓式','東南亞','印度','墨西哥與拉美','披薩與義式','美式','地中海']},
 en:{title:'What shall we eat today?',subtitle:"No need to overthink it. We'll pick one for you.",pile:'A pile of order tickets',filters:'Filters',settings:'Settings',petCat:'Pet the cat',
  notOrdered:'No order yet today',start:'Pick one for me',startHint:'The cat will print you an order ticket right away.',
  noLoc:'Where are you?',noLocHint:'Use your location or pick a California city.',setLoc:'Set location',lcdNoLoc:'Set a location first',
  noMatch:'Nothing matches',noMatchHint:'Try a wider distance or another category.',relax:'Widen filters',noMatchLcd:'Nothing matches · widen filters',
  loading:'Loading…',loadFail:"Couldn't load places",loadFailHint:'Check your connection and try again.',retry:'Try again',
  lcdPre:'',lcdPost:'match',printing:'Printing…',printed:'No.{no} printed',fateLcd:'★ Meant to be ★',fate:'Meant to be',fateSay:'Meant to be, meow! ✨',
  printedLive:'Printed: {name}. Double-tap to choose it, swipe right for details, swipe left to discard',discarded:'Discarded {name}',skipHint:'Tap to skip',
  gestureHint:'← discard · double-tap: choose · details →',reroll:'Another',rerollLabel:'Another: print a new ticket',choose:'This one',chooseLabel:'This one (Enter)',chosen:'Chosen',
  look:'Details',lookLabel:'Details (right arrow)',discard:'Discard',onlyOne:'Only one match · widen filters',
  brand:'EatMeowever Diner',head:'ORDER',table:'Table {t}',dish:'Dish',kind:'Type',area:'Area',addr:'Address',distance:'Distance',footer:'Thank you · Come again',stamp:'THIS ONE',
  ticketLabel:'Order ticket: {name}, {kind}. Enter to choose it, right arrow for details, left arrow to discard',
  lookTag:'Eat here today?',chosenTag:'Eating here today',again:'Pick another',share:'Share',copied:'Copied. Paste it to a friend',copyFailed:"Couldn't copy. Copy it by hand: {name}",
  mapTitle:'Map',mapCap:'Map by Google, found by name and address, so the pin can be a little off.',noAddr:'No address in the data',chosenLive:'Chosen: {name}',
  cat:'Category',all:'All',food:'Food',drink:'Drinks',dessert:'Sweets',cuisine:'Cuisine',anyCuisine:'Any',more:'More filters',distanceLabel:'Distance',unitLabel:'Unit',km:'km',mi:'mi',done:'Done',
  where:'Location',near:'Near {x}',change:'Change',me:'you',countIn:'<b id="fcount">{n}</b> match',
  locTitle:'Where are you?',locSub:'This demo covers California only. Your location stays in this browser and is never sent anywhere.',useMine:'Use my location',locating:'Locating…',
  locDenied:"Couldn't get your location. Pick a city instead.",locOutside:'You seem to be outside California, and this demo only has California places. Pick a city instead.',orCity:'Or pick a city',
  appearance:'Appearance',themeSystem:'System',themeLight:'Light',themeDark:'Dark',sound:'Sound',language:'Language',
  credit:'Places data:',creditsLink:'Credits & source',privacy:'No account, nothing saved. Your location stays on your device.',hungry:'Tell me where you are, meow~',
  pets:['Meow~','Hungry, meow','Hurry and pick!','Head pats ♡','What to eat, meow?'],impatient:['Pick one, meow!','Still choosing?','Hurry up, meow~','Meow… again?',"I'm hungry, meow!"],
  kinds:['Any','Chinese','Japanese','Korean','Southeast Asian','Indian','Mexican & Latin','Pizza & Italian','American','Mediterranean']}};
let LANG=store.get('lang')||(/^zh/i.test(navigator.language)?'zh':'en');
const t=(k,v={})=>String(W[LANG][k]??k).replace(/\{(\w+)\}/g,(_,n)=>v[n]??'');
function applyI18n(){root.lang=LANG==='zh'?'zh-TW':'en';
 $$('[data-i]').forEach(el=>{const v=t(el.dataset.i);if(el.dataset.attr)el.setAttribute(el.dataset.attr,v);else el.textContent=v});
 const h=$('#h-choose');delete h.dataset.t;h.textContent=t('title');stampHead(h)}

/* ---------- places ---------- */
// Kinds match Overture's taxonomy.primary values (chinese_restaurant, sushi_restaurant, ...).
const KINDS=[/./,/chinese|dim_sum|taiwanese|cantonese|szechuan|sichuan|hot_pot|shanghai|dumpling|hong_kong/,/japanese|sushi|ramen|izakaya|udon|poke/,/korean/,
 /thai|vietnamese|filipino|malaysian|indonesian|burmese|cambodian|laotian|singaporean/,/indian|pakistani|nepal|sri_lankan|himalayan|bangladeshi/,
 /mexican|taco|texmex|salvadoran|latin|peruvian|brazilian|cuban|colombian|caribbean|guatemalan|argentin|venezuelan/,/pizza|italian/,
 /american|burger|diner|barbecue|chicken|hot_dog|steak|sandwich|deli|southern|soul|cajun|grill|breakfast|pancake|bagel|fast_food/,
 /mediterranean|greek|middle_eastern|persian|halal|kebab|lebanese|turkish|afghan|falafel/];
const DRINK=/coffee|cafe|tea|juice|smoothie|boba|^(?!salad|sushi|oyster).*(bar|pub)$|brewery|lounge|wine|beer|cocktail/,
 SWEET=/bakery|ice_cream|donut|dessert|frozen_yogurt|cupcake|gelato|candy|chocolat|shaved_ice|patisserie|cake|creperie/;
const catOf=c=>SWEET.test(c)?'dessert':DRINK.test(c)?'drink':'food';
console.assert(catOf('coffee_shop')==='drink'&&catOf('salad_bar')==='food'&&catOf('donut_shop')==='dessert'&&catOf('sports_bar')==='drink','catOf');
const ZHTYPE={restaurant:'餐廳',casual_eatery:'小吃',mexican_restaurant:'墨西哥菜',fast_food_restaurant:'速食',coffee_shop:'咖啡店',pizza_restaurant:'披薩',bakery:'烘焙坊',sandwich_shop:'三明治',cafe:'咖啡館',
 chinese_restaurant:'中式餐廳',burger_restaurant:'漢堡',american_restaurant:'美式餐廳',ice_cream_shop:'冰淇淋',sushi_restaurant:'壽司',bar:'酒吧',italian_restaurant:'義式餐廳',japanese_restaurant:'日式餐廳',
 smoothie_juice_bar:'果汁吧',seafood_restaurant:'海鮮',donut_shop:'甜甜圈',thai_restaurant:'泰式餐廳',vietnamese_restaurant:'越南餐廳',barbecue_restaurant:'燒烤',breakfast_and_brunch_restaurant:'早午餐',
 chicken_restaurant:'雞肉料理',dessert_shop:'甜點店',indian_restaurant:'印度餐廳',taco_restaurant:'塔可',food_truck_stand:'餐車',delicatessen:'熟食店',mediterranean_restaurant:'地中海餐廳',
 korean_restaurant:'韓式餐廳',cocktail_bar:'調酒吧',sports_bar:'運動酒吧',diner:'美式小館',steakhouse:'牛排館',wine_bar:'葡萄酒吧',ramen_restaurant:'拉麵',dim_sum_restaurant:'港式點心',
 taiwanese_restaurant:'台式料理',hot_pot_restaurant:'火鍋',poke_restaurant:'夏威夷拌飯',filipino_restaurant:'菲律賓菜',french_restaurant:'法式餐廳',vegetarian_restaurant:'素食',vegan_restaurant:'純素',
 greek_restaurant:'希臘菜',middle_eastern_restaurant:'中東菜',hawaiian_restaurant:'夏威夷菜',asian_fusion_restaurant:'亞洲融合',asian_restaurant:'亞洲料理',frozen_yogurt_shop:'優格冰淇淋',
 bagel_shop:'貝果',hot_dog_restaurant:'熱狗',food_court:'美食街',noodles_restaurant:'麵館',cantonese_restaurant:'粵菜',szechuan_restaurant:'川菜',bubble_tea_shop:'珍珠奶茶'};
const typeLabel=c=>(LANG==='zh'&&ZHTYPE[c])||(c||'restaurant').replace(/_/g,' ');
const areaOf=p=>(p.a||'').split(', ').slice(-1)[0]||'—',streetOf=p=>(p.a||'').split(', ').slice(0,-1).join(', ')||t('noAddr');
// The app shows Latin letters in restaurant names in capitals (src/domain/locale.ts displayRestaurantName).
const shown=n=>n.replace(/\p{Script=Latin}+/gu,s=>s.toUpperCase());
const CA={s:32.5,n:42.1,w:-124.5,e:-114.1};
const CITIES=[['Los Angeles','洛杉磯',34.0522,-118.2437],['San Francisco','舊金山',37.7749,-122.4194],['San Diego','聖地牙哥',32.7157,-117.1611],['San Jose','聖荷西',37.3382,-121.8863],
 ['Sacramento','沙加緬度',38.5816,-121.4944],['Oakland','奧克蘭',37.8044,-122.2712],['Berkeley','柏克萊',37.8715,-122.273],['Palo Alto','帕羅奧圖',37.4419,-122.143],
 ['Irvine','爾灣',33.6846,-117.8265],['Pasadena','帕薩迪納',34.1478,-118.1445],['San Gabriel','聖蓋博',34.0961,-118.1058],['Arcadia','阿凱迪亞',34.1397,-118.0353],
 ['Santa Monica','聖塔莫尼卡',34.0195,-118.4912],['Long Beach','長灘',33.7701,-118.1937],['Riverside','河濱',33.9806,-117.3755],['Fresno','佛雷斯諾',36.7378,-119.7871],
 ['Santa Barbara','聖塔芭芭拉',34.4208,-119.6982],['Santa Cruz','聖塔克魯茲',36.9741,-122.0308],['Monterey','蒙特雷',36.6002,-121.8947],['Davis','戴維斯',38.5449,-121.7405],['Cupertino','庫比蒂諾',37.323,-122.0322]];
/** Great-circle distance in km. */
function kmTo(a,b){const r=Math.PI/180,dLat=(b.y-a.y)*r,dLon=(b.x-a.x)*r,h=Math.sin(dLat/2)**2+Math.cos(a.y*r)*Math.cos(b.y*r)*Math.sin(dLon/2)**2;return 12742*Math.asin(Math.sqrt(h))}
console.assert(Math.abs(kmTo({y:34.0522,x:-118.2437},{y:37.7749,x:-122.4194})-559)<5,'LA to SF is about 559 km');
let META=null;const tiles=new Map();
/** The places within km of at, from the tiles that cover the circle; a tile with no places is not in META.tiles and is skipped. */
async function placesAround(at,km){const{latStep,lonStep}=META,have=new Set(META.tiles),dLat=km/111,dLon=km/(111*Math.cos(at.y*Math.PI/180)),keys=[];
 for(let i=Math.floor((at.y-dLat)/latStep);i<=Math.floor((at.y+dLat)/latStep);i++)for(let j=Math.floor((at.x-dLon)/lonStep);j<=Math.floor((at.x+dLon)/lonStep);j++)if(have.has(`${i}_${j}`))keys.push(`${i}_${j}`);
 const res=await Promise.allSettled(keys.map(k=>{if(!tiles.has(k))tiles.set(k,fetch(`data/t/${k}.json`,{signal:AbortSignal.timeout?.(15000)}).then(r=>r.ok?r.json():Promise.reject(r.status)).catch(e=>{tiles.delete(k);throw e}));return tiles.get(k)}));
 // A few missing tiles still leave a usable draw; the next call retries them.
 if(keys.length&&res.every(r=>r.status==='rejected'))throw res[0].reason;
 return res.flatMap(r=>r.value??[]).map(p=>({...p,d:kmTo(at,p)})).filter(p=>p.d<=km)}

/* ---------- motion helpers (from the prototype) ---------- */
const LIN=window.CSS&&CSS.supports&&CSS.supports('transition-timing-function','linear(0, 1)');
function spring(k,c,fb){if(!LIN)return{easing:'cubic-bezier(.34,1.56,.64,1)',dur:fb};
 let x=0,v=0,tt=0,n=1/60;const dt=1/600,p=[0];
 while(tt<2.5){v+=(-k*(x-1)-c*v)*dt;x+=v*dt;tt+=dt;if(tt>=n){p.push(+x.toFixed(4));n+=1/60;if(Math.abs(x-1)<.005&&Math.abs(v)<.05)break}}
 p[p.length-1]=1;return{easing:`linear(${p.join(',')})`,dur:Math.round(p.length/60*1000)}}
const SP={bouncy:spring(320,11,600),pop:spring(240,15,520),snap:spring(460,24,420)};
root.style.setProperty('--spring',SP.pop.easing);
const N0={transform:'none'},BO={duration:SP.bouncy.dur,easing:SP.bouncy.easing},E='cubic-bezier(.2,.9,.2,1)';
const A=(el,f,o)=>RM||!el?null:el.animate(f,o);
const wobble=el=>A(el,[N0,{transform:'scale(.88,1.1) rotate(-4deg)',offset:.2},{transform:'scale(1.08,.94) rotate(3deg)',offset:.45},{transform:'scale(.98,1.02)',offset:.7},N0],{duration:520,easing:'ease-out'});

/* ---------- the cat and the printer ---------- */
const CATSVG=`<svg class="cat" viewBox="0 0 120 100" aria-hidden="true"><path class="ear el" d="M17 41V10Q17 6 20 9L41 30Z"/><g class="tw"><path class="ear er" d="M95 41V10Q95 6 92 9L71 30Z"/></g>
<path class="body" d="M17 39Q19 30 37 26Q56 21 75 26Q93 30 95 39C111 70 94 88 56 88C18 88 1 70 17 39Z"/><g class="eyes"><g class="bl"><ellipse cx="39" cy="53.5" rx="2.2" ry="2.7"/><ellipse cx="73" cy="53.5" rx="2.2" ry="2.7"/></g></g></svg>`;
const CAT2B='M65 31C93 31 112 44 115 63C118 81 109 90 93 90H37C21 90 12 81 15 63C18 44 37 31 65 31Z';
const cat2=`<svg class="cat cat2" viewBox="0 0 130 100" aria-hidden="true"><defs><clipPath id="c2b"><path d="${CAT2B}"/></clipPath></defs><ellipse class="sh" cx="65" cy="95" rx="50" ry="5"/>
<g class="tail"><path class="to" d="M106 84Q125 83 124 64Q123 55 115 53"/><path class="ti" d="M106 84Q125 83 124 64Q123 55 115 53"/></g>
<path class="ear el" d="M22 54L28 14Q29 8 34 12L56 35Z"/><g class="tw"><path class="ear er" d="M108 54L102 14Q101 8 96 12L74 35Z"/></g>
<path class="body" d="${CAT2B}"/><ellipse class="hi" cx="59" cy="58" rx="50" ry="35" clip-path="url(#c2b)"/><path class="bo" d="${CAT2B}"/>
<ellipse class="ck" cx="37" cy="74" rx="7" ry="3.8"/><ellipse class="ck" cx="93" cy="74" rx="7" ry="3.8"/>
<g class="eyes"><g class="bl"><ellipse cx="50" cy="64" rx="3.1" ry="4"/><ellipse cx="80" cy="64" rx="3.1" ry="4"/></g></g>
<g class="hap"><path d="M46 66Q50 60 54 66"/><path d="M76 66Q80 60 84 66"/></g><g class="slp"><path d="M46 64Q50 68 54 64"/><path d="M76 64Q80 68 84 64"/></g>
<path class="tg" d="M62.6 74.5q2.4 6 4.8 0z"/><path class="mo" d="M58.5 72.5q3.2 3 6.5 0q3.3 3 6.5 0"/>
<ellipse class="paw p1" cx="53" cy="91" rx="11" ry="7"/><ellipse class="paw p2" cx="77" cy="91" rx="11" ry="7"/></svg>`;
const pbody=$('#pbody');let prnW=0;
function drawPrn(){const Wd=Math.round(pbody.parentNode.clientWidth),H=72;if(!Wd||Wd===prnW)return;prnW=Wd;
 const S0=7,F=24,i=18,r=15,R=Wd-1.5,sil=`M${i} ${S0} H${Wd-i} L${R} ${F} V${H-r} Q${R} ${H-1.5} ${Wd-r} ${H-1.5} H${r} Q1.5 ${H-1.5} 1.5 ${H-r} V${F} Z`,
  front=`M1.5 ${F} H${R} V${H-r} Q${R} ${H-1.5} ${Wd-r} ${H-1.5} H${r} Q1.5 ${H-1.5} 1.5 ${H-r} Z`;
 pbody.setAttribute('viewBox',`0 0 ${Wd} ${H}`);
 pbody.innerHTML=`<defs><clipPath id="pfc"><path d="${front}"/></clipPath></defs><path class="ps" d="${sil}" transform="translate(4 5)"/><path class="pl" d="${sil}"/><path class="pf" d="${front}"/>
<g clip-path="url(#pfc)"><rect class="pb" x="0" y="${H-12}" width="${Wd}" height="12"/><rect class="ph" x="0" y="${F}" width="${Wd}" height="5"/></g>
<path class="pc" d="M1.5 ${F}H${R}"/><path class="po" d="${sil}"/><rect class="pt" x="${i-8}" y="${S0-3.5}" width="${Wd-2*i+16}" height="7" rx="3.5"/>`}
drawPrn();
const vc=$('#view-choose'),ccat=$('#ccat'),cpaws=ccat;
ccat.innerHTML=cat2;const csvg=$('svg',ccat);
let px=innerWidth/2,py=innerHeight*.4,eyeRaf=0;
function look(x,y){px=x;py=y;if(!eyeRaf)eyeRaf=requestAnimationFrame(updEyes)}
function updEyes(){eyeRaf=0;const r=csvg.getBoundingClientRect();if(!r.width)return;
 const dx=px-(r.left+r.width*.5),dy=py-(r.top+r.height*.64),d=Math.hypot(dx,dy)||1,m=Math.min(1,d/140);
 $('.eyes',csvg).setAttribute('transform',`translate(${(dx/d*3.4*m).toFixed(2)} ${(dy/d*2.6*m).toFixed(2)})`)}
addEventListener('pointermove',e=>look(e.clientX,e.clientY),{passive:true});
addEventListener('pointerdown',e=>look(e.clientX,e.clientY),{passive:true});
(function blink(){if(!document.hidden&&Math.random()<.85){csvg.classList.add('blinking');setTimeout(()=>csvg.classList.remove('blinking'),130);
 if(Math.random()<.25)setTimeout(()=>{csvg.classList.add('blinking');setTimeout(()=>csvg.classList.remove('blinking'),110)},270)}setTimeout(blink,1800+Math.random()*3000)})();
let moodT=0;
function mood(m,ms){vc.classList.remove('watch','happy','perk','droop','licking');if(m)vc.classList.add(m);clearTimeout(moodT);if(m&&ms)moodT=setTimeout(()=>vc.classList.remove(m),ms)}
const hop=(el,h=14)=>A(el,[N0,{transform:'scale(1.14,.82)',offset:.18},{transform:`translateY(-${h}px) scale(.94,1.08)`,offset:.5},{transform:'scale(1.06,.94)',offset:.82},N0],{duration:560,easing:'ease-out'});
function lick(){mood('licking');const p=$('.p1',cpaws);
 A(p,[N0,{transform:'translate(9px,-17px) rotate(-22deg)',offset:.2},{transform:'translate(9px,-13px) rotate(-14deg)',offset:.36},{transform:'translate(9px,-17px) rotate(-22deg)',offset:.5},{transform:'translate(9px,-13px) rotate(-14deg)',offset:.64},{transform:'translate(9px,-17px) rotate(-22deg)',offset:.78},N0],{duration:1700,easing:'ease-in-out'});
 A(csvg,[N0,{transform:'rotate(-6deg)',offset:.2},{transform:'rotate(-6deg)',offset:.8},N0],{duration:1700,easing:'ease-in-out'});
 setTimeout(()=>vc.classList.remove('licking'),1500)}
function idle(){setTimeout(idle,4200+Math.random()*3800);
 if(RM||document.hidden||printing||drag||!sheet.hidden||['watch','happy','perk','droop','licking','sleepy'].some(c=>vc.classList.contains(c)))return;
 const r=Math.random();
 if(fresh()&&r<.45){lookStart();mood('watch',1400);return}
 if(r<.3)lick();else if(r<.6)restart($('.tw',ccat),'twitch');
 else if(r<.8)A(csvg,[N0,{transform:'rotate(7deg)',offset:.3},{transform:'rotate(7deg)',offset:.7},N0],{duration:1300,easing:'ease-in-out'});
 else A($('.tail',ccat),[{transform:'rotate(-8deg)'},{transform:'rotate(22deg)'},{transform:'rotate(-14deg)'},{transform:'rotate(18deg)'},{transform:'rotate(-8deg)'}],{duration:900})}
setTimeout(idle,2600);
/* sleepy cat: dozes off after a quiet spell; any touch or key wakes it */
let napT=0;
function nap(){clearTimeout(napT);napT=setTimeout(()=>{if(printing||drag||flinging||!sheet.hidden||document.hidden){nap();return}
 vc.classList.remove('watch','happy','perk','droop','licking');vc.classList.add('sleepy')},25000)}
function wake(){nap();if(!vc.classList.contains('sleepy'))return;vc.classList.remove('sleepy');mood('perk',500);hop(csvg,6)}
addEventListener('pointerdown',wake,{passive:true});addEventListener('keydown',wake);nap();
const bubble=$('#bubble');let bubT=0,saidI=-1;
function say(m,ms=1700){bubble.textContent=m;bubble.hidden=false;A(bubble,[{transform:'scale(0) rotate(-14deg)',opacity:0},{transform:'none',opacity:1}],BO);clearTimeout(bubT);bubT=setTimeout(()=>bubble.hidden=true,ms)}
/* from the 4th redraw in a round the cat gets playfully impatient (never blocks a draw) */
function impatient(){const L=W[LANG].impatient;let i;do i=Math.random()*L.length|0;while(i===saidI);saidI=i;say(L[i]);
 if(Math.random()<.5)A($('.tail',ccat),[{transform:'rotate(-8deg)'},{transform:'rotate(26deg)'},{transform:'rotate(-14deg)'},{transform:'rotate(22deg)'},{transform:'rotate(-8deg)'}],{duration:520});
 else A($('.p2',cpaws),[N0,{transform:'translateY(-7px)',offset:.2},N0,{transform:'translateY(-7px)',offset:.6},N0],{duration:560})}
on(ccat,'click',()=>{sfx.mew();const L=W[LANG].pets;say(L[Math.random()*L.length|0]);hop(csvg,10)});
on(document,'visibilitychange',()=>{root.classList.toggle('paused',document.hidden)});

/* ---------- settings: theme, sound, language (this browser only) ---------- */
{const th=store.get('theme');if(th)root.dataset.theme=th}
function setTheme(v){if(v)root.dataset.theme=v;else delete root.dataset.theme;store.set('theme',v||null)}
/* sound: off by default, synthesized with Web Audio; the context is only created or resumed from a tap so it unlocks on iPhone */
let AC=null,OUT=null,NZ=null,SND=store.get('sound')==='1';
function ac(){if(!SND)return null;if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();OUT=AC.createGain();OUT.gain.value=.32;OUT.connect(AC.destination);
  NZ=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=NZ.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}catch(e){AC=null;return null}}
 if(AC.state!=='running')AC.resume?.().catch(()=>{});return AC}
['pointerdown','keydown'].forEach(ev=>addEventListener(ev,()=>{if(SND)ac()},{capture:true,passive:true}));
const env=(g,tt,a,peak,d)=>{g.gain.setValueAtTime(0,tt);g.gain.linearRampToValueAtTime(peak,tt+a);g.gain.exponentialRampToValueAtTime(.0001,tt+a+d)};
function noise(tt,dur){const n=AC.createBufferSource();n.buffer=NZ;n.loop=true;n.start(tt,Math.random()*.5);n.stop(tt+dur);return n}
function tone(type,f0,f1,tt,a,peak,d){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,tt);if(f1)o.frequency.exponentialRampToValueAtTime(f1,tt+a+d);env(g,tt,a,peak,d);o.connect(g).connect(OUT);o.start(tt);o.stop(tt+a+d+.05);return o}
// a sound failing never throws into the UI
const safe=f=>(...a)=>{try{return ac()?f(AC,...a):null}catch(e){return null}};
const sfx={
 whirr:safe(c=>{const tt=c.currentTime,n=noise(tt,30),bp=c.createBiquadFilter(),g=c.createGain(),am=c.createGain(),lfo=c.createOscillator(),lg=c.createGain();
  bp.type='bandpass';bp.frequency.value=2300;bp.Q.value=1.1;lfo.frequency.value=32;lg.gain.value=.35;am.gain.value=.65;lfo.connect(lg).connect(am.gain);
  g.gain.setValueAtTime(0,tt);g.gain.linearRampToValueAtTime(.16,tt+.05);n.connect(bp).connect(am).connect(g).connect(OUT);lfo.start(tt);
  return()=>{try{const e=c.currentTime;g.gain.cancelScheduledValues(e);g.gain.setValueAtTime(g.gain.value,e);g.gain.linearRampToValueAtTime(0,e+.07);n.stop(e+.1);lfo.stop(e+.1)}catch(e){}}}),
 tear:safe(c=>{const tt=c.currentTime,n=noise(tt,.24),bp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.Q.value=.9;
  bp.frequency.setValueAtTime(3400,tt);bp.frequency.exponentialRampToValueAtTime(1300,tt+.2);g.gain.setValueAtTime(0,tt);
  for(let i=0;i<7;i++)g.gain.setValueAtTime(rnd(.08,.3),tt+i*.026);g.gain.linearRampToValueAtTime(0,tt+.22);n.connect(bp).connect(g).connect(OUT)}),
 thunk:safe(c=>{const tt=c.currentTime;tone('sine',150,48,tt,.004,.9,.2);
  const n=noise(tt,.06),lp=c.createBiquadFilter(),g=c.createGain();lp.type='lowpass';lp.frequency.value=900;env(g,tt,.002,.35,.05);n.connect(lp).connect(g).connect(OUT)}),
 chime:safe(c=>{const tt=c.currentTime;[1047,1319,1568,2093].forEach((f,i)=>tone('triangle',f,0,tt+i*.075,.006,.28,.55));tone('sine',4186,0,tt+.32,.01,.08,.7)}),
 mew:safe(c=>{const tt=c.currentTime,o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();o.type='triangle';lp.type='lowpass';lp.frequency.value=2400;
  o.frequency.setValueAtTime(650,tt);o.frequency.linearRampToValueAtTime(1150,tt+.09);o.frequency.exponentialRampToValueAtTime(560,tt+.3);env(g,tt,.03,.32,.28);o.connect(lp).connect(g).connect(OUT);o.start(tt);o.stop(tt+.36)}),
 tick:safe(c=>tone('square',1900,0,c.currentTime,.001,.05,.018))};
function setSnd(v){SND=v;store.set('sound',v?'1':'0');if(v){ac();sfx.tick()}else AC?.suspend?.().catch(()=>{})}
on(document,'visibilitychange',()=>{if(document.hidden)AC?.suspend?.().catch(()=>{})});

const toastEl=$('#toast');let toastT=0;
function toast(m){toastEl.textContent=m;toastEl.hidden=false;toastEl.getAnimations().forEach(a=>a.cancel());
 A(toastEl,[{transform:'translateX(-50%) translateY(50px) scale(.8)'},{transform:'translateX(-50%)'}],BO);
 clearTimeout(toastT);toastT=setTimeout(()=>{const a=A(toastEl,[{opacity:1},{opacity:0}],{duration:200,fill:'forwards'});if(a)a.onfinish=()=>{toastEl.hidden=true;a.cancel()};else toastEl.hidden=true},2300)}
const fx=$('#fx');
function tick(el,to){const from=+el.textContent||0;if(from===to||RM){el.textContent=to;return}
 const n=Math.min(Math.abs(to-from),12);let i=0;const go=()=>{i++;el.textContent=Math.round(from+(to-from)*i/n);restart(el,'tick');if(i<n)setTimeout(go,40+i*7)};go()}
/* LCD count: each changed digit rolls like an odometer, up when the count grows and down when it shrinks */
function roll(el,to){to=String(to);const from=el.dataset.n??el.textContent;el.dataset.n=to;el.getAnimations({subtree:true}).forEach(a=>a.cancel());
 if(from===to||RM||!/^\d+$/.test(from)){el.textContent=to;return}
 const up=+to>+from,n=Math.max(from.length,to.length),a=from.padStart(n),b=to.padStart(n);
 el.innerHTML=`<span class="sr">${to}</span>`+[...b].map((c,i)=>c===a[i]?`<span class="od" aria-hidden="true"><i>${c}</i></span>`:`<span class="od" aria-hidden="true"><span><i>${up?a[i]:c}</i><i>${up?c:a[i]}</i></span></span>`).join('');
 const cols=$$('.od>span',el);cols.forEach((c,i)=>{const k=c.animate([{transform:`translateY(${up?0:-50}%)`},{transform:`translateY(${up?-50:0}%)`}],{duration:340,delay:(cols.length-1-i)*45,easing:E,fill:'both'});
  setTimeout(sfx.tick,(cols.length-1-i)*45+60);if(!i)k.onfinish=()=>{if(el.dataset.n===to)el.textContent=to}})}
function stampHead(h){if(!h.dataset.t){h.dataset.t=h.textContent;h.setAttribute('aria-label',h.dataset.t);h.innerHTML=[...h.dataset.t].map(c=>c===' '?'<span class="sp" aria-hidden="true"></span>':`<span class="ch" aria-hidden="true">${esc(c)}</span>`).join('')}
 $$('.ch',h).forEach((c,i)=>A(c,[{transform:'scale(2.3) rotate(-16deg)',opacity:0},{transform:'scale(.86) rotate(4deg)',opacity:1,offset:.55},{transform:'scale(1.07,.93)',offset:.8},{transform:'none',opacity:1}],{duration:380,delay:60+i*60,easing:'cubic-bezier(.2,.9,.3,1)',fill:'backwards'}))}

/* ---------- filters ---------- */
const KM_MI=1.609344,RANGE={km:16,mi:10};
let unit=store.get('unit')==='km'?'km':'mi';
const DEF={cat:'food',kind:0,km:5*KM_MI};
const S={...DEF};let LOC=null;
const toU=km=>unit==='mi'?km/KM_MI:km,dstr=km=>(km<.1&&unit==='mi'?'<0.1':toU(km).toFixed(1))+' '+t(unit);
let POOL=null,LOADERR=false,refTok=0;
const matches=p=>(S.cat==='all'||catOf(p.c)===S.cat)&&KINDS[S.kind].test(p.c);
async function refresh(){const tok=++refTok;
 if(!LOC||!META){POOL=null;updCount();return}
 if(!POOL)updCount();
 try{const all=await placesAround(LOC,S.km);if(tok!==refTok)return;POOL=all.filter(matches);LOADERR=false}
 catch(e){if(tok!==refTok)return;POOL=null;LOADERR=true}
 updCount()}
const countEl=$('#count'),pickBtn=$('#pick-btn'),pickLbl=$('#pick-lbl'),hint=$('#hint'),pileEl=$('#pile'),counter=$('#counter');
const startBtn=$('#start-btn'),peEl=$('#pile-empty'),ctrlEl=$('#ctrl'),ctrlBtns=$$('#ctrl>button'),fbtn=$('#filter-btn'),fdot=$('#fdot');
function updSummary(){const a=[LOC?t('near',{x:LOC.label}):t('noLoc'),S.cat==='all'?t('all'):t(S.cat),+toU(S.km).toFixed(1)+' '+t(unit)];if(S.kind)a.push(W[LANG].kinds[S.kind]);
 fbtn.setAttribute('aria-label',t('filters')+'：'+a.join('，'));fbtn.title=a.join(' · ');
 const d=S.cat!==DEF.cat||S.kind!==0||Math.abs(S.km-DEF.km)>.01;if(d===fdot.hidden){fdot.hidden=!d;if(d)A(fdot,[{transform:'scale(0)'},N0],BO)}}
let zeroLcd=false;
function updCount(){const n=POOL?POOL.length:0,state=!LOC?'loc':LOADERR?'err':!POOL?'load':n?'ok':'none';
 $('#lcd-pre').textContent=t('lcdPre');$('#lcd-post').textContent=t('lcdPost');if(sheet.hidden)roll(countEl,n);
 const fc=$('#fcount');if(fc)tick(fc,n);updSummary();pickBtn.classList.toggle('dim',state!=='ok');
 const [pt,ps,sb,lc]={loc:['noLoc','noLocHint','setLoc','lcdNoLoc'],err:['loadFail','loadFailHint','retry','loadFail'],load:['loading','startHint','start','loading'],
  none:['noMatch','noMatchHint','relax','noMatchLcd'],ok:['notOrdered','startHint','start','']}[state];
 $('#pe-t').textContent=t(pt);$('#pe-s').textContent=t(ps);$('span',startBtn).textContent=t(sb);pickLbl.textContent=t(state==='none'?'relax':'reroll');
 if(!printing){if(lc){lcd(t(lc));zeroLcd=true}else if(zeroLcd){zeroLcd=false;lcd('')}}
 const was=startBtn.hidden;$('#pe-ico').toggleAttribute('hidden',state==='ok');peEl.classList.toggle('none',state!=='ok');
 if(was&&n&&!peEl.hidden)A(startBtn,[{transform:'scale(.4)'},N0],BO)}
function setLoc(at,label){LOC={...at,label};rn=0;return refresh()}

/* ---------- the pile ---------- */
let T=[],orderNo=41,drag=null,raf=0,flinging=false,pos={x:0,y:0,r:0,sign:1};
const P=[{y:10,r:0,s:1},{y:15,r:-3.4,s:.965},{y:20,r:2.8,s:.93},{y:24,r:-1.6,s:.9}];
const pose=(i,tk)=>{const p=P[Math.min(i,3)];return tf(0,p.y,p.r+(i?0:tk.tilt),p.s)};
let ZZ='';{let d='M0 0V2';for(let x=0;x<300;x+=10)d+=`L${x+5} 9L${x+10} 2`;ZZ=`<svg class="zz" viewBox="0 0 300 10" preserveAspectRatio="none" aria-hidden="true"><path class="f" d="${d}V0Z"/><path class="s" d="${d}V0"/></svg>`}
const FITP={i:'sample',n:'Golden Gate Noodle House',c:'chinese_restaurant',a:'1 Market St, San Francisco',d:1.6};
function mkTicket(p,done){orderNo++;const now=new Date(),hm=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
 const day=new Intl.DateTimeFormat(LANG==='zh'?'zh-TW':'en-US',{month:'short',day:'numeric'}).format(now);
 const kv=(k,v)=>`<div class="ln kv"><span class="k">${t(k)}</span><i class="lead"></i><span class="val">${v}</span></div>`;
 const el=document.createElement('div');el.className='tk c-'+catOf(p.c);
 el.innerHTML=`<div class="tk-in"><div class="ln br">${CATSVG}${t('brand')}</div><div class="ln hd">${t('head')}</div>
<div class="ln mt"><span>No.${String(orderNo).padStart(4,'0')} · ${t('table',{t:String(1+orderNo%12).padStart(2,'0')})}</span><span>${day} ${hm}</span></div><div class="ln hr"></div>
<div class="ln dish"><span class="k">${t('dish')}</span><span class="v">${done?esc(shown(p.n)):'——'}</span></div><div class="ln hr"></div>
${kv('kind',esc(typeLabel(p.c)))}${kv('area',esc(areaOf(p)))}${kv('addr',esc(streetOf(p)))}${kv('distance',dstr(p.d))}
<div class="ln ft">${t('footer')}</div>${ZZ}<span class="bst${done?' on':''}">${t('stamp')}</span><span class="dl yes">${t('look')}</span><span class="dl no">${t('discard')}</span></div>`;
 if(done)$$('.ln',el).forEach(l=>l.classList.add('on'));
 return{el,p,tilt:rnd(-1.6,1.6),ord:orderNo,in:$('.tk-in',el),yes:$('.yes',el),no:$('.no',el),done:false}}
function layout(animate){
 while(T.length>5)T.pop().el.remove();
 T.forEach((tk,i)=>{const el=tk.el,to=pose(i,tk);el.style.zIndex=20-i;el.classList.toggle('is-top',!i);el.hidden=i>3;
  el.inert=!!i;if(!i){el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',t('ticketLabel',{name:tk.p.n,kind:typeLabel(tk.p.c)}))}
  const from=el.style.transform;if(animate&&from&&from!==to)A(el,[{transform:from},{transform:to}],{duration:SP.snap.dur,easing:SP.snap.easing});el.style.transform=to});
 syncStart();updCtl()}
/* First-visit state: an empty pile shows one big start button and hides the control row (visibility, so the pile measurement never changes). */
let away=false,ctrlA=[],peOut=null,repick=false,refocus=false;
const fresh=()=>!T.length&&!printing&&!repick;
function lookStart(){if(peEl.hidden||startBtn.hidden)return;const r=startBtn.getBoundingClientRect();if(r.width)look(r.left+r.width/2,r.top+r.height/2)}
function setAway(v,instant){if(v===away)return;away=v;ctrlA.forEach(a=>a.cancel());ctrlA=[];
 const set=()=>{ctrlEl.classList.toggle('away',v);ctrlBtns.forEach(b=>b.inert=v)};
 if(v){if(instant||RM){set();return}
  ctrlA=ctrlBtns.map((b,i)=>b.animate([{transform:'none',opacity:1},{transform:'translateY(60px) scale(.85)',opacity:0}],{duration:240,delay:i*35,easing:'cubic-bezier(.5,0,.75,0)',fill:'forwards'}));
  ctrlA[ctrlA.length-1].onfinish=()=>{set();ctrlA.forEach(a=>a.cancel());ctrlA=[]};return}
 set();if(instant)return;
 if(RM){ctrlA=[ctrlEl.animate([{opacity:0},{opacity:1}],{duration:200})];return}
 ctrlA=ctrlBtns.map((b,i)=>b.animate([{transform:'translateY(64px) scale(.8,.9)',opacity:0},{transform:'none',opacity:1}],{duration:SP.bouncy.dur,easing:SP.bouncy.easing,delay:[60,0,120][i],fill:'backwards'}));
 ctrlA.push(hint.animate([{opacity:0,transform:'translateX(-50%) translateY(8px)'},{opacity:1,transform:'translateX(-50%)'}],{duration:260,delay:200,easing:E,fill:'backwards'}))}
function syncStart(){if(fresh())setAway(true);
 if(!T.length&&!repick){if(peOut){peOut.cancel();peOut=null;peEl.getAnimations({subtree:true}).forEach(a=>a.cancel())}
  if(peEl.hidden){peEl.hidden=false;if(!RM){A(peEl,[{opacity:0},{opacity:1}],{duration:220});A(startBtn,[{transform:'scale(.3) rotate(-8deg)'},N0],{...BO,delay:120,fill:'backwards'})}
   setTimeout(lookStart,260)}}
 else if(T.length&&!peEl.hidden&&!peOut){if(peEl.contains(document.activeElement))refocus=true;
  if(RM){peEl.hidden=true;return}
  A(peEl,[{opacity:1},{opacity:0}],{duration:300,easing:'ease-in',fill:'forwards'});
  peOut=A(startBtn,[N0,{transform:'scale(1.14,.74)',offset:.3},{transform:'translateY(14px) scale(.55)',opacity:0}],{duration:300,easing:'ease-in',fill:'forwards'});
  peOut.onfinish=()=>{peOut=null;peEl.hidden=true;peEl.getAnimations({subtree:true}).forEach(a=>a.cancel())}}}
let swiped=store.get('swiped')==='1';
function updCtl(){const done=!!(T[0]&&T[0].done);$('#ok-btn').disabled=!T.length||printing||done;$('#ok-lbl').textContent=t(done?'chosen':'choose');$('#look-btn').disabled=!T.length||printing;
 if(!printing)hint.textContent=T.length&&!swiped&&!done?t('gestureHint'):''}
function choose(pool,discard){const used=new Set(T.map(x=>x.p.i));if(discard)used.add(discard);
 let c=pool.filter(p=>!used.has(p.i));if(!c.length)c=pool.filter(p=>p.i!==(discard||(T[0]&&T[0].p.i)));if(!c.length)c=pool;return c[Math.random()*c.length|0]}

let printing=false,skipping=false,skipRes=null,pickAt=0;
const skipper=$('#skipper');
/* a round = draws since load, the last 就這家, a filter change or 60 s without a draw; prints later in a round run quicker (K) */
let rn=0,lastDraw=0,K=1,drawN=0,tipSkip=store.get('skiptip')!=='1';
const step=ms=>(skipping||RM)?Promise.resolve():new Promise(r=>{const id=setTimeout(()=>{skipRes=null;r()},ms*K);skipRes=()=>{clearTimeout(id);skipRes=null;r()}});
function doSkip(force){if(!printing||skipping||(!force&&performance.now()-pickAt<220))return;skipping=true;if(skipRes)skipRes()}
on(skipper,'pointerdown',e=>{e.preventDefault();doSkip()});
/* the sheet comes up out of the printer: each printed line pushes it up, eased and additive so the feed reads as one motion */
function feed(tk,ln){const h0=tk.el.offsetHeight;ln.classList.add('on');if(skipping||RM)return;const dh=tk.el.offsetHeight-h0;
 if(dh>0)tk.el.animate([{transform:`translateY(${dh}px)`},{transform:'translateY(0)'}],{duration:140,easing:'cubic-bezier(.2,.8,.3,1)',composite:'add'})}
const lcdN=$('#lcd-n'),lcdM=$('#lcd-msg');let lcdT=0;
function lcd(m,ms){clearTimeout(lcdT);lcdM.textContent=m||'';lcdM.hidden=!m;lcdN.hidden=!!m;if(m&&ms)lcdT=setTimeout(()=>{lcd('');if(zeroLcd)updCount()},ms)}
let TKH=300;
/* the dish name shrinks to fit one line; below ~62% it wraps onto two lines instead (wrap=false while the names shuffle, so the ticket height stays put) */
function fitV(v,wrap=true){v.style.fontSize='';v.classList.remove('wrap2');if(v.scrollWidth<=v.clientWidth+1)return;const fs=parseFloat(getComputedStyle(v).fontSize),k=v.clientWidth/v.scrollWidth*.97;
 if(k>=.62||!wrap){v.style.fontSize=(fs*k).toFixed(1)+'px';return}
 v.classList.add('wrap2');v.style.fontSize=(fs*Math.min(.62,k*1.8)).toFixed(1)+'px'}
function fitTicket(){const h=pileEl.clientHeight;if(!h||!pileEl.clientWidth)return;
 const tk=mkTicket(FITP,true),el=tk.el,v=$('.dish .v',el);orderNo--;el.style.cssText='visibility:hidden;transform:none';el.setAttribute('aria-hidden','true');pileEl.append(el);pileEl.classList.add('fitting');
 const target=h-14;let fs=16,dfs=0;pileEl.style.setProperty('--x','0px');
 for(let i=0;i<5;i++){pileEl.style.setProperty('--fs',fs.toFixed(2)+'px');v.style.fontSize='1px';dfs=Math.min(fs*2.7,(v.clientWidth-2)/6.15);pileEl.style.setProperty('--dfs',dfs.toFixed(1)+'px');v.style.fontSize='';
  const H=el.offsetHeight+9;if(Math.abs(H-target)<3)break;const nf=clamp(fs*(1+(target/H-1)*1.15),12.5,21);if(Math.abs(nf-fs)<.05)break;fs=nf}
 pileEl.style.setProperty('--fs',fs.toFixed(2)+'px');v.style.fontSize='1px';dfs=Math.min(fs*2.7,(v.clientWidth-2)/6.15);pileEl.style.setProperty('--dfs',dfs.toFixed(1)+'px');v.style.fontSize='';
 const x=clamp((target-el.offsetHeight-9)/6.6,0,11);pileEl.style.setProperty('--x',x.toFixed(1)+'px');
 TKH=el.offsetHeight+9;pileEl.style.setProperty('--tkh',(TKH-9)+'px');el.remove();pileEl.classList.remove('fitting');T.forEach(u=>fitV($('.dish .v',u.el)))}
function ensureVisible(){const r=pileEl.getBoundingClientRect(),c=ctrlEl.getBoundingClientRect(),need=r.top+TKH+20-c.top;
 if(r.top<60||need>0)scrollTo({top:scrollY+(r.top<60?r.top-70:Math.min(need,r.top-70)),behavior:RM?'auto':'smooth'})}
function shrinkHead(){const h=$('#h-choose'),a=h.getBoundingClientRect();vc.classList.add('drawn');fitTicket();if(RM)return;const b=h.getBoundingClientRect();
 if(b.width)A(h,[{transform:`translate(${a.left-b.left}px,${a.top-b.top}px) scale(${a.width/b.width})`},N0],{duration:420,easing:E})}
async function pick(auto,discard){
 if(printing||flinging||drag||choosing||!sheet.hidden)return;
 if(!LOC){openLoc(true);return}
 if(!POOL){if(LOADERR)refresh();return}
 const pool=POOL;
 if(!pool.length){if(!auto)openFilters();syncStart();updCtl();return}
 if(!auto&&pool.length===1&&T[0]&&T[0].p.i===pool[0].i){restart(pickBtn,'shake');lcd(t('onlyOne'),2600);live(t('onlyOne'));return}
 if(!vc.classList.contains('drawn'))shrinkHead();
 [csvg,$('.p1',cpaws),$('.tail',ccat)].forEach(e=>e.getAnimations().forEach(a=>a.cancel()));$('.tw',ccat).classList.remove('twitch');
 wake();const win=choose(pool,discard),t0=performance.now();drawN++;
 const fate=Math.random()<1/12;// 命中註定: about 1 in 12
 if(t0-lastDraw>60000)rn=0;lastDraw=t0;rn++;K=rn<2?.7:rn<3?.5:.36;
 if(rn>=4&&rn%2===0)impatient();if(fate){counter.classList.add('gold');vc.classList.add('lucky')}
 printing=true;skipping=false;pickAt=performance.now();const hush=sfx.whirr();root.dataset.printing='1';pickBtn.setAttribute('aria-busy','true');hint.textContent=tipSkip?t('skipHint'):'';
 skipper.hidden=false;counter.classList.add('busy');mood('watch');ensureVisible();
 const tk=mkTicket(win,false);if(fate)tk.el.classList.add('fate');T.unshift(tk);pileEl.append(tk.el);
 layout(true);pileEl.classList.add('feeding');tk.el.classList.add('feeding');tk.el.style.transform='none';if(RM)tk.el.animate([{opacity:0},{opacity:1}],{duration:220});updCtl();lcd(fate?'★★★ '+t('printing'):t('printing'));
 const pr=pileEl.getBoundingClientRect();look(pr.left+pr.width/2,pr.bottom-80);
 const L=$$('.ln',tk.el),di=L.findIndex(l=>l.classList.contains('dish')),v=$('.v',L[di]);
 for(let i=0;i<=di;i++){feed(tk,L[i]);await step(i<di?55:60)}
 cpaws.classList.add('tap');
 const names=pool.map(p=>shown(p.n));let d=42,last='';
 while(d<180&&!skipping&&!RM){let n;do n=names[Math.random()*names.length|0];while(n===last&&names.length>1);v.textContent=last=n;fitV(v,false);
  v.animate([{transform:'translateY(-30%)',opacity:.35},{transform:'none',opacity:.9}],{duration:Math.min(d,80),fill:'forwards'});await step(d);d*=1.22}
 cpaws.classList.remove('tap');v.getAnimations().forEach(a=>a.cancel());
 v.textContent=shown(win.n);fitV(v);A(v,[{transform:'scale(1.16)'},N0],BO);if(fate)ssr(tk);
 await step(150);
 for(let i=di+1;i<L.length;i++){feed(tk,L[i]);await step(46)}
 tk.el.style.transform='translateY(-18px)';A(tk.el,[{transform:'translateY(18px)'},{transform:'translateY(0)'}],{duration:skipping?80:200*K,easing:E,composite:'add'});
 counter.classList.remove('busy');if(hush)hush();A(counter,[{transform:'translateY(1.5px)'},N0],{duration:200,easing:E});lcd(t('printed',{no:String(tk.ord).padStart(4,'0')}),2200);await step(90);
 mood('happy',1300);hop(csvg,8);
 setTimeout(()=>A(tk.in,[N0,{transform:'translateY(3px) scale(.99)',offset:.3},N0],{duration:240}),skipping?40:160);
 await step(290);
 /* tear: tug the sheet up off the printer, then let it settle on the pile */
 sfx.tear();
 tk.el.getAnimations().forEach(a=>a.cancel());const y0=tk.el.offsetTop-18;tk.el.classList.remove('feeding');
 const to=pose(0,tk),dd=(skipping?240:360)*Math.max(K,.5);
 A(tk.el,[{transform:tf(0,y0,0,1)},{transform:tf(0,y0-16,-tk.tilt*1.4,1.03),offset:.3},{transform:tf(0,P[0].y-3,tk.tilt,1),offset:.72},{transform:to}],{duration:dd,easing:'cubic-bezier(.3,.7,.3,1)'});
 tk.el.style.transform=to;
 setTimeout(()=>{A(tk.in,[N0,{transform:'scale(1.02,.96)',offset:.4},N0],{duration:220});T.slice(1,4).forEach((u,i)=>A(u.in,[N0,{transform:'translateY(3px)'},N0],{duration:240,delay:i*30}));buzz(10)},RM?0:dd*.7);
 await wait(RM?0:dd);
 printing=false;skipping=false;pileEl.classList.remove('feeding');counter.classList.remove('busy');delete root.dataset.printing;skipper.hidden=true;pickBtn.removeAttribute('aria-busy');
 if(tipSkip){tipSkip=false;store.set('skiptip','1')}
 updCtl();setAway(false);live(t('printedLive',{name:win.n+(fate?' ('+t('fate')+')':'')}));
 if(refocus){refocus=false;const a=document.activeElement;if((!a||a===document.body)&&T[0])T[0].el.focus({preventScroll:true})}}
/* 命中註定 = an SSR pull: flash, slow rays behind the pile, a gold-foil stamp in the header and a star burst */
const STAR='<svg viewBox="0 0 24 24"><path d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z"/></svg>';
function sheen(tk){const w=document.createElement('span');w.className='shw';w.innerHTML='<i></i>';tk.in.append(w);
 const a=A(w.firstChild,[{transform:'translateX(-110%)'},{transform:'translateX(110%)'}],{duration:950,easing:'ease-in-out'});if(a)a.onfinish=()=>w.remove();else w.remove()}
function ssr(tk){counter.classList.remove('gold');vc.classList.remove('lucky');lcd(t('fateLcd'),2600);say(t('fateSay'));sfx.chime();
 const s=document.createElement('span');s.className='fst';s.setAttribute('aria-hidden','true');s.innerHTML=`<b>${t('fate')}</b>`;tk.in.append(s);
 if(RM)return;buzz([16,50,16,50,36]);mood('happy',1600);hop(csvg,12);
 const tr=tk.el.getBoundingClientRect(),cx=tr.left+tr.width/2,fl=document.createElement('div');fl.className='flash';
 fl.style.background=`radial-gradient(circle at ${cx}px ${tr.top+60}px,rgba(255,250,225,.9),rgba(255,214,90,.38) 32%,transparent 68%)`;fx.append(fl);
 fl.animate([{opacity:0},{opacity:1,offset:.25},{opacity:0}],{duration:560,easing:'ease-out'}).onfinish=()=>fl.remove();
 const ry=document.createElement('div');ry.className='rays';ry.style.top=(P[0].y+TKH/2)+'px';pileEl.prepend(ry);
 ry.animate([{opacity:0,transform:'rotate(0) scale(.6)'},{opacity:1,transform:'rotate(18deg) scale(1)',offset:.2},{opacity:.85,transform:'rotate(50deg) scale(1.05)',offset:.75},{opacity:0,transform:'rotate(66deg) scale(1.1)'}],{duration:2600,easing:'ease-out'}).onfinish=()=>ry.remove();
 s.animate([{transform:'scale(2.6) rotate(-14deg)',opacity:0},{transform:'scale(.9) rotate(8.5deg)',opacity:1,offset:.6},{transform:'scale(1.05) rotate(6.5deg)',offset:.8},{transform:'rotate(7deg)'}],{duration:460,delay:120,easing:'cubic-bezier(.3,0,.4,1)',fill:'backwards'});
 setTimeout(()=>{sheen(tk);const r=s.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  for(let i=0;i<16;i++){const d=document.createElement('div'),z=rnd(10,22),a=rnd(0,Math.PI*2),k=rnd(70,170);d.className='star';d.innerHTML=STAR;d.style.cssText=`left:${x-z/2}px;top:${y-z/2}px;width:${z}px;height:${z}px`;fx.append(d);
   d.animate([{transform:'scale(0)',opacity:1},{transform:`translate(${Math.cos(a)*k}px,${Math.sin(a)*k*.8}px) scale(1) rotate(90deg)`,opacity:1,offset:.6},{transform:`translate(${Math.cos(a)*k*1.1}px,${Math.sin(a)*k*.8+30}px) scale(.3) rotate(160deg)`,opacity:0}],{duration:rnd(800,1200),easing:'cubic-bezier(.15,.75,.35,1)'}).onfinish=()=>d.remove()}},400)}
on(pickBtn,'click',()=>pick(false));on(startBtn,'click',()=>pick(false));
on(document,'keydown',e=>{if(printing){doSkip();e.preventDefault();return}
 if(e.key==='Escape'&&!sheet.hidden){closeSheet();return}
 if(!sheet.hidden||e.target.matches('input,select,textarea'))return;
 const isTk=e.target.classList.contains('tk');
 if(e.key==='ArrowLeft'){e.preventDefault();swipe(-1)}else if(e.key==='ArrowRight'){e.preventDefault();detail()}
 else if(e.key==='Enter'&&(isTk||e.target===document.body)){e.preventDefault();decide()}else if(e.key===' '&&isTk){e.preventDefault();detail()}});

/* drag: left throws the ticket away, right opens it, a double tap chooses it */
function applyDrag(x,y,r){const tk=T[0];if(!tk)return;tk.el.style.transform=tf(x,P[0].y+y,tk.tilt+r,1);const k=Math.min(1,Math.abs(x)/150);
 for(let i=1;i<Math.min(T.length,4);i++){const a=P[i],b=P[i-1];T[i].el.style.transform=tf(0,a.y+(b.y-a.y)*k,a.r+(b.r-a.r)*k,a.s+(b.s-a.s)*k)}
 tk.yes.style.opacity=clamp(x/90,0,1);tk.no.style.opacity=clamp(-x/90,0,1);
 vc.classList.toggle('perk',x>50);vc.classList.toggle('droop',x<-50)}
const rubber=v=>Math.sign(v)*90*(1-1/(Math.abs(v)/90*.6+1));
on(pileEl,'pointerdown',e=>{const el=e.target.closest('.tk');if(!el||!T[0]||el!==T[0].el||printing||flinging||choosing||e.button>0||e.target.closest('button,label,input'))return;
 cancelAnimationFrame(raf);const r=el.getBoundingClientRect();pos.sign=e.clientY<r.top+r.height*.55?1:-1;
 drag={id:e.pointerId,ox:e.clientX-pos.x,oy:e.clientY,sx:e.clientX,sy:e.clientY,t0:performance.now(),s:[{x:e.clientX,t:performance.now()}],moved:false};
 try{el.setPointerCapture(e.pointerId)}catch(_){}el.classList.add('dragging')});
on(pileEl,'pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const now=performance.now();
 pos.x=e.clientX-drag.ox;pos.y=rubber(e.clientY-drag.oy);pos.r=clamp(pos.x*.07*pos.sign,-26,26);if(Math.abs(e.clientX-drag.sx)>4)drag.moved=true;
 drag.s.push({x:e.clientX,t:now});while(drag.s.length>2&&now-drag.s[0].t>100)drag.s.shift();applyDrag(pos.x,pos.y,pos.r)});
let tapT=0;
function up(e){if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;T[0]&&T[0].el.classList.remove('dragging');
 const a=d.s[0],b=d.s[d.s.length-1];let vx=(b.x-a.x)/Math.max(1,b.t-a.t);if(performance.now()-b.t>90)vx=0;
 /* a tap waits 250 ms for a second one: a double tap is 就這家, a single tap 看詳細 */
 if(e.type==='pointerup'&&!d.moved&&Math.hypot(e.clientX-d.sx,e.clientY-d.sy)<8&&performance.now()-d.t0<400){springBack(0,0);
  if(tapT){clearTimeout(tapT);tapT=0;decide()}else tapT=setTimeout(()=>{tapT=0;detail()},250);return}
 let dir=0;if(pos.x>105||(vx>.45&&pos.x>24))dir=1;else if(pos.x<-105||(vx<-.45&&pos.x<-24))dir=-1;
 if(dir&&!swiped){swiped=true;store.set('swiped','1')}
 if(dir>0){springBack(vx,0);detail();return}dir?fling(dir,vx):springBack(vx,0)}
on(pileEl,'pointerup',up);on(pileEl,'pointercancel',up);
function springBack(vx,vy){const v={x:vx*1000,y:vy*1000};let last=performance.now();
 const st=now=>{const dt=Math.min(.032,(now-last)/1000);last=now;for(const k of['x','y']){v[k]+=(-420*pos[k]-22*v[k])*dt;pos[k]+=v[k]*dt}pos.r=clamp(pos.x*.07*pos.sign,-26,26);applyDrag(pos.x,pos.y,pos.r);
  if(Math.abs(pos.x)+Math.abs(pos.y)<.4&&Math.abs(v.x)+Math.abs(v.y)<8){pos={x:0,y:0,r:0,sign:1};applyDrag(0,0,0);vc.classList.remove('perk','droop');return}raf=requestAnimationFrame(st)};
 raf=requestAnimationFrame(st)}
function fling(dir,vx){flinging=true;T[0].el.classList.add('fly');cancelAnimationFrame(raf);
 if(RM){commit();return}
 let v=dir*Math.max(Math.abs(vx),1.5),last=0;const lim=innerWidth/2+260;
 const st=now=>{const dt=Math.min(32,now-last);last=now;v*=1.04;pos.x+=v*dt;pos.y-=.08*dt;pos.r=clamp(pos.x*.07*pos.sign,-40,40);applyDrag(pos.x,pos.y,pos.r);
  if(Math.abs(pos.x)<lim)raf=requestAnimationFrame(st);else commit()};
 last=performance.now();raf=requestAnimationFrame(st)}
/* 丟掉: the ticket leaves and the next one prints */
function commit(){const tk=T.shift();tk.el.remove();flinging=false;repick=true;pos={x:0,y:0,r:0,sign:1};layout(true);buzz(12);
 mood('droop',650);live(t('discarded',{name:tk.p.n}));setTimeout(()=>{repick=false;pick(true,tk.p.i);syncStart()},140)}
/* 就這家: the stamp slams onto the chosen ticket, held a beat so it reads before the sheet opens */
function stampIt(tk){const s=$('.bst',tk.el);tk.yes.style.opacity=0;s.classList.add('on');if(RM){sfx.thunk();buzz(18);mood('happy',900);return}
 restart(s,'slam');
 const sh=document.createElement('i');sh.className='bsh';tk.in.append(sh);const c='translate(-50%,-50%) ';
 sh.animate([{transform:c+'translate(20px,30px) rotate(-19deg) scale(1.35)',opacity:0,filter:'blur(16px)'},{transform:c+'translate(3px,5px) rotate(-12deg)',opacity:.22,filter:'blur(4px)',offset:.6},{transform:c+'rotate(-12deg)',opacity:0,filter:'blur(2px)'}],{duration:420,easing:'ease-in',fill:'forwards'}).onfinish=()=>sh.remove();
 setTimeout(()=>{sfx.thunk();buzz(24);hop(csvg,7);mood('perk',260);setTimeout(()=>mood('happy',900),260);
  A(tk.in,[N0,{transform:'translateY(3px) scale(1.012,.975)',offset:.3},N0],{duration:240,easing:'ease-out'});
  const r=s.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  for(let i=0;i<10;i++){const d=document.createElement('i'),a=rnd(0,Math.PI*2),z=rnd(3,7),k=rnd(14,34);d.className='ink';
   d.style.cssText=`left:${cx+Math.cos(a)*r.width*.45}px;top:${cy+Math.sin(a)*r.height*.42}px;width:${z}px;height:${z}px`;fx.append(d);
   d.animate([{transform:'scale(.4)'},{transform:`translate(${Math.cos(a)*k}px,${Math.sin(a)*k}px) scale(1)`,opacity:1,offset:.5},{transform:`translate(${Math.cos(a)*k*1.15}px,${Math.sin(a)*k*1.15}px) scale(.9)`,opacity:0}],{duration:rnd(420,620),easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish=()=>d.remove()}},250)}
function swipe(dir){if(printing||drag||flinging||choosing||!T[0])return;pos.sign=1;fling(dir,dir*1.6)}
function detail(){if(printing||flinging||drag||choosing||!T[0]||!sheet.hidden)return;openResult(T[0].p)}
on($('#ok-btn'),'click',()=>decide());on($('#look-btn'),'click',detail);
let choosing=false;
function hold(){return new Promise(r=>{if(RM)return setTimeout(r,400);let done=false;const fire=()=>{if(done)return;done=true;clearTimeout(id);removeEventListener('pointerdown',fire,true);r()},id=setTimeout(fire,400);
 setTimeout(()=>{if(!done)addEventListener('pointerdown',fire,true)},60)})}// a tap skips the stamp hold, like it skips the print
/* 就這家 on the top ticket; nothing is recorded. inSheet re-renders the open sheet, so the stamp lands on its header */
async function decide(inSheet){const tk=T[0];if(!tk||printing||flinging||drag||choosing)return;if(tk.done){if(!inSheet)detail();return}
 choosing=true;try{tk.done=true;rn=0;
  if(inSheet){$('.bst',tk.el).classList.add('on');tk.yes.style.opacity=0;inSheet();const h=$('#r-stamp');if(h&&!RM)restart(h,'slam');sfx.thunk();buzz(20)}
  else{stampIt(tk);updCtl();await hold();openResult(tk.p)}
  live(t('chosenLive',{name:tk.p.n}))}finally{choosing=false;updCtl()}}

/* ---------- sheets ---------- */
const sheet=$('#sheet'),spanel=$('#spanel'),sbody=$('#sheet-body');let lastFocus=null,closing=false,onClose=null,openedAt=0;
function openSheet(html,focusSel,cb){const was=!sheet.hidden&&!closing;// already up: swap the content in place, no second slide-in
 sbody.onclick=sbody.onchange=sbody.oninput=null;sbody.innerHTML=html;sheet.hidden=false;openedAt=performance.now();closing=false;onClose=cb||null;if(!was)lastFocus=document.activeElement;spanel.style.transform='';document.body.style.overflow='hidden';
 if(was);else if(RM)A(sheet,[{opacity:0},{opacity:1}],{duration:120});
 else{spanel.animate([{transform:'translateY(100%)'},N0],{duration:SP.pop.dur,easing:SP.pop.easing});$('.scrim',sheet).animate([{opacity:0},{opacity:1}],{duration:260});
  $$('.fsec,.acts>*,.dmap',spanel).forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:400,delay:120+i*35,easing:E,fill:'backwards'}))}
 const f=$(focusSel,spanel);f&&f.focus({preventScroll:true})}
function closeSheet(){if(sheet.hidden||closing)return Promise.resolve();closing=true;const d=RM?1:260,from=spanel.style.transform||'none';
 const a=spanel.animate([{transform:from},{transform:'translateY(105%)'}],{duration:d,easing:'cubic-bezier(.5,0,.75,0)',fill:'forwards'});$('.scrim',sheet).animate([{opacity:1},{opacity:0}],{duration:d,fill:'forwards'});
 return a.finished.then(()=>{sheet.hidden=true;spanel.style.transform='';sheet.getAnimations({subtree:true}).forEach(x=>x.cancel());closing=false;document.body.style.overflow='';sbody.innerHTML='';roll(countEl,POOL?POOL.length:0);
  const cb=onClose;onClose=null;if(cb)cb();if(lastFocus&&document.contains(lastFocus))lastFocus.focus({preventScroll:true})})}
on(sheet,'click',e=>{if(e.target.hasAttribute('data-close')&&performance.now()-openedAt>400)closeSheet()});
let sd=null;
on(spanel,'pointerdown',e=>{if(!e.target.closest('.grab,.rhead,.fhead')||e.target.closest('button,a,input,select'))return;sd={y:e.clientY,t:performance.now(),dy:0,id:e.pointerId};try{spanel.setPointerCapture(e.pointerId)}catch(_){}});
on(spanel,'pointermove',e=>{if(!sd||e.pointerId!==sd.id)return;let dy=e.clientY-sd.y;dy=dy<0?dy*.2:dy;sd.dy=dy;spanel.style.transform=`translateY(${dy}px)`});
const sEnd=()=>{if(!sd)return;const d=sd;sd=null;const v=d.dy/Math.max(1,performance.now()-d.t);
 if(d.dy>110||(v>.5&&d.dy>30))closeSheet();else if(d.dy){A(spanel,[{transform:spanel.style.transform},N0],BO);spanel.style.transform=''}};
on(spanel,'pointerup',sEnd);on(spanel,'pointercancel',sEnd);

const googleUrl=p=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([p.n,p.a].filter(Boolean).join(' '));
const appleUrl=p=>`https://maps.apple.com/place?name=${encodeURIComponent(p.n)}&coordinate=${p.y},${p.x}`;
const embedUrl=p=>`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(window.EMBED_KEY)}&language=${LANG==='zh'?'zh-TW':'en'}&q=${encodeURIComponent(p.a?`${p.n}, ${p.a}`:`${p.y},${p.x}`)}`;
// The iframe sends the full page URL as referrer, because the key only accepts this site's pages.
const mapHTML=p=>window.EMBED_KEY?`<details class="dmap" open><summary>${t('mapTitle')}</summary><iframe src="${esc(embedUrl(p))}" title="${esc(t('mapTitle')+': '+p.n)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><p class="cap">${t('mapCap')}</p></details>`:'';
/* 分享: only the public details (name, address, map link). The phone's share sheet, else copy */
async function share(p){const text=p.n+'\n'+(p.a||''),url=googleUrl(p);
 if(navigator.share)try{await navigator.share({title:p.n,text,url});return}catch(e){if(e.name==='AbortError')return}
 (navigator.clipboard?navigator.clipboard.writeText(text+'\n'+url):Promise.reject()).then(()=>toast(t('copied')),()=>toast(t('copyFailed',{name:p.n})))}
function openResult(p){const tk=T[0]&&T[0].p===p?T[0]:null;
 const html=()=>{const done=tk&&tk.done;
  return`<div class="rhead c-${catOf(p.c)}"><span class="rtag">${t(done?'chosenTag':'lookTag')}</span><h2 id="sh-title" class="rname">${esc(shown(p.n))}</h2><p class="rmeta">${esc(p.a||t('noAddr'))}</p><span class="bst${done?' on':''}" id="r-stamp">${done?t('stamp'):''}</span></div>
<p class="fline">${dstr(p.d)} · ${esc(typeLabel(p.c))}</p>${mapHTML(p)}
${done?'':`<div class="acts"><button id="r-ok" class="btn pri">${t('choose')}</button></div>`}
<div class="gorow"><a class="btn dstatus gobtn${done?' pri':''}" href="${esc(googleUrl(p))}" target="_blank" rel="noopener">Google Maps</a><a class="btn dstatus gobtn" href="${esc(appleUrl(p))}" target="_blank" rel="noopener">Apple Maps</a><button class="btn dstatus shbtn" id="r-share" type="button" aria-label="${t('share')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8M5 12v7.5h14V12"/></svg></button></div>
<div class="tlinks"><button id="r-again">${t('again')}</button></div>`};
 const wire=()=>{sbody.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.id==='r-ok')decide(()=>{const y=spanel.scrollTop;sbody.innerHTML=html();spanel.scrollTop=y});
  else if(b.id==='r-share')share(p);
  else if(b.id==='r-again')closeSheet().then(()=>pick(false,p.i))}};
 openSheet(html(),'#r-ok,.gobtn');wire()}
function openFilters(){if(printing)return;wobble($('svg',fbtn));
 const segI={all:0,food:1,drink:2,dessert:3};
 const html=()=>`<div class="fhead"><h2 id="sh-title" class="sh2">${t('filters')}</h2><span class="fcount" aria-live="polite">${t('countIn',{n:POOL?POOL.length:0})}</span></div>
<div class="fbody">
 <div class="fsec"><p class="flab">${t('where')}</p><div class="bex"><span id="loc-t">${LOC?esc(t('near',{x:LOC.label})):t('noLoc')}</span><button type="button" id="f-loc">${t('change')}</button></div></div>
 <div class="fsec"><p class="flab" id="fl-cat">${t('cat')}</p><div class="chips" id="cat-chips" role="group" aria-labelledby="fl-cat">
  ${['all','food','drink','dessert'].map(k=>`<button class="chip" data-cat="${k}" aria-pressed="${S.cat===k}" style="--c:var(--${{all:'lemon',food:'peach',drink:'sky',dessert:'lilac'}[k]})">${k==='all'?'':'<i class="dot"></i>'}${t(k)}</button>`).join('')}</div></div>
 <div class="fsec"><p class="flab">${t('distanceLabel')}</p><div class="opts"><div class="dist"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg><label class="sr" for="dist">${t('distanceLabel')}</label>
  <input id="dist" type="range" min="0.5" max="${RANGE[unit]}" step="0.5" value="${clamp(Math.round(toU(S.km)*2)/2,.5,RANGE[unit])}"><output id="dist-v" for="dist">${+(Math.round(toU(S.km)*2)/2)} ${t(unit)}</output><label class="sr" for="unit">${t('unitLabel')}</label><select id="unit"><option value="mi"${unit==='mi'?' selected':''}>${t('mi')}</option><option value="km"${unit==='km'?' selected':''}>${t('km')}</option></select></div></div></div>
 <details class="fsec dmap fmore"${S.kind?' open':''}><summary><span>${t('cuisine')}</span>${S.kind?'<i class="fbadge">1</i>':''}</summary><div class="fm-b"><div class="chips" id="kind-chips" style="flex-wrap:wrap">
  ${W[LANG].kinds.map((k,i)=>`<button class="chip" data-k="${i}" aria-pressed="${S.kind===i}" style="--c:var(--pink);flex:none">${esc(k)}</button>`).join('')}</div></div></details>
</div><div class="acts"><button id="f-done" class="btn pri">${t('done')}</button></div>`;
 openSheet(html(),'#cat-chips [aria-pressed="true"]');
 const changed=()=>{rn=0;refresh()};
 sbody.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.id==='f-done')closeSheet();else if(b.id==='f-loc')openLoc(false,true);
  else if(b.dataset.cat){S.cat=b.dataset.cat;$$('#cat-chips .chip').forEach(x=>x.setAttribute('aria-pressed',x===b));wobble(b);changed()}
  else if(b.dataset.k){S.kind=+b.dataset.k;$$('#kind-chips .chip').forEach(x=>x.setAttribute('aria-pressed',x===b));wobble(b);changed()}};
 const dist=$('#dist');
 dist.oninput=()=>{const v=+dist.value;S.km=unit==='mi'?v*KM_MI:v;$('#dist-v').textContent=v+' '+t(unit);changed()};
 $('#unit').onchange=e=>{unit=e.target.value;store.set('unit',unit);const v=clamp(Math.round(toU(S.km)*2)/2,.5,RANGE[unit]);dist.max=RANGE[unit];dist.value=v;dist.oninput();wobble(e.target.parentNode)}}
on(fbtn,'click',()=>{if(sheet.hidden)openFilters()});
/* location: the browser's location prompt, else a California city. Kept in memory only. */
function openLoc(thenPick,backToFilters){
 const cities=CITIES.map(([en,zh],i)=>`<button class="chip" data-c="${i}" aria-pressed="${!!LOC&&LOC.label===(LANG==='zh'?zh:en)}">${LANG==='zh'?zh:en}</button>`).join('');
 openSheet(`<div class="fhead"><h2 id="sh-title" class="sh2">${t('locTitle')}</h2></div><p class="sub">${t('locSub')}</p>
<button class="btn pri locbtn" id="l-me" type="button">${t('useMine')}</button><p class="lnote" id="l-note" aria-live="polite"></p>
<div class="fsec dsec"><h3>${t('orCity')}</h3><div class="dgrid">${cities}</div></div>`,'#l-me');
 const done=()=>{if(backToFilters){openFilters();return}closeSheet().then(()=>{if(thenPick&&POOL&&POOL.length)pick(false)})};
 sbody.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.c){const[en,zh,y,x]=CITIES[+b.dataset.c];wobble(b);setLoc({y,x},LANG==='zh'?zh:en).then(done);return}
  if(b.id!=='l-me')return;const note=$('#l-note');
  if(!navigator.geolocation){note.textContent=t('locDenied');return}
  note.textContent=t('locating');b.disabled=true;
  // The timeout keeps a prompt that never answers (seen once on iPhone) from hanging the sheet.
  navigator.geolocation.getCurrentPosition(({coords})=>{b.disabled=false;const at={y:coords.latitude,x:coords.longitude};
   if(at.y<CA.s||at.y>CA.n||at.x<CA.w||at.x>CA.e){note.textContent=t('locOutside');return}
   setLoc(at,t('me')).then(done)},()=>{b.disabled=false;note.textContent=t('locDenied')},{timeout:12000,maximumAge:300000})}}
function openSettings(){if(printing)return;wobble($('svg',$('#set-btn')));
 const th=root.dataset.theme||'';const seg=(id,opts,cur)=>`<div class="seg" id="${id}" role="group" style="--n:${opts.length};--i:${Math.max(0,opts.findIndex(o=>o[0]===cur))};--c:var(--sky)"><span class="ind"></span>${opts.map(([v,l])=>`<button data-v="${v}" aria-pressed="${v===cur}">${l}</button>`).join('')}</div>`;
 openSheet(`<h2 id="sh-title" class="sh2">${t('settings')}</h2><ul class="srows">
<li class="sopt"><span>${t('appearance')}</span>${seg('s-theme',[['',t('themeSystem')],['light',t('themeLight')],['dark',t('themeDark')]],th)}</li>
<li class="sopt"><span>${t('language')}</span>${seg('s-lang',[['zh','中文'],['en','English']],LANG)}</li>
<li><label class="srow switch noarr" for="s-snd"><span>${t('sound')}</span><input type="checkbox" id="s-snd" role="switch"${SND?' checked':''}><span class="track" aria-hidden="true"><span class="knob"></span></span></label></li></ul>
<p class="credits">${t('credit')} <a href="https://overturemaps.org" target="_blank" rel="noopener">Overture Maps Foundation</a> · CDLA-Permissive-2.0, Apache-2.0, CC0-1.0 · <a href="https://github.com/kennyufish/eat-meowever-demo#data-and-credits" target="_blank" rel="noopener">${t('creditsLink')}</a><br>${t('privacy')}</p>
<div class="acts"><button id="s-done" class="btn pri">${t('done')}</button></div>`,'#s-theme [aria-pressed="true"]');
 sbody.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='s-done'){closeSheet();return}
  const g=b.closest('.seg');if(!g)return;$$('button',g).forEach((x,i)=>{x.setAttribute('aria-pressed',x===b);if(x===b)g.style.setProperty('--i',i)});
  if(g.id==='s-theme')setTheme(b.dataset.v);
  if(g.id==='s-lang'&&b.dataset.v!==LANG){LANG=b.dataset.v;store.set('lang',LANG);if(LOC&&LOC.label===W[LANG==='zh'?'en':'zh'].me)LOC.label=t('me');applyI18n();fitTicket();updCount();openSettings()}};
 $('#s-snd').onchange=e=>setSnd(e.target.checked)}
on($('#set-btn'),'click',()=>{if(sheet.hidden)openSettings()});
addEventListener('resize',()=>{drawPrn();fitTicket();lookStart()});

/* ---------- start ---------- */
applyI18n();setAway(true,true);updCount();fitTicket();layout(false);
A(startBtn,[{transform:'scale(.7) rotate(-6deg)'},N0],{...BO,delay:420,fill:'backwards'});setTimeout(lookStart,1100);
A(csvg,[{transform:'scale(.2)',opacity:0},{transform:'translateY(-8px) scale(1.04,1.1)',opacity:1,offset:.6},{transform:'scale(1.06,.95)',offset:.82},N0],{duration:640,delay:350,easing:'ease-out',fill:'backwards'});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{fitTicket();lookStart()});
setTimeout(()=>{if(!LOC)say(t('hungry'),3600)},1400);
fetch('data/meta.json').then(r=>r.json()).then(m=>{META=m;$('#release').textContent=m.release;refresh()}).catch(()=>{LOADERR=true;updCount()});
})();
