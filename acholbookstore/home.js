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
    el.className = 'book';
    el.innerHTML = `
      <div class="book-img">
        <img src="${b.image}" alt="${b.title}" loading="lazy"
          referrerpolicy="no-referrer"
          onerror="this.onerror=null;this.src='data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#e5e5e5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#666" font-family="Arial" font-size="18">No Image</text></svg>')}';">
        <div class="overlay">
          <button>See Details</button>
        </div>
      </div>

      <h4>${b.title}</h4>
      <p>${b.author}</p>
      <p>${b.genre ? b.genre : ''}</p>

      <p>RM${Number(b.price).toFixed(2)}</p>
      <p>${stockText}</p>


      <button class="add-to-cart-btn" type="button">Add to Cart</button>
    `;

    const seeBtn = el.querySelector('.overlay button');
    if (seeBtn) {
      seeBtn.addEventListener('click', () => {
        window.showBookDetails({
          title: b.title,
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
      const qtyStr = window.prompt(`Enter quantity for: ${b.title}`, '1');
        if (qtyStr === null) return;
        let qty = Math.max(1, Number(qtyStr) || 1);

        // Block adding to cart if quantity exceeds available stock.
        if (typeof b.stock === 'number' && Number.isFinite(b.stock) && qty > b.stock) {
          // Use a custom red browser UX warning (alert can't style text color)
          const msg = document.createElement('div');
          msg.textContent = 'The Quantity Entered EXIDING the Stock Quantity, Please Enter Again';
          msg.style.position = 'fixed';
          msg.style.top = '20px';
          msg.style.left = '50%';
          msg.style.transform = 'translateX(-50%)';
          msg.style.background = '#fff';
          msg.style.border = '1px solid #e00';
          msg.style.color = '#e00';
          msg.style.padding = '10px 14px';
          msg.style.borderRadius = '8px';
          msg.style.zIndex = '99999';
          msg.style.fontFamily = 'Arial';
          document.body.appendChild(msg);
          setTimeout(() => msg.remove(), 2500);
          return;

        }

        const cart = getCart();

        const idx = Array.isArray(cart) ? cart.findIndex((x) => x.title === b.title) : -1;
        if (idx >= 0) cart[idx].qty = (Number(cart[idx].qty) || 0) + qty;
        else {
          cart.push({
            title: b.title,
            author: b.author,
            genre: b.genre,
            image: b.image,
            price: b.price,
            stock: b.stock,
            qty
          });
        }
        setCart(cart);
        updateCartUI();
        try {
          window.dispatchEvent(new Event('cart:updated'));
        } catch (e) {}
        alert('Added to cart');
      });
    }


    booksWrap.appendChild(el);
  }
}

function applyFilters() {
  const allBooks = window.BOOKS_DB || [];


  // Publisher + price inputs were part of the old sidebar filter UI.
  // They might not exist now, so guard them.
  const publisherInput = document.getElementById('filter-publisher');
  const publisherQuery = (publisherInput && publisherInput.value ? publisherInput.value.trim().toLowerCase() : '');

  const minEl = document.getElementById('filter-price-min');
  const maxEl = document.getElementById('filter-price-max');
  const minVal = minEl && minEl.value !== '' ? Number(minEl.value) : null;
  const maxVal = maxEl && maxEl.value !== '' ? Number(maxEl.value) : null;

  // Genres (multi-select checkboxes)
  const genreChecks = Array.from(document.querySelectorAll('input.genre-check'));
  const selectedGenres = genreChecks.filter((c) => c.checked).map((c) => c.value);

  const filtered = Array.isArray(allBooks)
    ? allBooks.filter((b) => {
      // Publisher: match against author/title (since books don't have publisher field)
      if (publisherQuery) {
        const author = String(b.author || '').toLowerCase();
        const title = String(b.title || '').toLowerCase();
        const ok = author.includes(publisherQuery) || title.includes(publisherQuery);
        if (!ok) return false;
      }

      // Genres filtering (AND/OR logic not specified: use OR among selected genres)
      if (selectedGenres.length) {
        if (!b.genre || !selectedGenres.includes(b.genre)) return false;
      }

      // Price range
      const price = Number(b.price);
      if (Number.isFinite(price)) {
        if (minVal !== null && price < minVal) return false;
        if (maxVal !== null && price > maxVal) return false;
      }

      return true;
    })
    : [];

  renderBooks(filtered);
}


