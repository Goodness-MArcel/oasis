document.addEventListener('DOMContentLoaded', () => {
  // Basic UI initialisation (works even if Bootstrap JS fails to load)

  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileOverlay = document.getElementById('mobileMenuOverlay');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const isHidden = mobileMenu.hasAttribute('hidden');
      if (isHidden) {
        mobileMenu.removeAttribute('hidden');
        if (mobileOverlay) mobileOverlay.classList.add('active');
      } else {
        mobileMenu.setAttribute('hidden', '');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
      }
    });
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', () => {
      if (!mobileMenu.hasAttribute('hidden')) {
        mobileMenu.setAttribute('hidden', '');
      }
      mobileOverlay.classList.remove('active');
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

  // Initialise AOS scroll animations (if library is loaded)
  if (typeof AOS !== 'undefined') {
	AOS.init({
	  duration: 800,
	  easing: 'ease-out-quart',
	  once: true,
	  offset: 80,
	});
  }

  // Admin sidebar collapse/expand toggle with persisted state
  const adminShell = document.querySelector('.admin-shell');
  const adminSidebarToggle = document.getElementById('adminSidebarToggle');
  if (adminShell && adminSidebarToggle) {
    const STORAGE_KEY = 'io_admin_sidebar_collapsed';

    const applySidebarState = (collapsed) => {
      adminShell.classList.toggle('admin-shell-collapsed', collapsed);
      const icon = adminSidebarToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-angles-left', !collapsed);
        icon.classList.toggle('fa-angles-right', collapsed);
      }
    };

    // Initialise from localStorage
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'true') {
        applySidebarState(true);
      }
    } catch (e) {
      // Ignore storage errors (e.g. private mode)
    }

    adminSidebarToggle.addEventListener('click', () => {
      const willCollapse = !adminShell.classList.contains('admin-shell-collapsed');
      applySidebarState(willCollapse);
      try {
        window.localStorage.setItem(STORAGE_KEY, String(willCollapse));
      } catch (e) {
        // Ignore storage errors
      }
    });
  }
});
