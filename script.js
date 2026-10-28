/* ============================================
   RETRO ROMANTIC LOVE WEBSITE - JAVASCRIPT
   FIXED: screen transitions, back button,
   scroll, photo pan, all interactions
   ============================================ */

// ==============================
// 1. SCREEN MANAGEMENT
// ==============================
let currentScreen = 'screen-landing';
let isTransitioning = false;

function switchScreen(fromId, toId) {
  if (isTransitioning) return;
  if (fromId === toId) return;
  isTransitioning = true;

  const from = document.getElementById(fromId);
  const to = document.getElementById(toId);
  if (!from || !to) { isTransitioning = false; return; }

  // 1) Mark old screen as leaving (plays tvOff)
  from.classList.remove('active');
  from.classList.add('leaving');

  // 2) After tvOff finishes, show new screen
  setTimeout(() => {
    from.classList.remove('leaving');
    // Reset scroll on target
    to.scrollTop = 0;
    // Show new screen (plays tvOn)
    to.classList.add('active');
    currentScreen = toId;

    // Trigger reveal animations for elements inside
    setTimeout(() => {
      triggerReveals(to);
      isTransitioning = false;
    }, 200);
  }, 420);
}

// --- Navigation functions ---
function enterSite() {
  triggerShutter();
  setTimeout(() => switchScreen('screen-landing', 'screen-menu'), 250);
}

function goToLanding() {
  triggerShutter();
  setTimeout(() => switchScreen(currentScreen, 'screen-landing'), 250);
}

function backToMenu() {
  triggerShutter();
  setTimeout(() => switchScreen(currentScreen, 'screen-menu'), 250);
}

function openContent(section) {
  triggerShutter();
  setTimeout(() => switchScreen('screen-menu', 'content-' + section), 250);
}

// Camera shutter flash
function triggerShutter() {
  const s = document.getElementById('shutter-overlay');
  s.classList.remove('active');
  // Force reflow to restart animation
  void s.offsetWidth;
  s.classList.add('active');
  setTimeout(() => s.classList.remove('active'), 700);
}


// ==============================
// 2. SCROLL-BASED REVEALS
// ==============================
function triggerReveals(container) {
  const items = container.querySelectorAll('.timeline-item, .gallery-item');
  items.forEach((item, i) => {
    // Stagger them in
    setTimeout(() => item.classList.add('visible'), i * 120 + 100);
  });
}

// Also reveal on scroll inside content pages
function setupScrollReveals() {
  document.querySelectorAll('.content-page, .menu-page').forEach(page => {
    page.addEventListener('scroll', () => {
      const items = page.querySelectorAll('.timeline-item:not(.visible), .gallery-item:not(.visible)');
      items.forEach(item => {
        const rect = item.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.88) {
          item.classList.add('visible');
        }
      });
    }, { passive: true });
  });
}
setupScrollReveals();


