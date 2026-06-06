// src/services/mockDbAdapter.js
// Simple in‑memory mock database for static Render deployment.
// Mirrors the API of the original dbService but uses localStorage for persistence.

const STORAGE_KEY = 'paddu_mock_state';

// Load persisted state or initialise defaults
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse Paddu mock state', e);
    }
  }
  return {
    menu: [], // will be overwritten by static menu data on load
    orders: [],
    settings: {
      upiId: '7795143969-2@ybl',
      whatsappNumber: '+917795143969',
      preparationTime: '15'
    },
    connection: true
  };
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to persist Paddu mock state', e);
  }
}

let state = loadState();

// Helper to notify a Set of callbacks with the latest slice of state
function notify(set, payload) {
  set.forEach(cb => {
    try { cb(payload); } catch (e) { console.error('Callback error', e); }
  });
}

// ---------------------------------------------------------------------------
// Public API – matches the original dbService used throughout the app
// ---------------------------------------------------------------------------
export const mockDbService = {
  // Connection
  isConnected: () => true,
  subscribeConnection: callback => {
    // Always online in static mode
    const set = new Set([callback]);
    callback(true);
    return () => set.delete(callback);
  },

  // Menu – static data loaded from server-data.json (handled by OrderContext)
  getMenu: async () => state.menu,
  subscribeMenu: callback => {
    const set = new Set([callback]);
    callback(state.menu);
    return () => set.delete(callback);
  },
  updateMenuItem: async item => {
    const idx = state.menu.findIndex(i => i.id === item.id);
    if (idx >= 0) state.menu[idx] = { ...state.menu[idx], ...item };
    saveState(state);
    // Notify any subscribers (if any exist)
    // In the mock we keep a simple internal Set – this is a no‑op for now.
    return true;
  },
  deleteMenuItem: async id => {
    state.menu = state.menu.filter(i => i.id !== id);
    saveState(state);
    return true;
  },

  // Orders
  getOrders: async () => state.orders,
  subscribeToOrders: callback => {
    const set = new Set([callback]);
    callback(state.orders);
    return () => set.delete(callback);
  },
  subscribeToOrder: (orderId, callback) => {
    const set = new Set([callback]);
    const order = state.orders.find(o => o.id === orderId);
    if (order) callback(order);
    return () => set.delete(callback);
  },
  createOrder: async orderData => {
    const newOrder = {
      id: Date.now().toString(),
      orderNumber: `#${state.orders.length + 1}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      ...orderData
    };
    state.orders = [...state.orders, newOrder];
    saveState(state);
    // fire subscription callbacks
    // (simplified – we recreate a fresh Set each call, so just invoke directly)
    // In a real implementation we would keep a persistent Set.
    return newOrder;
  },
  updateOrderStatus: async (orderId, status) => {
    const idx = state.orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      state.orders[idx] = { ...state.orders[idx], status };
      saveState(state);
      return true;
    }
    return false;
  },

  // Settings
  getSettings: async () => state.settings,
  subscribeSettings: callback => {
    const set = new Set([callback]);
    callback(state.settings);
    return () => set.delete(callback);
  },
  saveSettings: async newSettings => {
    state.settings = { ...state.settings, ...newSettings };
    saveState(state);
    return true;
  },

  // Feedback (simple placeholder)
  submitFeedback: async feedback => {
    // Persist feedback in state for debugging – not used in UI.
    if (!state.feedback) state.feedback = [];
    state.feedback.push(feedback);
    saveState(state);
    return { ...feedback, id: Date.now().toString() };
  }
};
