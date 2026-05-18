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

      if (typeof window.showQuantityModal === 'function') {
        window.showQuantityModal(data);
        return;
      }

      const qtyStr = window.prompt(`Enter quantity for: ${data.title}`, '1');
      if (qtyStr === null) return;
      const qty = Math.max(1, Number(qtyStr) || 1);

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
      try {
        window.dispatchEvent(new Event('cart:updated'));
      } catch (e) {}
      alert('Added to cart');
    });
  } catch (e) {
    // ignore
  }
})();


