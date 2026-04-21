// ── Smooth scroll ────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href');
    const target = id.length > 1 && document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Active nav highlight on scroll ───────────────────────
const navLinks = document.querySelectorAll('.page-header nav a[href^="#"]');
function highlightNav() {
  const scrollY = window.scrollY + 120;
  navLinks.forEach(link => {
    const section = document.querySelector(link.hash);
    if (!section) return;
    const inView = scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight;
    link.classList.toggle('active', inView);
  });
}
window.addEventListener('scroll', highlightNav, { passive: true });
highlightNav();

// ── Fade-up on scroll (IntersectionObserver) ─────────────
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.produto-card, .diferencial-card, .cidade-pill, .preco-card, .mvv-card, .valor-card, .contato-card'
).forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity .55s cubic-bezier(.22,1,.36,1), transform .55s cubic-bezier(.22,1,.36,1)';
  io.observe(el);
});

// ── Sticky header shadow on scroll ───────────────────────
const header = document.querySelector('.page-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 20
      ? '0 4px 20px rgba(120,60,10,.10)'
      : 'none';
  }, { passive: true });
}
