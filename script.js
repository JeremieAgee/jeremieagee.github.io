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