// ==============================
// 3. THREE.JS 3D HEART
// ==============================
(function init3DHeart() {
  const canvas = document.getElementById('heart-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Heart shape
  const hs = new THREE.Shape();
  hs.moveTo(0.5, 0.5);
  hs.bezierCurveTo(0.5, 0.5, 0.4, 0, 0, 0);
  hs.bezierCurveTo(-0.6, 0, -0.6, 0.7, -0.6, 0.7);
  hs.bezierCurveTo(-0.6, 1.1, -0.3, 1.54, 0.5, 1.9);
  hs.bezierCurveTo(1.2, 1.54, 1.6, 1.1, 1.6, 0.7);
  hs.bezierCurveTo(1.6, 0.7, 1.6, 0, 1.0, 0);
  hs.bezierCurveTo(0.7, 0, 0.5, 0.5, 0.5, 0.5);

  const geo = new THREE.ExtrudeGeometry(hs, {
    depth: 0.4, bevelEnabled: true, bevelSegments: 6, steps: 2,
    bevelSize: 0.12, bevelThickness: 0.12, curveSegments: 24
  });
  geo.center();

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xB22222, emissive: 0x5A0000, emissiveIntensity: 0.25,
    metalness: 0.3, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2,
    transparent: true, opacity: 0.18, side: THREE.DoubleSide
  });

  const heart = new THREE.Mesh(geo, mat);
  heart.scale.set(1.6, 1.6, 1.6);
  heart.rotation.z = Math.PI;
  scene.add(heart);

  // Particles
  const pCount = 180;
  const pGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(pCount * 3);
  const col = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.random() * Math.PI;
    const r = 3 + Math.random() * 5;
    pos[i*3] = r * Math.sin(ph) * Math.cos(th);
    pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
    pos[i*3+2] = r * Math.cos(ph);
    const c = Math.random();
    if (c < 0.4)      { col[i*3]=0.7; col[i*3+1]=0.13; col[i*3+2]=0.13; }
    else if (c < 0.7)  { col[i*3]=0.77; col[i*3+1]=0.65; col[i*3+2]=0.35; }
    else               { col[i*3]=0.63; col[i*3+1]=0.47; col[i*3+2]=0.29; }
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.05, vertexColors: true, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, sizeAttenuation: true
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // Mini hearts
  const minis = [];
  for (let i = 0; i < 5; i++) {
    const mGeo = new THREE.ExtrudeGeometry(hs, {
      depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1,
      bevelSize: 0.04, bevelThickness: 0.04, curveSegments: 12
    });
    mGeo.center();
    const mMat = new THREE.MeshPhysicalMaterial({
      color: i % 2 === 0 ? 0xCD5C5C : 0xB22222,
      emissive: 0x3A0000, emissiveIntensity: 0.4,
      metalness: 0.4, roughness: 0.3,
      transparent: true, opacity: 0.12, side: THREE.DoubleSide
    });
    const mH = new THREE.Mesh(mGeo, mMat);
    const a = (i / 5) * Math.PI * 2;
    const rad = 2.5 + Math.random() * 1.5;
    mH.position.set(Math.cos(a)*rad, Math.sin(a)*rad, (Math.random()-0.5)*2);
    mH.scale.set(0.22, 0.22, 0.22);
    mH.rotation.z = Math.PI;
    mH.userData = { a, rad, spd: 0.12 + Math.random()*0.2, yO: Math.random()*Math.PI*2 };
    scene.add(mH);
    minis.push(mH);
  }

  // Lights
  scene.add(new THREE.AmbientLight(0xCD5C5C, 0.3));
  const l1 = new THREE.PointLight(0xB22222, 1.5, 18);
  l1.position.set(4, 4, 5);
  scene.add(l1);
  const l2 = new THREE.PointLight(0xC5A55A, 1, 15);
  l2.position.set(-4, -3, 3);
  scene.add(l2);

  camera.position.z = 6;

  let mx = 0, my = 0;
  document.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.007;
    const beat = 1 + Math.sin(t*3)*0.04;
    heart.scale.set(1.6*beat, 1.6*beat, 1.6*beat);
    heart.rotation.y += (mx*0.4 - heart.rotation.y)*0.015;
    heart.rotation.x += (-my*0.25 - heart.rotation.x)*0.015;
    particles.rotation.y = t*0.25;
    particles.rotation.x = Math.sin(t*0.4)*0.15;
    minis.forEach(m => {
      const d = m.userData;
      d.a += d.spd*0.008;
      m.position.x = Math.cos(d.a)*d.rad;
      m.position.y = Math.sin(d.a)*d.rad + Math.sin(t*1.5+d.yO)*0.4;
      m.rotation.y = t*1.5;
    });
    l1.position.x = Math.sin(t)*4;
    l1.position.y = Math.cos(t)*4;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();


// ==============================
// 4. LOVE COUNTER
// ==============================
const startDate = new Date('2024-02-14T00:00:00');

function updateCounter() {
  const now = new Date();
  let diff = now - startDate;
  const years = Math.floor(diff / (365.25*24*60*60*1000));
  diff -= years * 365.25*24*60*60*1000;
  const months = Math.floor(diff / (30.44*24*60*60*1000));
  diff -= months * 30.44*24*60*60*1000;
  const days = Math.floor(diff / (24*60*60*1000));
  diff -= days * 24*60*60*1000;
  const hours = Math.floor(diff / (60*60*1000));
  diff -= hours * 60*60*1000;
  const minutes = Math.floor(diff / (60*1000));
  diff -= minutes * 60*1000;
  const seconds = Math.floor(diff / 1000);

  setNum('c-years', years);
  setNum('c-months', months);
  setNum('c-days', days);
  setNum('c-hours', hours);
  setNum('c-mins', minutes);
  setNum('c-secs', seconds);
}

function setNum(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (parseInt(el.textContent) !== val) {
    el.textContent = val;
    el.style.transform = 'scale(1.12)';
    el.style.transition = 'transform 0.2s ease';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
  }
}

setInterval(updateCounter, 1000);
updateCounter();


// ==============================
// 5. QUOTE CAROUSEL
// ==============================
const quotes = [
  { text: '"Aku memilihmu. Dan aku akan terus memilihmu. Setiap hari, tanpa ragu, tanpa jeda."', author: '— Untukmu, Selamanya' },
  { text: '"Kamu bukan hanya separuh jiwaku. Kamu adalah seluruh duniaku, segenap mimpiku, dan semua kebahagiaanku."', author: '— Dari Hati Terdalam' },
  { text: '"Jika cinta adalah samudra, maka aku ingin tenggelam bersamamu — tak perlu diselamatkan."', author: '— Kisah Kita' },
  { text: '"Setiap kali aku menutup mata, wajahmu yang aku lihat. Setiap mimpi, kamu selalu hadir."', author: '— Mimpi Indah' },
];
let curQ = 0;

(function initQuotes() {
  const nav = document.getElementById('quote-nav');
  if (!nav) return;
  quotes.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'quote-nav-dot' + (i === 0 ? ' active' : '');
    d.onclick = () => goQuote(i);
    nav.appendChild(d);
  });
  setInterval(() => goQuote((curQ + 1) % quotes.length), 6000);
})();

