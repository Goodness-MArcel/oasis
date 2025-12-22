document.addEventListener('DOMContentLoaded', () => {
  // Basic UI initialisation (works even if Bootstrap JS fails to load)

  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileOverlay = document.getElementById('mobileMenuOverlay');
  const adminShell = document.querySelector('.admin-shell');
  const MOBILE_BREAKPOINT = 992;
  const openSidebar = () => {
    mobileMenu.classList.add('is-open');
    mobileMenu.removeAttribute('hidden');
    if (mobileOverlay) mobileOverlay.classList.add('active');
    document.body.classList.add('sidebar-open');
  };
  const closeSidebar = () => {
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('hidden', '');
    if (mobileOverlay) mobileOverlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
  };

  // Ensure sidebar/overlay state matches viewport
  const ensureSidebarForViewport = () => {
    if (!mobileMenu) return;
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      closeSidebar();
      if (adminShell) adminShell.classList.remove('admin-shell-collapsed');
    } else {
      mobileMenu.classList.remove('is-open');
      if (mobileMenu.hasAttribute('hidden')) mobileMenu.removeAttribute('hidden');
      if (mobileOverlay) mobileOverlay.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    }
  };

  ensureSidebarForViewport();
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(ensureSidebarForViewport, 120);
  });

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) return;
      if (mobileMenu.classList.contains('is-open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', () => {
      if (!mobileMenu) return;
      if (mobileMenu.classList.contains('is-open')) {
        closeSidebar();
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
