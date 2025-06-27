// Placeholder for future interactivity
console.log('Walmart homepage replica loaded.');

// Scroll animation for product cards
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
    } else {
      entry.target.classList.remove('in-view');
    }
  });
}, {
  threshold: 0.15
});

document.querySelectorAll('.product-card').forEach(card => {
  observer.observe(card);
});

// Hero slider auto-slide
const heroSlides = document.querySelectorAll('.hero-slide');
const heroDots = document.querySelectorAll('.hero-dot');
let currentHero = 0;
let heroInterval;

function showHeroSlide(idx) {
  heroSlides.forEach((slide, i) => {
    slide.classList.toggle('active', i === idx);
    heroDots[i].classList.toggle('active', i === idx);
  });
  currentHero = idx;
}

function nextHeroSlide() {
  let next = (currentHero + 1) % heroSlides.length;
  showHeroSlide(next);
}

function startHeroAutoSlide() {
  heroInterval = setInterval(nextHeroSlide, 4000);
}

function stopHeroAutoSlide() {
  clearInterval(heroInterval);
}

heroDots.forEach((dot, idx) => {
  dot.addEventListener('click', () => {
    showHeroSlide(idx);
    stopHeroAutoSlide();
    startHeroAutoSlide();
  });
});

// Hero slider arrow navigation
const leftArrow = document.querySelector('.hero-arrow-left');
const rightArrow = document.querySelector('.hero-arrow-right');

leftArrow.addEventListener('click', () => {
  let prev = (currentHero - 1 + heroSlides.length) % heroSlides.length;
  showHeroSlide(prev);
  stopHeroAutoSlide();
  startHeroAutoSlide();
});

rightArrow.addEventListener('click', () => {
  nextHeroSlide();
  stopHeroAutoSlide();
  startHeroAutoSlide();
});

showHeroSlide(0);
startHeroAutoSlide();

// Product search functionality for index.html

document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.querySelector('.search-minimal');
  if (!searchForm) return;
  const input = searchForm.querySelector('input[type="text"]');
  input.setAttribute('placeholder', 'Search by product or price…');
  input.setAttribute('aria-label', 'Search products');
  const button = searchForm.querySelector('button');
  const grid = document.querySelector('.products-grid');
  let clearBtn = null;
  let noResultsMsg = null;
  let searching = false;

  function setSearching(isSearching) {
    searching = isSearching;
    if (searching) {
      button.innerHTML = '<span class="fa fa-spinner fa-spin" aria-label="Searching…"></span>';
      button.disabled = true;
    } else {
      button.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
      button.disabled = false;
    }
  }

  function filterProducts() {
    setSearching(true);
    setTimeout(() => { // Simulate loading for UX
      const query = input.value.trim().toLowerCase();
      const cards = Array.from(grid.querySelectorAll('.product-card'));
      let anyMatch = false;
      let matchCards = [];
      let nonMatchCards = [];
      cards.forEach(card => {
        const title = card.querySelector('.product-title').textContent.toLowerCase();
        const price = card.querySelector('.product-price').textContent.toLowerCase();
        if (title.includes(query) || price.includes(query)) {
          card.classList.remove('fade-out');
          card.style.display = '';
          anyMatch = true;
          matchCards.push(card);
        } else {
          card.classList.add('fade-out');
          card.style.display = '';
          nonMatchCards.push(card);
        }
      });
      // Move matching cards to the top
      if (query) {
        matchCards.forEach(card => grid.appendChild(card));
        nonMatchCards.forEach(card => grid.appendChild(card));
      }
      // Show/hide no results message
      if (!anyMatch) {
        if (!noResultsMsg) {
          noResultsMsg = document.createElement('div');
          noResultsMsg.className = 'no-results-message';
          noResultsMsg.textContent = 'No products found.';
          grid.appendChild(noResultsMsg);
        }
      } else if (noResultsMsg) {
        noResultsMsg.remove();
        noResultsMsg = null;
      }
      // Add clear button if searching
      if (query && !clearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.textContent = '×';
        clearBtn.className = 'search-clear-btn';
        clearBtn.type = 'button';
        clearBtn.setAttribute('aria-label', 'Clear search');
        input.parentNode.appendChild(clearBtn);
        clearBtn.addEventListener('click', function() {
          input.value = '';
          filterProducts();
          clearBtn.remove();
          clearBtn = null;
          input.focus();
        });
      } else if (!query && clearBtn) {
        clearBtn.remove();
        clearBtn = null;
      }
      setSearching(false);
    }, 350); // Simulate a short delay for UX
  }

  // Search on button click
  button.addEventListener('click', function(e) {
    e.preventDefault();
    filterProducts();
  });
  // Search on Enter
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      filterProducts();
    }
  });
  // Live search as you type (optional, can uncomment)
  // input.addEventListener('input', filterProducts);
}); 