function goQuote(i) {
  const t = document.getElementById('quote-text');
  const a = document.getElementById('quote-author');
  const dots = document.querySelectorAll('.quote-nav-dot');
  if (!t || !a) return;
  t.style.opacity = '0';
  a.style.opacity = '0';
  setTimeout(() => {
    curQ = i;
    t.textContent = quotes[i].text;
    a.textContent = quotes[i].author;
    t.style.opacity = '1';
    a.style.opacity = '1';
    dots.forEach((d, j) => d.classList.toggle('active', j === i));
  }, 350);
}


// ==============================
// 6. MUSIC PLAYER
// ==============================
let isPlaying = false;

function togglePlay() {
  const btn = document.getElementById('play-btn');
  const v = document.getElementById('vinyl-record');
  isPlaying = !isPlaying;
  if (isPlaying) {
    btn.textContent = '⏸';
    v.classList.add('spinning');
    showToast('🎵 Memutar: Perfect — Ed Sheeran');
  } else {
    btn.textContent = '▶';
    v.classList.remove('spinning');
    showToast('⏸ Musik dijeda');
  }
  btn.style.transform = 'scale(0.85)';
  setTimeout(() => { btn.style.transform = ''; }, 180);
}


// ==============================
// 7. LIGHTBOX
// ==============================
function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lightbox-img').src = src;
  lb.classList.add('active');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });


// ==============================
// 8. WISHES
// ==============================
function submitWish(e) {
  e.preventDefault();
  const nEl = document.getElementById('wish-name');
  const mEl = document.getElementById('wish-message');
  const n = nEl.value.trim();
  const m = mEl.value.trim();
  if (!n || !m) return;

  const list = document.getElementById('wishes-list');
  const card = document.createElement('div');
  card.className = 'wish-card';
  card.innerHTML = `
    <div class="wish-name">${esc(n)}</div>
    <div class="wish-message">${esc(m)}</div>
    <div class="wish-time">♥ Baru saja</div>
  `;
  list.insertBefore(card, list.firstChild);
  nEl.value = '';
  mEl.value = '';
  showToast('💕 Ucapanmu telah terkirim ♥');

  // Heart burst from button
  const btn = document.querySelector('#wish-form .btn-send');
  if (btn) {
    const r = btn.getBoundingClientRect();
    heartBurst({ clientX: r.left + r.width/2, clientY: r.top + r.height/2 });
  }
}

function esc(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}


// ==============================
// 9. TOAST
// ==============================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}


// ==============================
// 10. CURSOR HEART TRAIL
// ==============================
let lastTrail = 0;
document.addEventListener('mousemove', e => {
  const now = Date.now();
  if (now - lastTrail < 160) return;
  lastTrail = now;
  const h = document.createElement('div');
  h.className = 'cursor-heart';
  const icons = ['♥', '❤', '♡', '✦'];
  h.textContent = icons[Math.floor(Math.random() * icons.length)];
  h.style.left = e.clientX + 'px';
  h.style.top = e.clientY + 'px';
  h.style.color = `hsl(${Math.random()*20+345}, 55%, ${Math.random()*18+40}%)`;
  h.style.fontSize = (Math.random()*9+10) + 'px';
  h.style.setProperty('--dx', (Math.random()*28-14)+'px');
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 1100);
});


// ==============================
// 11. CLICK SPARKLE
// ==============================
document.addEventListener('click', e => {
  for (let i = 0; i < 5; i++) {
    const sp = document.createElement('div');
    sp.className = 'click-sparkle';
    const a = (i/5)*Math.PI*2;
    const d = 12 + Math.random()*12;
    sp.style.left = (e.clientX + Math.cos(a)*d) + 'px';
    sp.style.top = (e.clientY + Math.sin(a)*d) + 'px';
    sp.style.background = `hsl(${Math.random()*25+8}, 65%, 52%)`;
    sp.style.boxShadow = `0 0 4px hsl(${Math.random()*25+8}, 65%, 52%)`;
    document.body.appendChild(sp);
    setTimeout(() => sp.remove(), 500);
  }
});


