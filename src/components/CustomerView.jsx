import React, { useState } from 'react';
import { useOrder } from '../context/OrderContext';
import { ShoppingCart, Plus, Minus, Info, Clock, Utensils, X, ChevronRight } from 'lucide-react';

export const CustomerView = ({ onViewTracker }) => {
  const {
    menu,
    cart,
    addToCart,
    updateCartQty,
    tableNumber,
    setTableNumber,
    orderType,
    setOrderType,
    placeOrder,
    settings
  } = useOrder();

  const [activeCategory, setActiveCategory] = useState('All');
  const [showCartSheet, setShowCartSheet] = useState(false);

  const categories = ['All', 'Plain', 'Masala', 'Cheese', 'Onion', 'Corn', 'Sweet'];

  // Filter menu items by category and availability
  const filteredMenu = menu.filter(item => {
    if (activeCategory === 'All') return true;
    return item.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const cartTotalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleQtyChange = (item, delta) => {
    const existing = cart.find(i => i.id === item.id);
    const newQty = existing ? existing.quantity + delta : delta;
    updateCartQty(item.id, newQty);
  };

  const handlePlaceOrder = async () => {
    const newOrder = await placeOrder();
    if (newOrder) {
      setShowCartSheet(false);
      onViewTracker();
    } else {
      alert('Something went wrong. Please try again!');
    }
  };

  // Find daily special item (e.g. Masala Paddu)
  const specialItem = menu.find(item => item.id === 'm2') || menu[0];

  // Helper for item emojis / visual markers
  const getCategoryEmoji = (cat) => {
    switch (cat.toLowerCase()) {
      case 'plain': return '🍘';
      case 'masala': return '🌶️';
      case 'cheese': return '🧀';
      case 'onion': return '🧅';
      case 'corn': return '🌽';
      case 'sweet': return '🍫';
      default: return '🥞';
    }
  };

  return (
    <>
      {/* Hero Banner Section */}
      <section className="hero-banner">
        <span className="badge-promo">🔥 Fresh & Hot Paddus</span>
        <h2>Welcome to <span>Paddu Point</span></h2>
        <p>Delicious, crispy, and fluffy paddus made live with fresh ingredients!</p>
        
        {tableNumber && (
          <div className="table-indicator">
            👤 Name: {tableNumber}
          </div>
        )}
      </section>

      {/* Main Content */}
      <main className="main-content">
        {/* Daily Special Banner */}
        {specialItem && (
          <div className="specials-banner" onClick={() => addToCart(specialItem)}>
            <div className="specials-banner-content">
              <span className="specials-title">⭐ Today's Special</span>
              <span className="specials-name">{specialItem.name}</span>
              <span className="specials-price">₹{specialItem.price} only</span>
            </div>
            <button className="qty-btn" style={{ background: 'white', color: 'var(--primary)' }}>
              <Plus size={18} />
            </button>
          </div>
        )}

        {/* Categories Tabs Selector */}
        <div className="categories-container">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'All' ? '🍽️ All Menu' : `${getCategoryEmoji(cat)} ${cat}`}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="menu-grid">
          {filteredMenu.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🍽️</span>
              <p>No Paddu varieties available in this category today.</p>
            </div>
          ) : (
            filteredMenu.map(item => {
              const cartItem = cart.find(i => i.id === item.id);
              const qty = cartItem ? cartItem.quantity : 0;

              return (
                <div key={item.id} className={`menu-card ${!item.available ? 'unavailable' : ''}`}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="menu-card-image" />
                  ) : (
                    <div className="menu-card-image-fallback">
                      {getCategoryEmoji(item.category)}
                    </div>
                  )}
                  
                  <div className="menu-card-details">
                    <div className="menu-card-header">
                      <div>
                        <h4 className="menu-card-name">{item.name}</h4>
                        <span className={`availability-badge ${item.available ? 'available' : 'unavailable'}`}>
                          {item.available ? 'Available' : 'Sold Out'}
                        </span>
                      </div>
                      <span className="menu-card-price">₹{item.price}</span>
                    </div>

                    <p className="menu-card-desc">{item.description}</p>

                    <div className="menu-card-action">
                      {item.available ? (
                        qty > 0 ? (
                          <div className="qty-selector">
                            <button className="qty-btn" onClick={() => handleQtyChange(item, -1)}>
                              <Minus size={14} />
                            </button>
                            <span className="qty-val">{qty}</span>
                            <button className="qty-btn" onClick={() => handleQtyChange(item, 1)}>
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button className="add-cart-btn" onClick={() => addToCart(item)}>
                            Add +
                          </button>
                        )
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Next Batch Soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartTotalQty > 0 && (
        <div className="bottom-cart-bar">
          <div className="cart-summary-text">
            <span className="cart-summary-count">{cartTotalQty} Item{cartTotalQty > 1 ? 's' : ''} added</span>
            <span className="cart-summary-total">₹{cartTotalPrice}</span>
          </div>
          <button className="view-cart-btn" onClick={() => setShowCartSheet(true)}>
            View Cart <ShoppingCart size={18} />
          </button>
        </div>
      )}

      {/* Slide-Up Cart Sheet Drawer */}
      {showCartSheet && (
        <>
          <div className="cart-sheet-backdrop" onClick={() => setShowCartSheet(false)} />
          <div className="cart-sheet">
            <div className="cart-sheet-header">
              <h3>Your Cart</h3>
              <button className="icon-btn" onClick={() => setShowCartSheet(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="cart-items-list">
              {cart.map(item => (
                <div key={item.id} className="cart-item-row">
                  <div className="cart-item-info">
                    <span className="cart-item-title">{item.name}</span>
                    <div className="cart-item-price-calc">
                      ₹{item.price} × {item.quantity}
                    </div>
                  </div>
                  
                  <div className="qty-selector">
                    <button className="qty-btn" onClick={() => handleQtyChange(item, -1)}>
                      <Minus size={14} />
                    </button>
                    <span className="qty-val">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => handleQtyChange(item, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Settings Card (Dine In vs. Parcel) */}
            <div className="order-settings-card">
              <h4>How would you like your order?</h4>
              
              <div className="order-type-tabs">
                <button
                  className={`order-type-tab ${orderType === 'dine-in' ? 'active' : ''}`}
                  onClick={() => setOrderType('dine-in')}
                >
                  <Utensils size={16} style={{ marginBottom: '4px', display: 'block', margin: '0 auto' }} />
                  Eat Here (Standing)
                </button>
                <button
                  className={`order-type-tab ${orderType === 'parcel' ? 'active' : ''}`}
                  onClick={() => setOrderType('parcel')}
                >
                  <Clock size={16} style={{ marginBottom: '4px', display: 'block', margin: '0 auto' }} />
                  Parcel / Takeaway
                </button>
              </div>

              {orderType === 'dine-in' ? (
                <div className="table-input-container">
                  <label htmlFor="customer-name">Your Name (Optional)</label>
                  <input
                    id="customer-name"
                    type="text"
                    className="table-select-input"
                    placeholder="Enter your name to call out"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    We will call out your name or token number when your hot paddus are ready.
                  </p>
                </div>
              ) : (
                <div className="parcel-notice">
                  <Clock size={16} />
                  <span>Estimated preparation time: <b>{settings.preparationTime} mins</b></span>
                </div>
              )}
            </div>

            {/* Bill Details */}
            <div className="cart-bill-details">
              <div className="bill-row">
                <span>Subtotal</span>
                <span>₹{cartTotalPrice}</span>
              </div>
              <div className="bill-row">
                <span>GST & Service Charges</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
              </div>
              <div className="bill-row total">
                <span>Total Amount</span>
                <span>₹{cartTotalPrice}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button className="place-order-btn" onClick={handlePlaceOrder}>
              Confirm Order (₹{cartTotalPrice})
            </button>
          </div>
        </>
      )}
    </>
  );
};
