let index = 0;

const slides = document.getElementById("slides");
const totalSlides = slides ? slides.children.length : 0;

function moveSlide(step) {
  if (!slides || totalSlides === 0) return;

  index += step;
  if (index < 0) index = totalSlides - 1;
  if (index >= totalSlides) index = 0;

  slides.style.transform = `translateX(-${index * 100}%)`;
}

function getWishlist() {
  try {
    const raw = sessionStorage.getItem('wishlist');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setWishlist(items) {
  try {
    sessionStorage.setItem('wishlist', JSON.stringify(Array.isArray(items) ? items : []));
  } catch (e) {
    // ignore
  }
}

function isBookInWishlist(book) {
  if (!book || !book.title) return false;
  return getWishlist().some((item) => String(item.title || '').trim() === String(book.title || '').trim());
}

window.addBookToWishlist = function addBookToWishlist(book) {
  if (!book || !book.title) return;
  const wishlist = getWishlist();
  const exists = wishlist.some((item) => String(item.title || '').trim() === String(book.title || '').trim());
  if (exists) return;

  wishlist.push({
    title: book.title,
    author: book.author,
    image: book.image,
    price: book.price,
    genre: book.genre
  });
  setWishlist(wishlist);
  try {
    window.dispatchEvent(new Event('wishlist:updated'));
  } catch (e) {}
};

window.removeBookFromWishlist = function removeBookFromWishlist(title) {
  if (!title) return;
  const updated = getWishlist().filter((item) => String(item.title || '').trim() !== String(title || '').trim());
  setWishlist(updated);
  try {
    window.dispatchEvent(new Event('wishlist:updated'));
  } catch (e) {}
};

function getSortOrder() {
  const sortSelect = document.getElementById('sort-order');
  return sortSelect ? sortSelect.value : '';
}

function sortBooks(items) {
  const order = getSortOrder();
  if (!Array.isArray(items) || !order) return items;

  const sorted = [...items];

  if (order === 'title-asc') {
    sorted.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base' }));
  }
  if (order === 'price-asc') {
    sorted.sort((a, b) => Number(a.price) - Number(b.price));
  }
  if (order === 'price-desc') {
    sorted.sort((a, b) => Number(b.price) - Number(a.price));
  }

  return sorted;
}

function getSearchQuery() {
  const searchInput = document.getElementById('search-term');
  return (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();
}

function bookMatchesSearch(book, query) {
  if (!query) return true;

  const title = String(book.title || '').toLowerCase();
  const author = String(book.author || '').toLowerCase();
  const genre = String(book.genre || '').toLowerCase();
  return title.includes(query) || author.includes(query) || genre.includes(query);
}

function scrollBooksToTop() {
  const target = document.querySelector('.all-books-banner') || document.getElementById('books');
  if (!target) return;

  requestAnimationFrame(() => {
    const navbar = document.querySelector('.navbar');
    const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 18;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth'
    });
  });
}

window.toggleAccessibilityMenu = function toggleAccessibilityMenu() {
  const panel = document.getElementById('accessibility-panel');
  if (!panel) return;
  panel.classList.toggle('hidden');
};

window.setPageTheme = function setPageTheme(theme) {
  document.documentElement.classList.remove('grayscale', 'high-contrast', 'reduced-motion', 'dark-mode');
  document.body.classList.remove('grayscale', 'high-contrast', 'reduced-motion', 'dark-mode');
  if (theme) {
    document.documentElement.classList.add(theme);
    document.body.classList.add(theme);
  } else {
    window.zoomLevel = 100;
    if (typeof window.updatePageZoom === 'function') {
      window.updatePageZoom();
    }
  }
};

window.zoomLevel = window.zoomLevel || 100;
window.updatePageZoom = function updatePageZoom() {
  const scale = Math.min(1.4, Math.max(0.8, window.zoomLevel / 100));

  if (window.zoomLevel === 100) {
    document.documentElement.style.fontSize = '';
    document.documentElement.style.zoom = '';
    document.body.style.transform = '';
    document.body.style.transformOrigin = '';
    document.body.style.width = '';
    return;
  }

  document.documentElement.style.fontSize = `${window.zoomLevel}%`;

  if ('zoom' in document.documentElement.style) {
    document.documentElement.style.zoom = scale;
    document.body.style.transform = '';
  } else {
    document.documentElement.style.zoom = '';
    document.body.style.transformOrigin = '0 0';
    document.body.style.transform = `scale(${scale})`;
    document.body.style.width = '100%';
  }
};

window.zoomIn = function zoomIn() {
  window.zoomLevel = Math.min(140, window.zoomLevel + 10);
  window.updatePageZoom();
};

window.zoomOut = function zoomOut() {
  window.zoomLevel = Math.max(80, window.zoomLevel - 10);
  window.updatePageZoom();
};

window.updatePageZoom();

// Auto slide
if (totalSlides > 0) {
  setInterval(() => {
    moveSlide(1);
  }, 3000);
}

// Books rendering
function renderBooks(books) {
  const booksWrap = document.getElementById('books');
  if (!booksWrap) return;

  const safeBooks = Array.isArray(books) ? books : [];
  booksWrap.innerHTML = '';

  for (const b of safeBooks) {
    const stockText = (typeof b.stock === 'number') ? `Stock: ${b.stock}` : `Stock: ${b.stock ?? ''}`;

    const el = document.createElement('div');
    el.className = 'book';    el.innerHTML = `
      <div class="book-img">
        <img src="${b.image}" alt="${b.title}" loading="lazy"
          referrerpolicy="no-referrer"
          onerror="this.onerror=null;this.src='data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#e5e5e5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#666" font-family="Arial" font-size="18">No Image</text></svg>')}';">
        <div class="overlay">
          <button>See Details</button>
        </div>
      </div>

      <h4 class="book-title">${b.title}</h4>
      <p class="book-price">RM${Number(b.price).toFixed(2)}</p>

      <p class="book-author"><span class="book-meta-label">Author:</span> ${b.author}</p>
      <p class="book-genre"><span class="book-meta-label">Genre:</span> ${b.genre ? b.genre : ''}</p>
      <p class="book-stock"><span class="book-meta-label">Stock:</span> ${typeof b.stock === 'number' ? b.stock : (b.stock ?? '')}</p>


      <div class="book-actions">
        <button class="add-to-cart-btn" type="button">Add to Cart</button>
        <button class="wishlist-btn" type="button">${isBookInWishlist(b) ? 'Wishlisted' : 'Add to Wishlist'}</button>
      </div>
    `;

    const seeBtn = el.querySelector('.overlay button');
    if (seeBtn) {
      seeBtn.addEventListener('click', () => {
        window.showBookDetails({
          title: b.title,
          author: b.author,
          genre: b.genre,
          description: b.description || 'No description available.',
          image: b.image,
          price: b.price,
          stock: b.stock
        });
      });
    }

    const addBtn = el.querySelector('.add-to-cart-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        showQuantityModal(b);
      });
    }

    const wishlistBtn = el.querySelector('.wishlist-btn');
    if (wishlistBtn) {
      wishlistBtn.addEventListener('click', () => {
        if (isBookInWishlist(b)) {
          window.removeBookFromWishlist && window.removeBookFromWishlist(b.title);
          wishlistBtn.textContent = 'Add to Wishlist';
          wishlistBtn.classList.remove('wishlisted');
          return;
        }

        window.addBookToWishlist && window.addBookToWishlist(b);
        wishlistBtn.textContent = 'Wishlisted';
        wishlistBtn.classList.add('wishlisted');
      });
    }

    if (wishlistBtn && isBookInWishlist(b)) {
      wishlistBtn.classList.add('wishlisted');
    }

    el.classList.add('reveal');
    booksWrap.appendChild(el);
    setupScrollReveal();
  }
}

