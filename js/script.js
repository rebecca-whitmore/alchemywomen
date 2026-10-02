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

const cardSearch = document.querySelector('[data-card-search]');

if (cardSearch) {
  const cards = [...document.querySelectorAll('.library-card')];
  const resultCount = document.querySelector('[data-result-count]');
  const emptyState = document.querySelector('.library-empty');

  cardSearch.addEventListener('input', () => {
    const query = cardSearch.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const matches = !query || card.dataset.card.includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    document.querySelectorAll('.minor-suit').forEach((suit) => {
      const hasVisibleCards = [...suit.querySelectorAll('.library-card')]
        .some((card) => !card.hidden);
      suit.hidden = !hasVisibleCards;
    });
    if (resultCount) resultCount.textContent = visible;
    if (emptyState) emptyState.hidden = visible !== 0;
  });
}

const forminitForms = document.querySelectorAll('[data-forminit-form]');

forminitForms.forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const message = form.querySelector('[data-form-message]');
    const submitButton = form.querySelector('[type="submit"]');
    const originalButtonText = submitButton.textContent;

    message.textContent = '';
    message.className = 'form-note';
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';

    try {
      if (typeof Forminit === 'undefined') {
        throw new Error('The form service could not be loaded. Please try again.');
      }

      const forminit = new Forminit();
      const { error } = await forminit.submit('y6dkzr5fuji', new FormData(form));

      if (error) {
        throw new Error(error.message || 'We could not register your details. Please try again.');
      }

      message.textContent = 'Thank you — you’re registered for Alchemy Women updates.';
      message.classList.add('is-success');
      form.reset();
    } catch (error) {
      message.textContent = error.message || 'Something went wrong. Please try again.';
      message.classList.add('is-error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
});
