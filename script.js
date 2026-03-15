// Smooth scroll and active link highlight
const links = document.querySelectorAll('a[href^="#"]');
links.forEach(link => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    if (targetId.startsWith('#')) {
      event.preventDefault();
      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

const menuLinks = document.querySelectorAll('header nav a');
function setActiveLink() {
  const fromTop = window.scrollY + 100;
  menuLinks.forEach(link => {
    if (!link.hash) return;
    const section = document.querySelector(link.hash);
    if (!section) return;
    const top = section.offsetTop;
    const height = section.offsetHeight;
    link.classList.toggle('active', fromTop >= top && fromTop < top + height);
  });
}
window.addEventListener('scroll', setActiveLink);
setActiveLink();