function addBookToCart(book, qty) {
  const cart = getCart();
  const idx = Array.isArray(cart) ? cart.findIndex((x) => x.title === book.title) : -1;

  if (idx >= 0) cart[idx].qty = (Number(cart[idx].qty) || 0) + qty;
  else {
    cart.push({
      title: book.title,
      author: book.author,
      genre: book.genre,
      image: book.image,
      price: book.price,
      stock: book.stock,
      qty
    });
  }

  setCart(cart);
  updateCartUI();
  try {
    window.dispatchEvent(new Event('cart:updated'));
  } catch (e) {}
}

function showQuantityModal(book) {
  const existing = document.getElementById('quantity-modal');
  if (existing) existing.remove();

  const stock = Number(book.stock);
  const hasStockLimit = Number.isFinite(stock) && stock >= 0;
  const maxQty = hasStockLimit ? stock : 999;
  const stockLabel = hasStockLimit ? 'Stock: ' + stock : 'Stock available';

  const modal = document.createElement('div');
  modal.id = 'quantity-modal';
  modal.innerHTML = `
    <div class="buy-overlay"></div>
    <div class="buy-modal quantity-modal-box">
      <div class="buy-modal-header">
        <div class="buy-modal-title">Add to Cart</div>
        <button type="button" class="buy-close" aria-label="Close">x</button>
      </div>

      <div class="buy-modal-body">
        <div class="quantity-book">
          <img src="${book.image || ''}" alt="${book.title || ''}" onerror="this.style.display='none'" />
          <div>
            <div class="quantity-book-title">${book.title || ''}</div>
            <div class="quantity-book-meta">RM${Number(book.price).toFixed(2)}</div>
            <div class="quantity-book-meta">${stockLabel}</div>
          </div>
        </div>

        <form class="buy-form quantity-form" onsubmit="return false;">
          <label class="buy-field">
            <span>Quantity</span>
            <input name="quantity" type="number" min="1" max="${maxQty}" step="1" value="1" required />
          </label>

          <div class="buy-actions">
            <button type="button" class="buy-cancel">Cancel</button>
            <button type="submit" class="buy-submit">Add to Cart</button>
          </div>

          <div class="buy-hint quantity-hint">Enter the quantity you want to buy.</div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => {
    try { modal.remove(); } catch (e) {}
  };

  const input = modal.querySelector('input[name="quantity"]');
  const hint = modal.querySelector('.quantity-hint');

  const validateQty = () => {
    const qty = Math.max(1, Math.floor(Number(input.value) || 1));
    input.value = String(qty);

    if (hasStockLimit && qty > stock) {
      if (hint) {
        hint.textContent = 'The quantity entered exceeds the stock quantity. Please enter again.';
        hint.style.color = 'red';
      }
      return null;
    }

    if (hint) {
      hint.textContent = 'Ready to add to cart.';
      hint.style.color = '#666';
    }
    return qty;
  };

  modal.querySelector('.buy-overlay')?.addEventListener('click', close);
  modal.querySelector('.buy-close')?.addEventListener('click', close);
  modal.querySelector('.buy-cancel')?.addEventListener('click', close);
  input?.addEventListener('input', validateQty);

  modal.querySelector('.quantity-form')?.addEventListener('submit', () => {
    const qty = validateQty();
    if (!qty) return;

    addBookToCart(book, qty);
    if (hint) hint.textContent = 'Added to cart.';
    close();
  });

  setTimeout(() => input && input.focus(), 0);
}

function closeFilterPanel() {
  const filterDropdown = document.querySelector('.nav-filter');
  if (filterDropdown && filterDropdown.open) {
    filterDropdown.open = false;
  }
}

async function applyFilters(options = {}) {
  const shouldCloseFilter = options.closeFilter !== false;
  const allBooks = await loadBooksWithAjax();

  const searchQuery = getSearchQuery();

  const AuthorInput = document.getElementById('filter-author');
  const AuthorQuery = (AuthorInput && AuthorInput.value ? AuthorInput.value.trim().toLowerCase() : '');

  const minEl = document.getElementById('filter-price-min');
  const maxEl = document.getElementById('filter-price-max');
  const minVal = minEl && minEl.value !== '' ? Number(minEl.value) : null;
  const maxVal = maxEl && maxEl.value !== '' ? Number(maxEl.value) : null;

  const genreChecks = Array.from(document.querySelectorAll('input.genre-check'));
  const selectedGenres = genreChecks.filter((c) => c.checked).map((c) => c.value);

  const filtered = Array.isArray(allBooks)
    ? allBooks.filter((b) => {
        if (!bookMatchesSearch(b, searchQuery)) return false;

        if (AuthorQuery) {
          const author = String(b.author || '').toLowerCase();
          const title = String(b.title || '').toLowerCase();
          const ok = author.includes(AuthorQuery) || title.includes(AuthorQuery);
          if (!ok) return false;
        }

        if (selectedGenres.length) {
          if (!b.genre || !selectedGenres.includes(b.genre)) return false;
        }

        const price = Number(b.price);
        if (Number.isFinite(price)) {
          if (minVal !== null && price < minVal) return false;
          if (maxVal !== null && price > maxVal) return false;
        }

        return true;
      })
    : [];

  renderBooks(sortBooks(filtered));
  scrollBooksToTop();
  if (shouldCloseFilter) closeFilterPanel();
}

// ----- Scroll reveal for book cards -----
let scrollRevealObserver = null;

function setupScrollReveal() {
  if (scrollRevealObserver) {
    try { scrollRevealObserver.disconnect(); } catch (e) {}
    scrollRevealObserver = null;
  }

  const booksWrap = document.getElementById('books');
  if (!booksWrap) return;

  const cards = Array.from(booksWrap.querySelectorAll('.book'));
  if (!cards.length) return;

  for (const card of cards) {
    card.classList.add('reveal');
  }

  scrollRevealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          scrollRevealObserver && scrollRevealObserver.unobserve(entry.target);
        }
      }
    },
    {
      root: null,
      threshold: 0.15,
      rootMargin: '0px 0px -10% 0px'
    }
  );

  cards.forEach((c) => scrollRevealObserver && scrollRevealObserver.observe(c));
}

let booksLoadPromise = null;

async function loadBooksWithAjax() {
  if (Array.isArray(window.BOOKS_DB) && window.BOOKS_DB.length) {
    return window.BOOKS_DB;
  }

  if (!booksLoadPromise) {
    booksLoadPromise = fetch('books.json', { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load books.json: ${response.status}`);
        }
        return response.json();
      })
      .then((books) => {
        window.BOOKS_DB = Array.isArray(books) ? books : [];
        return window.BOOKS_DB;
      })
      .catch((error) => {
        console.error('AJAX book loading failed:', error);
        const booksWrap = document.getElementById('books');
        if (booksWrap) {
          booksWrap.innerHTML = '<p style="color:#b00020;">Failed to load book data. Please open this website using Live Server.</p>';
        }
        window.BOOKS_DB = [];
        return window.BOOKS_DB;
      });
  }

  return booksLoadPromise;
}

