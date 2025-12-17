document.addEventListener('DOMContentLoaded', () => {
  // Basic UI initialisation (works even if Bootstrap JS fails to load)

  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const isHidden = mobileMenu.hasAttribute('hidden');
      if (isHidden) {
        mobileMenu.removeAttribute('hidden');
      } else {
        mobileMenu.setAttribute('hidden', '');
      }
    });
  }

  // Manually initialize Bootstrap Carousel
  const carouselElement = document.getElementById('testimonialsCarousel');
  if (carouselElement) {
    if (typeof bootstrap !== 'undefined' && bootstrap.Carousel) {
      try {
        new bootstrap.Carousel(carouselElement, {
          interval: 5000,
          ride: 'carousel',
          wrap: true,
          keyboard: true,
          pause: 'hover'
        });
      } catch (error) {
        console.error('Error initializing carousel:', error);
      }
    }
  } else {
    // No carousel on this page – safe to ignore
  }

  // Manually initialize Bootstrap Accordion
  const accordionElement = document.getElementById('faqAccordion');
  if (accordionElement) {
    if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
      try {
        const collapseElements = accordionElement.querySelectorAll('.accordion-collapse');
        collapseElements.forEach((collapseElement) => {
          new bootstrap.Collapse(collapseElement, {
            toggle: false
          });
        });
      } catch (error) {
        console.error('Error initializing accordion:', error);
      }
    }
  } else {
    // No accordion on this page – safe to ignore
  }
});
