const door = document.querySelector('.arcade-door');

if (door) {
  door.addEventListener('click', function(event) {
    event.preventDefault();
    if (door.classList.contains('zooming')) return;
    door.classList.add('zooming');
    document.body.classList.add('zooming-body');
    setTimeout(() => {
      window.location.href = door.href;
    }, 700);
  });
}
