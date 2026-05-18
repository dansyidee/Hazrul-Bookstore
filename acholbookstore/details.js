window.showBookDetails = function showBookDetails(book) {
  try {
    sessionStorage.setItem('book-details', JSON.stringify(book || {}));
  } catch (e) {
    // ignore
  }

  // Navigate to details page.
  window.location.href = 'details.html';
};

// Simple Add-to-cart handler for details page.
(function attachDetailsCartHandler() {
  try {
    const btn = document.getElementById('add-to-cart');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const raw = sessionStorage.getItem('book-details');
      const data = raw ? JSON.parse(raw) : null;
      if (!data) return;

      const qtyStr = window.prompt(`Enter quantity for: ${data.title}`, '1');
      if (qtyStr === null) return;
      const qty = Math.max(1, Number(qtyStr) || 1);

      // Block adding to cart if quantity exceeds available stock.
      if (typeof data.stock === 'number' && Number.isFinite(data.stock) && qty > data.stock) {
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

      const rawCart = sessionStorage.getItem('cart');

      const cart = rawCart ? JSON.parse(rawCart) : [];

      const idx = Array.isArray(cart) ? cart.findIndex((x) => x.title === data.title) : -1;
      if (idx >= 0) {
        cart[idx].qty = (Number(cart[idx].qty) || 0) + qty;
      } else {
        cart.push({
          title: data.title,
          author: data.author,
          genre: data.genre,
          image: data.image,
          price: data.price,
          stock: data.stock,
          qty
        });
      }

      sessionStorage.setItem('cart', JSON.stringify(cart));

      // if home.html is open in another tab, this won't fire, but same-tab works.
      try {
        window.dispatchEvent(new Event('cart:updated'));
      } catch (e) {}

      alert('Added to cart');
    });
  } catch (e) {
    // ignore
  }
})();