// Entry point used by search and initial render.
window.loadAndRenderBooks = async function loadAndRenderBooks() {
  const allBooks = await loadBooksWithAjax();

  const q = getSearchQuery();

  renderFeaturedSections(allBooks);

  if (!q) {
    renderBooks(sortBooks(allBooks));
    return;
  }

  const filtered = Array.isArray(allBooks)
    ? allBooks.filter((b) => {
        return bookMatchesSearch(b, q);
      })
    : [];

  renderBooks(sortBooks(filtered));
  scrollBooksToTop();
};

window.handleSearch = async function handleSearch() {
  await window.loadAndRenderBooks();
};

window.handleSearchFromForm = async function handleSearchFromForm(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  await window.handleSearch();
  return false;
};

function debounce(fn, delay = 150) {
  let timer = null;

  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

window.resetFilters = async function resetFilters() {
  const authorInput = document.getElementById('filter-author');
  if (authorInput) authorInput.value = '';

  const minEl = document.getElementById('filter-price-min');
  const maxEl = document.getElementById('filter-price-max');
  if (minEl) minEl.value = '';
  if (maxEl) maxEl.value = '';

  const genreChecks = Array.from(document.querySelectorAll('input.genre-check'));
  genreChecks.forEach((c) => { c.checked = false; });

  renderBooks(await loadBooksWithAjax());
  closeFilterPanel();
};

function wireLiveFiltering() {
  const searchInput = document.getElementById('search-term');
  const authorInput = document.getElementById('filter-author');
  const minEl = document.getElementById('filter-price-min');
  const maxEl = document.getElementById('filter-price-max');
  const genreChecks = Array.from(document.querySelectorAll('input.genre-check'));
  const sortSelect = document.getElementById('sort-order');

  const runSearch = debounce(() => {
    window.loadAndRenderBooks();
  });

  const runFilters = debounce(() => {
    window.applyFilters && window.applyFilters({ closeFilter: false });
  });

  if (searchInput) searchInput.addEventListener('input', runSearch);
  if (authorInput) authorInput.addEventListener('input', runFilters);
  if (minEl) minEl.addEventListener('input', runFilters);
  if (maxEl) maxEl.addEventListener('input', runFilters);
  genreChecks.forEach((check) => check.addEventListener('change', runFilters));
  if (sortSelect) sortSelect.addEventListener('change', () => {
    window.applySort && window.applySort();
  });
}

window.applySort = async function applySort() {
  const authorInput = document.getElementById('filter-author');
  const minEl = document.getElementById('filter-price-min');
  const maxEl = document.getElementById('filter-price-max');
  const genreChecks = Array.from(document.querySelectorAll('input.genre-check'));

  const hasFilter =
    getSearchQuery() ||
    (authorInput && authorInput.value.trim()) ||
    (minEl && minEl.value) ||
    (maxEl && maxEl.value) ||
    genreChecks.some((c) => c.checked);

  if (hasFilter) {
    return window.applyFilters && window.applyFilters({ closeFilter: false });
  }

  if (window.loadAndRenderBooks) {
    await window.loadAndRenderBooks();
    scrollBooksToTop();
  }
};

// ----- Cart (sessionStorage) -----
function getCart() {
  try {
    const raw = sessionStorage.getItem('cart');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setCart(cart) {
  try {
    sessionStorage.setItem('cart', JSON.stringify(Array.isArray(cart) ? cart : []));
  } catch (e) {
    // ignore
  }
}

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 'RM0.00';
  return 'RM' + n.toFixed(2);
}

function computeCartTotal(cart) {
  const items = Array.isArray(cart) ? cart : [];
  return items.reduce((sum, it) => {
    const price = Number(it.price);
    const qty = Number(it.qty);
    if (!Number.isFinite(price) || !Number.isFinite(qty)) return sum;
    return sum + price * qty;
  }, 0);
}

function updateCartUI() {
  const itemsEl = document.getElementById('cart-items');
  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');
  if (!itemsEl || !countEl || !totalEl) return;

  const cart = getCart();
  const totalQty = cart.reduce((s, it) => s + (Number(it.qty) || 0), 0);
  countEl.textContent = totalQty;

  const total = computeCartTotal(cart);
  totalEl.textContent = 'Total: ' + money(total);

  if (!cart.length) {
    itemsEl.innerHTML = '<div style="color:#666; font-size:13px;">Cart is empty.</div>';
    return;
  }

  itemsEl.innerHTML = '';

  for (const it of cart) {
    const qty = Number(it.qty) || 0;
    const price = Number(it.price);
    const lineTotal = (Number.isFinite(price) ? price : 0) * qty;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${it.image || ''}" alt="${it.title || ''}" onerror="this.style.display='none'" />
      <div>
        <div class="cart-item-title">${it.title || ''}</div>
        <div class="cart-item-meta">${it.title || ''}${it.genre ? ' • ' + it.genre : ''}</div>

        <div class="cart-item-meta">${money(it.price)}</div>

        <div class="qty-row">
          <button class="qty-btn" type="button" aria-label="decrease">-</button>
          <input class="qty-input" type="number" step="1" value="${qty}" />
          <button class="qty-btn" type="button" aria-label="increase">+</button>
        </div>

        <div class="cart-item-meta">Total: ${money(lineTotal)}</div>
      </div>
    `;

    const decBtn = row.querySelectorAll('.qty-btn')[0];
    const incBtn = row.querySelectorAll('.qty-btn')[1];
    const input = row.querySelector('.qty-input');

    input.addEventListener('input', () => {
      const v = Number(input.value);
      if (!Number.isFinite(v)) return;
    });

    const updateQty = (nextQty, sourceEl) => {
      const cartNow = getCart();
      const idx = Array.isArray(cartNow) ? cartNow.findIndex((x) => x.title === it.title) : -1;
      if (idx < 0) return;

      const stock = Number(cartNow[idx].stock);
      const maxQty = Number.isFinite(stock) && stock >= 0 ? stock : Infinity;

      const desired = Math.max(1, Number(nextQty) || 1);

      if (desired > maxQty) {
        const msg = 'The Quantity Entered EXIDING the Stock Quantity, Please Enter Again';
        if (sourceEl && sourceEl.closest) {
          const box = sourceEl.closest('.cart-item');
          if (box) {
            let warn = box.querySelector('.qty-warning');
            if (!warn) {
              warn = document.createElement('div');
              warn.className = 'qty-warning';
              warn.style.color = 'red';
              warn.style.fontSize = '12px';
              warn.style.marginTop = '6px';
              box.appendChild(warn);
            }
            warn.textContent = msg;
          }
        }
        if (sourceEl && typeof sourceEl.value !== 'undefined') {
          sourceEl.value = String(cartNow[idx].qty || 1);
        }
        return;
      }

      if (sourceEl && sourceEl.closest) {
        const box = sourceEl.closest('.cart-item');
        if (box) {
          const warn = box.querySelector('.qty-warning');
          if (warn) warn.remove();
        }
      }

      cartNow[idx].qty = desired;
      setCart(cartNow);
      updateCartUI();
    };

    decBtn.addEventListener('click', () => updateQty(qty - 1, decBtn));
    incBtn.addEventListener('click', () => updateQty(qty + 1, incBtn));
    input.addEventListener('input', () => updateQty(input.value, input));
    input.addEventListener('change', () => updateQty(input.value, input));

    itemsEl.appendChild(row);
  }
}

window.clearCart = function clearCart() {
  setCart([]);
  updateCartUI();
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim());
}

window.buyNow = function buyNow() {
  const cart = getCart();
  if (!Array.isArray(cart) || !cart.length) {
    alert('Cart is empty.');
    return;
  }

  const root = document.getElementById('buy-modal-root') || document.body;
  const existing = document.getElementById('buy-now-modal');
  if (existing) existing.remove();

  const total = computeCartTotal(cart);

  const modal = document.createElement('div');
  modal.id = 'buy-now-modal';
  modal.innerHTML = `
    <div class="buy-overlay"></div>
    <div class="buy-modal">
      <div class="buy-modal-header">
        <div class="buy-modal-title">Checkout</div>
        <button type="button" class="buy-close" aria-label="Close">✕</button>
      </div>

      <div class="buy-modal-body">
        <div class="buy-summary">Total: <b>RM${Number(total).toFixed(2)}</b></div>

        <form class="buy-form" onsubmit="return false;">
          <label class="buy-field">
            <span>Name</span>
            <input name="name" type="text" required placeholder="Your full name" />
          </label>

          <label class="buy-field">
            <span>Address</span>
            <input name="address" type="text" required placeholder="Your address" />
          </label>

          <label class="buy-field">
            <span>Phone</span>
            <input name="phone" type="tel" required placeholder="Your phone number" />
          </label>

          <label class="buy-field">
            <span>Email</span>
            <input name="email" type="email" required placeholder="you@example.com" />
          </label>

          <div class="buy-actions">
            <button type="button" class="buy-cancel">Cancel</button>
            <button type="submit" class="buy-submit">Send Order via Email</button>
          </div>

          <div class="buy-hint">A reservation email will be sent to the email you enter.</div>
        </form>
      </div>
    </div>
  `;

  root.appendChild(modal);

  const close = () => {
    try { modal.remove(); } catch (e) {}
  };

  modal.querySelector('.buy-overlay')?.addEventListener('click', close);
  modal.querySelector('.buy-close')?.addEventListener('click', close);
  modal.querySelector('.buy-cancel')?.addEventListener('click', close);

  const form = modal.querySelector('.buy-form');
  const submitBtn = modal.querySelector('.buy-submit');

  submitBtn.addEventListener('click', () => {
    const name = form.elements['name']?.value?.trim();
    const address = form.elements['address']?.value?.trim();
    const phoneRaw = form.elements['phone']?.value?.trim();
    const email = form.elements['email']?.value?.trim();

    const phone = String(phoneRaw ?? '').replace(/\s+/g, '');

    const emailOk = isValidEmail(email);
    const phoneOk = /^\d+$/.test(phone);

    if (!name || !address || !phone || !email || !emailOk || !phoneOk) {
      const hint = modal.querySelector('.buy-hint');
      if (hint) hint.textContent = 'Please enter valid Name, Address, Phone (numbers only), and Email.';
      return;
    }

    if (!window.emailjs || typeof window.emailjs.send !== 'function') {
      const hint = modal.querySelector('.buy-hint');
      if (hint) hint.textContent = 'Email service is not configured. Please check EmailJS setup.';
      return;
    }

    // Init once (EmailJS requires init(publicKey) before send).
    try {
      if (typeof window.emailjs.init === 'function' && !window.__emailjs_inited) {
        window.emailjs.init({
          publicKey: '6nzuHA1MtdzUXERwI'
        });
        window.__emailjs_inited = true;
      }
    } catch (e) {
      // ignore
    }

    const itemsText = cart
      .map((it) => {
        const qty = Number(it.qty) || 0;
        const title = it.title || '';
        const price = Number(it.price);
        const lineTotal = Number.isFinite(price) ? price * qty : 0;
        return `${title} (qty: ${qty}) - RM${Number.isFinite(lineTotal) ? lineTotal.toFixed(2) : '0.00'}`;
      })
      .join('\n');

    const templateParams = {
      customer_name: name,
      customer_address: address,
      customer_phone: phone,
      customer_email: email,
      to_email: email,
      reply_to: email,
      order_total: `RM${Number(total).toFixed(2)}`,
      ordered_books: itemsText
    };

    // PLACEHOLDER CONFIG — CHANGE THESE:
    // EMAILJS_SERVICE_ID must match the service you connected (Gmail/SMTP).
    // EMAILJS_TEMPLATE_ID must match the template you created.
    const EMAILJS_SERVICE_ID = 'service_b0fjuwb';
    const EMAILJS_TEMPLATE_ID = 'template_r3a3nut';


    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    window.emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
      .then(() => {
        close();
        alert('Order sent successfully!');
        window.clearCart && window.clearCart();
      })
      .catch((error) => {
        console.error('EmailJS send failed:', error);
        const hint = modal.querySelector('.buy-hint');
        const status = error && (error.status || error.statusCode);
        if (hint) {
          hint.textContent = status
            ? `Failed to send email. EmailJS returned ${status}. Please check your EmailJS public key, service ID, and template ID.`
            : 'Failed to send email. Please check your EmailJS public key, service ID, and template ID.';
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Order via Email';
      });
  });
};

const featuredPageSize = 4;
const featuredRows = {
  'new-releases': { books: [], page: 0 },
  'best-sellers': { books: [], page: 0 },
  'top-ten': { books: [], page: 0 }
};

function featuredBookHTML(b) {
  return `
      <div class="featured-item" role="button" tabindex="0">
        <img src="${b.image}" alt="${b.title}" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"160\"><rect width=\"120\" height=\"160\" fill=\"#e5e5e5\"/><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"#666\" font-family=\"Arial\" font-size=\"12\">No Image</text></svg>')}';" />
        <div class="featured-item-title">${b.title}</div>
      </div>
    `;
}

function renderFeaturedRow(rowId) {
  const row = featuredRows[rowId];
  const list = document.getElementById(rowId);
  if (!row || !list) return;

  const totalPages = Math.ceil(row.books.length / featuredPageSize);
  if (totalPages > 0) {
    row.page = Math.min(row.page, totalPages - 1);
  } else {
    row.page = 0;
  }

  const start = row.page * featuredPageSize;
  list.innerHTML = row.books.slice(start, start + featuredPageSize).map(featuredBookHTML).join('');
  Array.from(list.querySelectorAll('.featured-item')).forEach((item, index) => {
    const book = row.books[start + index];
    const openDetails = () => {
      if (!book || typeof window.showBookDetails !== 'function') return;
      window.showBookDetails({
        title: book.title,
        author: book.author,
        genre: book.genre,
        description: book.description || 'No description available.',
        image: book.image,
        price: book.price,
        stock: book.stock
      });
    };

    item.addEventListener('click', openDetails);
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDetails();
      }
    });
  });

  const buttons = list.closest('.featured-row')?.querySelectorAll('.featured-row-button');
  if (buttons && buttons.length >= 2) {
    buttons[0].disabled = row.page === 0;
    buttons[1].disabled = row.page >= totalPages - 1;
  }
}

window.moveFeaturedRow = function moveFeaturedRow(rowId, step) {
  const row = featuredRows[rowId];
  if (!row) return;

  const totalPages = Math.ceil(row.books.length / featuredPageSize);
  if (totalPages <= 0) return;

  row.page = Math.min(Math.max(row.page + step, 0), totalPages - 1);
  renderFeaturedRow(rowId);
};

function renderFeaturedSections(allBooks) {
  const releases = document.getElementById('new-releases');
  const best = document.getElementById('best-sellers');
  const topTen = document.getElementById('top-ten');

  if (!Array.isArray(allBooks)) {
    if (releases) releases.innerHTML = '<div class="featured-item">No data available.</div>';
    if (best) best.innerHTML = '<div class="featured-item">No data available.</div>';
    if (topTen) topTen.innerHTML = '<div class="featured-item">No data available.</div>';
    return;
  }

  const sortedByStock = [...allBooks].sort((a, b) => Number(b.stock) - Number(a.stock));
  const alphabetic = [...allBooks].sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base' }));

  featuredRows['new-releases'].books = allBooks;
  featuredRows['best-sellers'].books = sortedByStock;
  featuredRows['top-ten'].books = alphabetic.slice(0, 10);

  for (const rowId of Object.keys(featuredRows)) {
    featuredRows[rowId].page = 0;
    renderFeaturedRow(rowId);
  }

}

window.renderWishlistPage = function renderWishlistPage() {
  const container = document.getElementById('wishlist-items');
  if (!container) return;

  const wishlist = getWishlist();
  if (!wishlist.length) {
    container.innerHTML = '<div class="wishlist-empty">Your wishlist is empty. Browse books and tap Add to Wishlist.</div>';
    return;
  }

  container.innerHTML = '';

  for (const item of wishlist) {
    const row = document.createElement('div');
    row.className = 'wishlist-card';
    row.innerHTML = `
      <div class="wishlist-cover">
        <img src="${item.image || ''}" alt="${item.title || ''}" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"160\"><rect width=\"120\" height=\"160\" fill=\"#e5e5e5\"/><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"#666\" font-family=\"Arial\" font-size=\"12\">No Image</text></svg>')}';" />
      </div>
      <div class="wishlist-info">
        <h3>${item.title || ''}</h3>
        <p>${item.author || 'Author unavailable'}</p>
        <div class="wishlist-meta">
          <span>${item.genre || 'Book'}</span>
          <strong>RM${Number(item.price).toFixed(2)}</strong>
        </div>
        <div class="wishlist-actions">
          <button class="wishlist-open" type="button">View Details</button>
          <button class="wishlist-btn" type="button">Remove</button>
        </div>
      </div>
    `;

    const openBtn = row.querySelector('.wishlist-open');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        window.showBookDetails && window.showBookDetails(item);
      });
    }

    const removeBtn = row.querySelector('.wishlist-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        window.removeBookFromWishlist && window.removeBookFromWishlist(item.title);
        renderWishlistPage();
      });
    }

    container.appendChild(row);
  }
};

window.clearWishlist = function clearWishlist() {
  if (!confirm('Clear all items from your wishlist?')) {
    return;
  }
  setWishlist([]);
  window.renderWishlistPage && window.renderWishlistPage();
};

function wireGlobalCartRefresh() {
  try {
    window.addEventListener('cart:updated', () => updateCartUI());
    window.addEventListener('storage', () => updateCartUI());
    window.addEventListener('wishlist:updated', () => {
      if (document.getElementById('wishlist-items')) {
        window.renderWishlistPage && window.renderWishlistPage();
      }
    });
  } catch (e) {}
  updateCartUI();
}

// Initial render
window.loadAndRenderBooks();
wireLiveFiltering();
wireGlobalCartRefresh();

if (document.getElementById('wishlist-items')) {
  window.renderWishlistPage();
}
