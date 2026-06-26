function Cart() {
  // Sample cart items
  const cartItems = [
    { id: 1, name: 'Amul Moti 500ml', price: 40, mrp: 65, quantity: 2, image: '/wdm-images/prod-amul-moti.jpg' },
    { id: 2, name: 'Amul Taaza Tetra pack', price: 75, mrp: 90, quantity: 1, image: '/wdm-images/prod-amul-taaza.jpg' }
  ]

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalMrp = cartItems.reduce((sum, item) => sum + (item.mrp * item.quantity), 0)
  const savings = totalMrp - total

  return (
    <div className="cartPage">
      <h2 className="cartTitle">Your Cart</h2>
      
      {cartItems.length > 0 ? (
        <div className="cartLayout">
          <div className="cartItems">
          {cartItems.map(item => (
            <div key={item.id} className="cartItem">
              <img src={item.image} alt={item.name} className="cartItemImg" />
              <div className="cartItemInfo">
                <div className="cartItemName">{item.name}</div>
                <div className="cartItemPrice">
                  <span className="cartItemPriceCurrent">₹{item.price}</span>
                  <span className="cartItemPriceMrp">₹{item.mrp}</span>
                </div>
              </div>
              <div className="cartItemQty">
                <button className="qtyBtn">-</button>
                <span className="qtyValue">{item.quantity}</span>
                <button className="qtyBtn">+</button>
              </div>
              <div className="cartItemTotal">₹{item.price * item.quantity}</div>
            </div>
          ))}
        </div>

        <div className="cartSummary">
          <h3 className="summaryTitle">Order Summary</h3>
          <div className="summaryRow">
            <span>Subtotal</span>
            <span>₹{total}</span>
          </div>
          <div className="summaryRow">
            <span>Savings</span>
            <span className="savings">-₹{savings}</span>
          </div>
          <div className="summaryRow total">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
          <button className="checkoutBtn">Proceed to Checkout</button>
        </div>
        </div>
      ) : (
        <div className="emptyCart">
          <p>Your cart is empty</p>
        </div>
      )}
    </div>
  )
}

export default Cart