// Entry point used by home.js
window.loadAndRenderBooks = async function loadAndRenderBooks() {
  const allBooks = window.BOOKS_DB || [];

  // Search by book name (and optionally author) using the search box value.
  const searchInput = document.getElementById('search-term');
  const q = (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();

  if (!q) {
    renderBooks(allBooks);
    return;
  }

  const filtered = Array.isArray(allBooks)
    ? allBooks.filter((b) => {
        const title = String(b.title || '').toLowerCase();
        const author = String(b.author || '').toLowerCase();
        return title.includes(q) || author.includes(q);
      })
    : [];

  renderBooks(filtered);
};



// Search (button on home.html)
window.handleSearch = async function handleSearch() {
  await window.loadAndRenderBooks();
};

// Form submit handler (prevents full page refresh)
window.handleSearchFromForm = async function handleSearchFromForm(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  await window.handleSearch();
  return false;
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
  totalEl.textContent = 'Total: ' + money(total).replace('RM', '');
  // money() above returns RM...; keep consistent with existing text prefix
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

        <div class="cart-item-meta">Line: ${money(lineTotal)}</div>
      </div>
    `;

    const decBtn = row.querySelectorAll('.qty-btn')[0];
    const incBtn = row.querySelectorAll('.qty-btn')[1];
    const input = row.querySelector('.qty-input');

    // Prevent browser native "invalid value" messaging from stopping the UX.
    input.addEventListener('input', () => {
      const v = Number(input.value);
      if (!Number.isFinite(v)) return;
    });

    const updateQty = (nextQty, sourceEl) => {

      const cartNow = getCart();
      const idx = Array.isArray(cartNow) ? cartNow.findIndex((x) => x.title === it.title) : -1;
      if (idx < 0) return;

      // Enforce stock limit (if stock is present)
      const stock = Number(cartNow[idx].stock);
      const maxQty = Number.isFinite(stock) && stock >= 0 ? stock : Infinity;

      const desired = Math.max(1, Number(nextQty) || 1);

      // If user typed more than stock, block and show UX warning.
      // Requirement: user must re-enter quantity; do NOT update cart.
      if (desired > maxQty) {
        const msg = 'The Quantity Entered EXIDING the Stock Quantity, Please Enter Again';

        // Show browser UX specifically while typing (inline red message only)
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

        // Force the input back to current valid cart qty (so user can’t keep typing a bad value)
        // Note: we read current qty from cartNow before changing it.
        if (sourceEl && typeof sourceEl.value !== 'undefined') {
          sourceEl.value = String(cartNow[idx].qty || 1);
        }
        return;
      }

      // Clear warning if any
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

    // Use input event so user can type a number beyond stock without browser blocking UX.
    input.addEventListener('input', () => updateQty(input.value, input));
    input.addEventListener('change', () => updateQty(input.value, input));



    itemsEl.appendChild(row);
  }
}

window.clearCart = function clearCart() {
  setCart([]);
  updateCartUI();
};

window.addToCartFromPrompt = function addToCartFromPrompt(book) {
  if (!book) return;
  const qtyStr = window.prompt(`Enter quantity for: ${book.title}`, '1');
  if (qtyStr === null) return;
  const qty = Math.max(1, Number(qtyStr) || 1);

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
};

function wireGlobalCartRefresh() {
  // Update UI after any add (used by details.js too)
  try {
    // same-tab notification from details.js
    window.addEventListener('cart:updated', () => updateCartUI());
    // (fallback) other tabs notification when using localStorage
    window.addEventListener('storage', () => updateCartUI());
  } catch (e) {}
  updateCartUI();
}


// Initial render
window.loadAndRenderBooks();
wireGlobalCartRefresh();





