const cards = document.querySelectorAll('.card');

cards.forEach((card) => {
  const video = card.querySelector('video');
  if (!video) return;

  card.addEventListener('mouseenter', () => {
    video.currentTime = 0;
    video.play().catch(() => {});
  });

  card.addEventListener('mouseleave', () => {
    video.pause();
    video.currentTime = 0;
  });
});

let lockLoop = false;
window.addEventListener('scroll', () => {
  if (lockLoop) return;

  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 2;
  if (nearBottom) {
    lockLoop = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      lockLoop = false;
    }, 700);
  }
});
