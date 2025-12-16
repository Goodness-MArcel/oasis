document.addEventListener('DOMContentLoaded', () => {
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

  // Handle mobile Training submenu toggle
  const trainingToggle = document.querySelector('[data-bs-target="#mobileTrainingMenu"]');
  const trainingMenu = document.getElementById('mobileTrainingMenu');
  
  if (trainingToggle && trainingMenu) {
    trainingToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = trainingToggle.getAttribute('aria-expanded') === 'true';
      
      if (isExpanded) {
        trainingMenu.classList.remove('show');
        trainingToggle.setAttribute('aria-expanded', 'false');
      } else {
        trainingMenu.classList.add('show');
        trainingToggle.setAttribute('aria-expanded', 'true');
      }
    });
  }
});
