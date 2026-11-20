(() => {
  const ADMIN = 'burnadmin';
  const DATA = window.SHOP_DATA || { products: [] };
  const ALL = DATA.products;
  const live = ALL.filter(p => p.status !== 'sold');
  const sold = ALL.filter(p => p.status === 'sold');
  const $ = s => document.querySelector(s);
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
  $('#heroLive').textContent = cnt('in');
  $('#upd').textContent = new Date(DATA.updated).toLocaleDateString('ru-RU');
  const countUp = (el, to) => {
    const t0 = performance.now(), d = 1200;
    const step = t => { const k = Math.min(1, (t - t0) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    setTimeout(() => requestAnimationFrame(step), 1500);
  };
  countUp($('#stIn'), cnt('in')); countUp($('#stTr'), cnt('transit')); countUp($('#stSold'), sold.length);

  const brands = [...new Set(ALL.map(p => p.brand))].filter(b => !['No Name', 'Vintage', 'Japan Brand'].includes(b));
  const mq = brands.map(b => `<span>${esc(b)}</span><i>✦</i>`).join('');
  $('#marquee').innerHTML = mq + mq;

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
    const alt = p.photos[1] ? `<img class="alt" src="${p.photos[1]}" alt="" loading="lazy">` : '';
    return `<article class="card reveal" data-id="${p.id}" tabindex="0">
      <div class="ph">
        <span class="badge ${p.status}">${ST[p.status]}</span>
        <img src="${p.photos[0] || 'logo.jpg'}" alt="${esc(p.name)}" loading="lazy">${alt}
      </div>
      <div class="meta">
        <span class="brand">${esc(p.brand)}</span>
        <span class="name">${esc(p.name)}</span>
        <div class="row">
          <span class="price${p.price || p.options || p.status === 'sold' ? '' : ' deal'}">${p.status === 'sold' ? '—' : priceLabel(p)}</span>
          <span class="size">${esc(p.size)}</span>
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
  $('#soldNum').textContent = sold.length;

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
        <div class="thumbs">${p.photos.map((s, i) => `<img src="${s}" data-i="${i}" class="${i ? '' : 'on'}" alt="">`).join('')}</div>` : ''}
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
          ${p.status === 'sold'
            ? `<a class="btn btn-fire full" href="https://t.me/${ADMIN}" target="_blank" rel="noopener">Хочу похожее — привези</a>`
            : `<a class="btn btn-fire full" href="https://t.me/${ADMIN}" target="_blank" rel="noopener">Купить — написать @${ADMIN}</a>`}
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
