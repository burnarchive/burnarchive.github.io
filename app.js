(() => {
  const ADMIN = 'burnadmin';
  const DATA = window.SHOP_DATA || { products: [] };
  const ALL = DATA.products;
  const live = ALL.filter(p => p.status !== 'sold');
  const sold = ALL.filter(p => p.status === 'sold');
  const soldCount = sold.reduce((n, p) => n + (p.qty || 1), 0);
  const $ = s => document.querySelector(s);
  const th = s => /^img\/[^/]+\.jpg$/.test(s) ? s.replace(/^img\/(.+)\.jpg$/, 'img/t/$1.webp') : s;
  const dm = text => `https://t.me/${ADMIN}?text=${encodeURIComponent(text)}`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => n ? n.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₴' : 'Цена Договорная';
  const ST = { in: '🔥 В наличии', transit: '✈️ Едет ко мне', order: '📦 Под заказ', sold: 'SOLD' };
  const TYPES = [
    ['', 'Всё'], ['tops', 'Футболки и рубашки', ['футболка', 'рубашка', 'лонгслив']],
    ['sweat', 'Худи и свитшоты', ['худи', 'свитшот']], ['jeans', 'Джинсы', ['джинсы']],
    ['outer', 'Куртки', ['куртка']], ['shoes', 'Обувь', ['обувь']], ['acc', 'Аксессуары', ['аксессуары']]
  ];
  const state = { q: '', brand: '', type: '', st: '', sort: 'new' };
  const priceLabel = p => p.options ? 'от ' + money(Math.min(...p.options.map(o => o.price))) : money(p.price);

  /* ---------- якоря без #хвоста в адресе ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const el = id ? document.getElementById(id) : null;
    el ? el.scrollIntoView({ behavior: 'smooth' }) : scrollTo({ top: 0, behavior: 'smooth' });
  });
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);

  /* ---------- шапка, статы, бегущая строка ---------- */
  const top = $('#top');
  const onScroll = () => top.classList.toggle('solid', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const cnt = s => live.filter(p => p.status === s).length;
  $('#upd').textContent = new Date(DATA.updated).toLocaleDateString('ru-RU');

  /* ---------- фильтры ---------- */
  const brandSel = $('#brand');
  [...new Set(live.map(p => p.brand))].sort().forEach(b => brandSel.insertAdjacentHTML('beforeend', `<option>${esc(b)}</option>`));
  $('#chips').innerHTML = TYPES.map(([k, l, ts]) => {
    const n = k ? live.filter(p => ts.includes(p.type)).length : live.length;
    return n ? `<button data-type="${k}" class="${k ? '' : 'on'}">${l}<small>${n}</small></button>` : '';
  }).join('');
  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    state.type = b.dataset.type; [...$('#chips').children].forEach(x => x.classList.toggle('on', x === b)); render();
  });
  [...$('#statusChips').children].forEach(b => { if (b.dataset.st && !cnt(b.dataset.st)) b.hidden = true; });
  $('#statusChips').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    state.st = b.dataset.st; [...$('#statusChips').children].forEach(x => x.classList.toggle('on', x === b)); render();
  });
  $('#q').addEventListener('input', e => { state.q = e.target.value.trim().toLowerCase(); render(); });
  brandSel.addEventListener('change', e => { state.brand = e.target.value; render(); });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; render(); });

  /* ---------- карточки ---------- */
  const card = p => {
    const alt = p.photos[1] ? `<img class="alt" src="${th(p.photos[1])}" data-full="${p.photos[1]}" onerror="this.onerror=null;this.src=this.dataset.full" alt="" loading="lazy">` : '';
    return `<article class="card reveal" data-id="${p.id}" tabindex="0">
      <div class="ph">
        <span class="badge ${p.status}${p.status !== 'sold' ? ' badge-ph' : ''}">${ST[p.status]}</span>
        ${p.qty > 1 ? `<span class="qty" style="position:absolute;top:8px;right:12px;z-index:2;font-family:Unbounded,sans-serif;font-weight:900;font-size:30px;letter-spacing:-.04em;line-height:1;transform:rotate(-12deg);background:linear-gradient(100deg,#b3140c,#ff3d00 30%,#ff7a1a 60%,#ffc93c);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 6px rgba(0,0,0,.8)) drop-shadow(0 0 12px rgba(255,61,0,.6))">x${p.qty}</span>` : ''}
        <img src="${th(p.photos[0] || 'logo.jpg')}" data-full="${p.photos[0] || 'logo.jpg'}" onerror="this.onerror=null;this.src=this.dataset.full" alt="${esc(p.name)}" loading="lazy">${alt}
      </div>
      <div class="meta">
        <span class="brand">${esc(p.brand)}</span>
        <span class="name">${esc(p.name)}</span>
        <div class="row">
          <span class="price${p.price || p.options || p.status === 'sold' ? '' : ' deal'}">${p.status === 'sold' ? '—' : priceLabel(p)}</span>
          <span class="tags"><span class="size">${esc(p.size)}</span>${p.status !== 'sold' ? `<span class="st-m ${p.status}">${ST[p.status]}</span>` : ''}</span>
        </div>
      </div>
    </article>`;
  };

  function render() {
    const ts = (TYPES.find(t => t[0] === state.type) || [])[2];
    let list = live.filter(p =>
      (!state.brand || p.brand === state.brand) &&
      (!ts || ts.includes(p.type)) &&
      (!state.st || p.status === state.st) &&
      (!state.q || `${p.brand} ${p.name} ${p.type} ${p.size}`.toLowerCase().includes(state.q)));
    if (state.sort === 'new') list.sort((a, b) => b.id - a.id);
    if (state.sort === 'cheap') list.sort((a, b) => (a.price || 1e9) - (b.price || 1e9));
    if (state.sort === 'exp') list.sort((a, b) => b.price - a.price);
    const scarf = p => /^Шарф/i.test(p.name);
    const hat = p => /^(Шапка|Морская фуражка|Sailor)/i.test(p.name);
    list = list.filter(p => !scarf(p) && !hat(p)).concat(list.filter(hat), list.filter(scarf));
    $('#grid').innerHTML = list.map(card).join('');
    $('#empty').hidden = list.length > 0;
    $('#shopNum').textContent = list.length;
    observe();
  }
  $('#soldGrid').innerHTML = sold.slice().sort((a, b) => b.id - a.id).map(card).join('');
  $('#soldNum').textContent = soldCount;

  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -40px' }) : null;
  function observe() { document.querySelectorAll('.reveal:not(.vis)').forEach(el => io ? io.observe(el) : el.classList.add('vis')); }

  document.addEventListener('click', e => {
    const c = e.target.closest('.card');
    if (c) openModal(+c.dataset.id);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('card')) openModal(+e.target.dataset.id);
    if (e.key === 'Escape') closeAll();
    if (!$('#modal').hidden && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) gal(e.key === 'ArrowRight' ? 1 : -1);
  });

  /* ---------- модалка ---------- */
  let gi = 0, gp = null;
  function openModal(id) {
    const p = ALL.find(x => x.id === id); if (!p) return;
    gp = p; gi = 0;
    const many = p.photos.length > 1;
    $('#modalBody').innerHTML = `
      <div class="gallery">
        <img class="main" id="gMain" src="${p.photos[0] || 'logo.jpg'}" alt="${esc(p.name)}">
        ${many ? `<button class="gnav prev" data-g="-1" aria-label="Назад">‹</button><button class="gnav next" data-g="1" aria-label="Вперёд">›</button>
        <div class="thumbs">${p.photos.map((s, i) => `<img src="${th(s)}" data-full="${s}" onerror="this.onerror=null;this.src=this.dataset.full" data-i="${i}" class="${i ? '' : 'on'}" alt="">`).join('')}</div>` : ''}
      </div>
      <div class="details">
        <span class="badge ${p.status}" style="position:static;align-self:flex-start">${ST[p.status]}</span>
        <span class="brand">${esc(p.brand)}</span>
        <h3>${esc(p.name)}</h3>
        <div class="price">${p.status === 'sold' ? 'Продано' : priceLabel(p)}</div>
        <dl class="specs">
          <dt>Размер</dt><dd>${esc(p.size)}</dd>
          ${p.cond ? `<dt>Состояние</dt><dd>${esc(p.cond)}</dd>` : ''}
          <dt>Категория</dt><dd>${esc(p.type)}</dd>
        </dl>
        ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ''}
        <div class="acts">
          ${p.status === 'sold' ? '' : `<a class="btn btn-fire full" href="${dm('Привет, хочу купить ' + p.name + '\n' + p.post)}" target="_blank" rel="noopener">Купить — написать @${ADMIN}</a>`}
          <a class="tglink" href="${p.post}" target="_blank" rel="noopener">Пост в канале ↗</a>
        </div>
      </div>`;
    $('#veil').hidden = false; $('#modal').hidden = false; document.body.classList.add('lock');
    $('#modal').scrollTop = 0;
  }
  function gal(d) {
    if (!gp || gp.photos.length < 2) return;
    gi = (gi + d + gp.photos.length) % gp.photos.length; setG();
  }
  function setG() {
    $('#gMain').src = gp.photos[gi];
    document.querySelectorAll('.thumbs img').forEach((t, i) => t.classList.toggle('on', i === gi));
  }
  $('#modal').addEventListener('click', e => {
    const g = e.target.closest('[data-g]'); if (g) { gal(+g.dataset.g); return; }
    const t = e.target.closest('.thumbs img'); if (t) { gi = +t.dataset.i; setG(); }
  });
  let tx = 0;
  $('#modal').addEventListener('touchstart', e => { if (e.target.id === 'gMain') tx = e.touches[0].clientX; }, { passive: true });
  $('#modal').addEventListener('touchend', e => { if (e.target.id === 'gMain' && tx) { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) gal(dx < 0 ? 1 : -1); tx = 0; } });

  function closeAll() {
    $('#veil').hidden = true; $('#modal').hidden = true; document.body.classList.remove('lock');
  }
  $('#veil').addEventListener('click', closeAll);
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeAll));


  let tt;
  function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 2600); }

  /* ---------- искры ---------- */
  const cv = $('#embers'), ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, parts = [];
  const resize = () => { const r = devicePixelRatio || 1; W = cv.width = innerWidth * r; H = cv.height = innerHeight * r; };
  resize(); addEventListener('resize', resize);
  const N = innerWidth < 600 ? 28 : 60;
  const spawn = (init) => ({
    x: Math.random() * W, y: init ? Math.random() * H : H + 10,
    r: (Math.random() * 2 + .6) * (devicePixelRatio || 1),
    vy: -(Math.random() * .9 + .35) * (devicePixelRatio || 1),
    vx: (Math.random() - .5) * .4, w: Math.random() * Math.PI * 2,
    life: 1, decay: Math.random() * .003 + .0015,
    hue: 15 + Math.random() * 30
  });
  for (let i = 0; i < N; i++) parts.push(spawn(true));
  function tick() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      p.w += .03; p.x += p.vx + Math.sin(p.w) * .5; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0 || p.y < -10) Object.assign(p, spawn(false));
      const a = Math.max(0, p.life);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, `hsla(${p.hue},100%,65%,${a})`);
      g.addColorStop(1, `hsla(${p.hue},100%,50%,0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  if (!reduce) tick();

  render();
  setTimeout(() => { const l = document.getElementById('loader'); if (l) l.remove(); }, 2600);
})();
