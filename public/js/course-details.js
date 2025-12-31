// Course Details Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tabs
    const triggerTabList = [].slice.call(document.querySelectorAll('#courseTabs button'));
    triggerTabList.forEach(function (triggerEl) {
        const tabTrigger = new bootstrap.Tab(triggerEl);
        triggerEl.addEventListener('click', function (event) {
            event.preventDefault();
            tabTrigger.show();
        });
    });

    // Handle URL hash for direct tab linking
    const hash = window.location.hash;
    if (hash) {
        const tabId = hash.substring(1); // Remove the #
        const tabElement = document.getElementById(tabId + '-tab');
        if (tabElement) {
            tabElement.click();
        }
    }

    // Update URL when tabs are clicked (optional - for bookmarkable tabs)
    document.querySelectorAll('#courseTabs button').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const target = event.target.getAttribute('data-bs-target');
            const tabId = target.substring(1); // Remove the #
            history.replaceState(null, null, '#' + tabId);
        });
    });

    // Enrollment button functionality (placeholder)
    const enrollButton = document.querySelector('.btn-success');
    if (enrollButton) {
        enrollButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Here you would implement enrollment logic
            alert('Enrollment functionality will be implemented soon!');
        });
    }

    // Smooth scroll for any anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading state for tab switches (optional enhancement)
    document.querySelectorAll('#courseTabs button').forEach(tab => {
        tab.addEventListener('show.bs.tab', function () {
            // Could add loading spinner here if needed
        });

        tab.addEventListener('shown.bs.tab', function () {
            // Remove loading spinner here if needed
        });
    });
});