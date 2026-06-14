const hotspot = document.querySelector('.door-hotspot');
const wrap = document.querySelector('.arcade-wrap');

if (hotspot && wrap) {
  hotspot.addEventListener('click', function (e) {
    e.preventDefault();
    if (wrap.classList.contains('zooming')) return;
    wrap.classList.add('zooming');
    setTimeout(() => {
      window.location.href = hotspot.href;
    }, 800);
  });
}

const menuBtn = document.querySelector('.menu-btn');
const dropdownMenu = document.querySelector('.dropdown-menu');

if (menuBtn && dropdownMenu) {
  menuBtn.addEventListener('click', () => {
    dropdownMenu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', dropdownMenu.classList.contains('open'));
  });

  dropdownMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      dropdownMenu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-menu')) {
      dropdownMenu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });
}
