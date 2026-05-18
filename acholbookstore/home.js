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
    el.className = 'book';    el.innerHTML = `
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

        // Block adding to cart if quantity exceeds available stock.
        if (typeof b.stock === 'number' && Number.isFinite(b.stock) && qty > b.stock) {
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

    el.classList.add('reveal');
    booksWrap.appendChild(el);
    setupScrollReveal();
  }
}

async function applyFilters() {
  const allBooks = await loadBooksWithAjax();

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

  renderBooks(filtered);
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

window.handleSearch = async function handleSearch() {
  await window.loadAndRenderBooks();
};

window.handleSearchFromForm = async function handleSearchFromForm(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  await window.handleSearch();
  return false;
};

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

        <div class="cart-item-meta">Line: ${money(lineTotal)}</div>
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

function wireGlobalCartRefresh() {
  try {
    window.addEventListener('cart:updated', () => updateCartUI());
    window.addEventListener('storage', () => updateCartUI());
  } catch (e) {}
  updateCartUI();
}

// Initial render
window.loadAndRenderBooks();
wireGlobalCartRefresh();

