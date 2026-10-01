const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
  });
}

const sectionLinks = [...document.querySelectorAll('.section-nav a[href^="#"]')];
const observedSections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && observedSections.length) {
  const observer = new IntersectionObserver((entries) => {
    const visibleSection = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visibleSection) return;

    sectionLinks.forEach((link) => {
      const isCurrent = link.getAttribute('href') === `#${visibleSection.target.id}`;
      if (isCurrent) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-15% 0px -65% 0px', threshold: [0, 0.25, 0.5] });

  observedSections.forEach((section) => observer.observe(section));
}

const backToTopButton = document.querySelector('.back-to-top');

if (backToTopButton) {
  const updateBackToTop = () => {
    backToTopButton.classList.toggle('is-visible', window.scrollY > 500);
  };

  window.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();

  backToTopButton.addEventListener('click', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}
