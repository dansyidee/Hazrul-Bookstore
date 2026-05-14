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
        const qty = Math.max(1, Number(qtyStr) || 1);

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
  // Home page: show only local BOOKS_DB.
  renderBooks(window.BOOKS_DB || []);
};


// Search (button on home.html)
window.handleSearch = async function handleSearch() {
  await window.loadAndRenderBooks();
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
        <div class="cart-item-meta">${it.author || ''}${it.genre ? ' • ' + it.genre : ''}</div>
        <div class="cart-item-meta">${money(it.price)}</div>

        <div class="qty-row">
          <button class="qty-btn" type="button" aria-label="decrease">-</button>
          <input class="qty-input" type="number" min="1" step="1" value="${qty}" />
          <button class="qty-btn" type="button" aria-label="increase">+</button>
        </div>
        <div class="cart-item-meta">Line: ${money(lineTotal)}</div>
      </div>
    `;

    const decBtn = row.querySelectorAll('.qty-btn')[0];
    const incBtn = row.querySelectorAll('.qty-btn')[1];
    const input = row.querySelector('.qty-input');

    const updateQty = (nextQty) => {
      const cartNow = getCart();
      const idx = Array.isArray(cartNow) ? cartNow.findIndex((x) => x.title === it.title) : -1;
      if (idx < 0) return;
      cartNow[idx].qty = Math.max(1, Number(nextQty) || 1);
      setCart(cartNow);
      updateCartUI();
    };

    decBtn.addEventListener('click', () => updateQty(qty - 1));
    incBtn.addEventListener('click', () => updateQty(qty + 1));
    input.addEventListener('change', () => updateQty(input.value));

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





