import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockDbService as dbService } from '../services/mockDbAdapter';
import menuData from '../../server-data.json';
const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const [menu, setMenu] = useState(menuData);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState('dine-in'); // 'dine-in' | 'parcel'
  const [currentOrderId, setCurrentOrderId] = useState(
    () => localStorage.getItem('paddu_current_order_id') || ''
  );
  const [currentOrder, setCurrentOrder] = useState(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('paddu_theme') || 'light'
  );
  const [settings, setSettings] = useState({
    upiId: '7795143969-2@ybl',
    whatsappNumber: '+917795143969',
    preparationTime: '15'
  });
  const [isServerConnected, setIsServerConnected] = useState(false);

  // Load theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('paddu_theme', theme);
  }, [theme]);

  // Menu data is static and loaded from server-data.json; no subscription needed.

  // Subscribe to real-time orders list (admin view uses this)
  useEffect(() => {
    const unsubscribe = dbService.subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
    });
    return unsubscribe;
  }, []);

  // Subscribe to current order updates
  useEffect(() => {
    if (!currentOrderId) {
      setCurrentOrder(null);
      return;
    }
    const unsubscribe = dbService.subscribeToOrder(currentOrderId, (order) => {
      setCurrentOrder(order);
    });
    return unsubscribe;
  }, [currentOrderId]);

  // Subscribe to real-time settings updates (synced across devices)
  useEffect(() => {
    const unsubscribe = dbService.subscribeSettings((updatedSettings) => {
      if (updatedSettings) setSettings(updatedSettings);
    });
    return unsubscribe;
  }, []);

  // Subscribe to connection status
  useEffect(() => {
    const unsubscribe = dbService.subscribeConnection((connected) => {
      setIsServerConnected(connected);
    });
    return unsubscribe;
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Cart Operations
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateCartQty = (itemId, qty) => {
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Checkout / Place Order
  const placeOrder = async () => {
    if (cart.length === 0) return null;

    const orderData = {
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : null,
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      })),
      totalPrice: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    try {
      const newOrder = await dbService.createOrder(orderData);
      setCurrentOrderId(newOrder.id);
      localStorage.setItem('paddu_current_order_id', newOrder.id);
      clearCart();
      return newOrder;
    } catch (error) {
      console.error("Failed to place order:", error);
      return null;
    }
  };

  const clearCurrentOrder = () => {
    setCurrentOrderId('');
    localStorage.removeItem('paddu_current_order_id');
    setCurrentOrder(null);
  };

  // Admin Actions
  const updateOrderStatus = async (orderId, newStatus) => {
    return await dbService.updateOrderStatus(orderId, newStatus);
  };

  const updateMenuItem = async (item) => {
    return await dbService.updateMenuItem(item);
  };

  const deleteMenuItem = async (itemId) => {
    return await dbService.deleteMenuItem(itemId);
  };

  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    return await dbService.saveSettings(updated);
  };

  const submitFeedback = async (rating, comment) => {
    if (!currentOrder) return false;
    const feedbackData = {
      orderId: currentOrder.id,
      orderNumber: currentOrder.orderNumber,
      rating,
      comment
    };
    return await dbService.submitFeedback(feedbackData);
  };

  return (
    <OrderContext.Provider value={{
      menu,
      orders,
      cart,
      tableNumber,
      setTableNumber,
      orderType,
      setOrderType,
      currentOrder,
      setCurrentOrderId,
      clearCurrentOrder,
      theme,
      toggleTheme,
      settings,
      updateSettings,
      addToCart,
      removeFromCart,
      updateCartQty,
      clearCart,
      placeOrder,
      updateOrderStatus,
      updateMenuItem,
      deleteMenuItem,
      submitFeedback,
      isServerConnected
    }}>
      {children}
    </OrderContext.Provider>
  );
};
