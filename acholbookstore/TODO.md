# TODO

## Task A: Publisher filter -> Author
- [x] Update `acholbookstore/home.js` to read `filter-author` instead of `filter-Author`.

## Task B: Cart “Buy Now” (collect name/address/phone/email and email order)
- [ ] Add a “Buy Now” button to the cart dropdown UI in `acholbookstore/home.html`.
- [ ] Implement `window.buyNow()` in `acholbookstore/home.js` to:
  - [ ] Validate cart not empty
  - [ ] Prompt user for name, address, phone, email
  - [ ] Build an order summary from cart items + total
  - [ ] Open a `mailto:` link addressed to the email entered with the order summary
- [ ] Update `acholbookstore/home.css` with minimal styles for the new button (if needed).
- [ ] Test end-to-end in browser.