// ==============================
// 12. HEART BURST
// ==============================
function heartBurst(e) {
  const cx = e.clientX || window.innerWidth/2;
  const cy = e.clientY || window.innerHeight/2;
  const icons = ['❤️','💕','💗','♥','🌹','💘','💖','✨'];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'heart-burst-piece';
    p.textContent = icons[Math.floor(Math.random()*icons.length)];
    p.style.left = cx+'px';
    p.style.top = cy+'px';
    p.style.fontSize = (Math.random()*14+9)+'px';
    const a = (i/12)*Math.PI*2;
    const dist = 45 + Math.random()*70;
    p.style.setProperty('--bx', Math.cos(a)*dist+'px');
    p.style.setProperty('--by', Math.sin(a)*dist+'px');
    p.style.setProperty('--br', (Math.random()*360)+'deg');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
}


// ==============================
// 13. BUTTON RIPPLE EFFECT
// ==============================
document.addEventListener('click', e => {
  const target = e.target.closest('button, .menu-card');
  if (!target) return;
  const ripple = document.createElement('span');
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.cssText = `
    position:absolute; border-radius:50%; background:rgba(255,255,255,0.12);
    width:${size}px; height:${size}px;
    left:${e.clientX - rect.left - size/2}px;
    top:${e.clientY - rect.top - size/2}px;
    transform:scale(0); pointer-events:none;
    animation: btnRipple 0.45s ease-out forwards;
  `;
  target.style.position = target.style.position || 'relative';
  target.style.overflow = 'hidden';
  target.appendChild(ripple);
  setTimeout(() => ripple.remove(), 450);
});

// Inject ripple keyframes
const ripStyle = document.createElement('style');
ripStyle.textContent = `@keyframes btnRipple { from{transform:scale(0);opacity:0.35;} to{transform:scale(3);opacity:0;} }`;
document.head.appendChild(ripStyle);


// ==============================
// 14. MENU CARD HOVER HEARTS
// ==============================
document.querySelectorAll('.menu-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const h = document.createElement('span');
        h.textContent = '♥';
        h.style.cssText = `
          position:absolute; color:rgba(178,34,34,0.45); font-size:${Math.random()*9+7}px;
          pointer-events:none; left:${Math.random()*80+10}%; bottom:0; z-index:10;
          animation:miniRise 0.9s ease-out forwards;
        `;
        this.appendChild(h);
        setTimeout(() => h.remove(), 900);
      }, i * 70);
    }
  });
});

const miniStyle = document.createElement('style');
miniStyle.textContent = `@keyframes miniRise { 0%{transform:translateY(0) scale(1);opacity:0.6;} 100%{transform:translateY(-35px) scale(0.3);opacity:0;} }`;
document.head.appendChild(miniStyle);


// ==============================
// 15. LETTER PARAGRAPHS REVEAL
// ==============================
(function() {
  const lb = document.querySelector('#content-letter .letter-body');
  if (!lb) return;
  const page = document.getElementById('content-letter');
  // When the letter page is activated, animate paragraphs in
  const obs = new MutationObserver(() => {
    if (page.classList.contains('active')) {
      const ps = lb.querySelectorAll('p');
      ps.forEach((p, i) => {
        p.style.opacity = '0';
        p.style.transform = 'translateY(12px)';
        p.style.transition = `all 0.6s ease ${i*0.3+0.3}s`;
        requestAnimationFrame(() => {
          p.style.opacity = '1';
          p.style.transform = 'translateY(0)';
        });
      });
    }
  });
  obs.observe(page, { attributes: true, attributeFilter: ['class'] });
})();


// ==============================
// 16. POLAROID TILT ON HOVER
// ==============================
document.querySelectorAll('.polaroid-frame').forEach(f => {
  f.addEventListener('mousemove', function(e) {
    const r = this.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    this.style.transform = `perspective(700px) rotateX(${(y-0.5)*7}deg) rotateY(${(x-0.5)*-7}deg) scale(1.02)`;
  });
  f.addEventListener('mouseleave', function() {
    this.style.transform = '';
  });
});


// ==============================
// 17. INITIAL LOAD
// ==============================
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.7s ease';
  requestAnimationFrame(() => { document.body.style.opacity = '1'; });
});

console.log('📷 Retro Romantic Website loaded ♥');
