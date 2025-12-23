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

  // Signup form submit spinner
  const signupForm = document.getElementById('signupForm');
  const signupSubmitBtn = document.getElementById('signupSubmitBtn');
  if (signupForm && signupSubmitBtn) {
    signupForm.addEventListener('submit', () => {
      const spinner = signupSubmitBtn.querySelector('.spinner-border');
      const textWrapper = signupSubmitBtn.querySelector('.signup-btn-text');
      signupSubmitBtn.disabled = true;
      if (spinner) {
        spinner.classList.remove('d-none');
      }
      if (textWrapper) {
        textWrapper.classList.add('opacity-75');
      }
    });
  }

  // Inline profile edit (user profile page)
  const editProfileToggle = document.getElementById('editProfileToggle');
  const profileStaticView = document.getElementById('profileStaticView');
  const profileEditView = document.getElementById('profileEditView');
  const profileUsernameValue = document.getElementById('profileUsernameValue');
  const profileEmailValue = document.getElementById('profileEmailValue');
  const editUsernameInput = document.getElementById('editUsername');
  const editEmailInput = document.getElementById('editEmail');
  const profileEditCancel = document.getElementById('profileEditCancel');

  const profileEditForm = document.getElementById('profileEditView');
  const profileEditSubmitBtn = profileEditForm
    ? profileEditForm.querySelector('button[type="submit"]')
    : null;

  if (editProfileToggle && profileStaticView && profileEditView && editUsernameInput && editEmailInput) {
    const showEdit = () => {
      profileStaticView.classList.add('d-none');
      profileEditView.classList.remove('d-none');
      editUsernameInput.focus();
    };

    const hideEdit = () => {
      profileEditView.classList.add('d-none');
      profileStaticView.classList.remove('d-none');
    };

    editProfileToggle.addEventListener('click', showEdit);

    if (profileEditCancel) {
      profileEditCancel.addEventListener('click', () => {
        // Reset inputs back to current static values
        if (profileUsernameValue) {
          editUsernameInput.value = profileUsernameValue.textContent.trim();
        }
        if (profileEmailValue) {
          editEmailInput.value = profileEmailValue.textContent.trim();
        }
        hideEdit();
      });
    }

    if (profileEditForm && profileEditSubmitBtn) {
      profileEditForm.addEventListener('submit', () => {
        profileEditSubmitBtn.disabled = true;
        profileEditSubmitBtn.textContent = 'Saving...';
      });
    }

  }

  // User login form submit spinner
  const loginForm = document.getElementById('loginForm');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  if (loginForm && loginSubmitBtn) {
    loginForm.addEventListener('submit', () => {
      const spinner = loginSubmitBtn.querySelector('.spinner-border');
      const textWrapper = loginSubmitBtn.querySelector('.login-btn-text');
      loginSubmitBtn.disabled = true;
      if (spinner) {
        spinner.classList.remove('d-none');
      }
      if (textWrapper) {
        textWrapper.classList.add('opacity-75');
      }
    });
  }

  // Admin login form submit spinner
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminLoginSubmitBtn = document.getElementById('adminLoginSubmitBtn');
  if (adminLoginForm && adminLoginSubmitBtn) {
    adminLoginForm.addEventListener('submit', () => {
      const spinner = adminLoginSubmitBtn.querySelector('.spinner-border');
      const textWrapper = adminLoginSubmitBtn.querySelector('.admin-login-btn-text');
      adminLoginSubmitBtn.disabled = true;
      if (spinner) {
        spinner.classList.remove('d-none');
      }
      if (textWrapper) {
        textWrapper.classList.add('opacity-75');
      }
    });
  }

  // User logout confirmation modal
  const userLogoutButton = document.getElementById('userLogoutButton');
  const userLogoutForm = document.getElementById('userLogoutForm');
  const userLogoutModalEl = document.getElementById('userLogoutModal');
  const userLogoutConfirmBtn = document.getElementById('userLogoutConfirmBtn');

  if (userLogoutButton && userLogoutForm) {
    let logoutModal = null;

    if (userLogoutModalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      logoutModal = new bootstrap.Modal(userLogoutModalEl);
    }

    userLogoutButton.addEventListener('click', () => {
      if (logoutModal) {
        logoutModal.show();
      } else {
        // Fallback: simple confirm or direct logout if Bootstrap/modal is unavailable
        if (window.confirm('Are you sure you want to log out?')) {
          userLogoutForm.submit();
        }
      }
    });

    if (userLogoutConfirmBtn) {
      userLogoutConfirmBtn.addEventListener('click', () => {
        if (logoutModal) {
          logoutModal.hide();
        }
        userLogoutForm.submit();
      });
    }
  }

  // Admin dashboard: meetings calendar (FullCalendar)
  const adminCalendarEl = document.getElementById('adminMeetingsCalendar');
  if (adminCalendarEl && typeof FullCalendar !== 'undefined' && FullCalendar.Calendar) {
    try {
      const calendar = new FullCalendar.Calendar(adminCalendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        height: '100%',
        selectable: true,
        selectMirror: true,
        select: function (info) {
          const title = window.prompt('Meeting title for ' + info.startStr + '?');
          if (title) {
            calendar.addEvent({
              title: title,
              start: info.start,
              end: info.end,
              allDay: info.allDay
            });
          }
          calendar.unselect();
        },
        eventClick: function (info) {
          const shouldRemove = window.confirm('Remove meeting "' + info.event.title + '"?');
          if (shouldRemove) {
            info.event.remove();
          }
        },
        events: []
      });
      calendar.render();
    } catch (err) {
      console.error('Error initialising admin meetings calendar:', err);
    }
  }
});
