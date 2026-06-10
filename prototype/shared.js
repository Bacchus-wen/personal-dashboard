const icons = {
  home: '<svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M9 20v-6h6v6"/></svg>',
  articles: '<svg viewBox="0 0 24 24"><path d="M6 3h11a2 2 0 0 1 2 2v15H7a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1Z"/><path d="M8 7h7M8 11h7M8 15h5"/></svg>',
  projects: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>',
  about: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M8.5 13.5c1.8 1.8 5.2 1.8 7 0M9 9.5h.01M15 9.5h.01"/></svg>',
  resources: '<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/></svg>',
  blogs: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>'
};
const navItems = [
  ['home','theodore-personal-dashboard.html','首页'], ['articles','articles.html','近期文章'], ['projects','projects.html','我的项目'],
  ['about','about.html','关于网站'], ['resources','resources.html','推荐分享'], ['blogs','blogs.html','优秀博客']
];
function mountChrome() {
  const page = document.body.dataset.page || 'home';
  const activePage = page === 'album' ? 'home' : page;
  const action = document.body.dataset.action;
  const nav = document.createElement('nav');
  nav.className = 'top-nav glass';
  nav.setAttribute('aria-label','页面导航');
  nav.innerHTML = navItems.map(([id, href, label], index) =>
    `<a class="${index === 0 ? 'avatar-link' : 'nav-link'} ${activePage === id ? 'active' : ''}" href="${href}" aria-label="${label}" title="${label}">${index === 0 ? '<span class="avatar">T</span>' : icons[id]}</a>`
  ).join('');
  if (page !== 'home') {
    nav.insertAdjacentHTML('afterbegin', '<span class="nav-glider" aria-hidden="true"></span>');
    document.body.append(nav);
    setupNavGlider(nav);
  }
  if (action) {
    const btn = document.createElement('button');
    btn.className = 'page-action';
    btn.textContent = action;
    btn.addEventListener('click', () => btn.textContent = action === '导入密钥' ? '等待密钥' : '已进入编辑');
    document.body.append(btn);
  }
  const tools = document.createElement('div');
  tools.className = 'floating-tools';
  tools.innerHTML = `<button class="tool-btn" aria-label="切换氛围" title="切换氛围"><svg viewBox="0 0 24 24"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/></svg></button><button class="tool-btn" aria-label="回到顶部" title="回到顶部"><svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg></button>`;
  tools.lastElementChild.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  tools.firstElementChild.addEventListener('click', () => document.body.classList.toggle('quiet'));
  document.body.append(tools);
}
function setupNavGlider(nav) {
  const glider = nav.querySelector('.nav-glider');
  const links = [...nav.querySelectorAll('a')];
  const active = nav.querySelector('a.active') || links[0];
  const moveTo = target => {
    if (!target || !glider) return;
    glider.style.setProperty('--glider-x', `${target.offsetLeft}px`);
    glider.style.setProperty('--glider-y', `${target.offsetTop}px`);
    glider.classList.add('is-visible');
  };

  links.forEach(link => link.addEventListener('pointerenter', () => moveTo(link)));
  nav.addEventListener('pointerleave', () => moveTo(active));
  window.addEventListener('resize', () => moveTo(active));
  requestAnimationFrame(() => moveTo(active));
}
function setupFilters() {
  document.querySelectorAll('[data-filter-group]').forEach(group => {
    const applyFilter = value => document.querySelectorAll('[data-category]').forEach(card => card.classList.toggle('hidden', value !== 'all' && value && !card.dataset.category.includes(value)));
    group.addEventListener('click', event => {
      const button = event.target.closest('.filter');
      if (!button) return;
      group.querySelectorAll('.filter').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      applyFilter(button.dataset.filter);
    });
    applyFilter(group.querySelector('.filter.active')?.dataset.filter);
  });
  document.querySelectorAll('[data-search]').forEach(input => {
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      document.querySelectorAll('[data-searchable]').forEach(card => card.classList.toggle('hidden', !card.textContent.toLowerCase().includes(query)));
    });
  });
}
function setupClock() {
  const clock = document.querySelector('[data-clock]');
  const date = document.querySelector('[data-date]');
  if (!clock) return;
  const tick = () => {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});
    if (date) date.textContent = now.toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'short'});
  };
  tick();
  setInterval(tick, 1000);
}
function setupGreeting() {
  const greeting = document.querySelector('.welcome h1');
  if (!greeting) return;
  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) greeting.textContent = 'Good Night';
    else if (hour < 12) greeting.textContent = 'Good Morning';
    else if (hour < 18) greeting.textContent = 'Good Afternoon';
    else if (hour < 22) greeting.textContent = 'Good Evening';
    else greeting.textContent = 'Good Night';
  };
  updateGreeting();
  setInterval(updateGreeting, 60000);
}
function setupPlayer() {
  const player = document.querySelector('.player');
  const play = document.querySelector('.play');
  if (!player || !play) return;
  play.addEventListener('click', () => {
    player.classList.toggle('playing');
    play.textContent = player.classList.contains('playing') ? 'Ⅱ' : '▶';
  });
}
function setupAlbum() {
  let layer = 10;
  document.querySelectorAll('.polaroid').forEach(photo => photo.addEventListener('click', () => photo.style.zIndex = ++layer));
}
document.addEventListener('DOMContentLoaded', () => {
  mountChrome(); setupFilters(); setupClock(); setupGreeting(); setupPlayer(); setupAlbum();
});
