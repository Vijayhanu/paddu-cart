// Paddu Point — WebSocket Sync Server (Vite Plugin)
// Allows multiple devices (phone + laptop) to share data in real-time.
// Data is persisted to a JSON file on disk so it survives server restarts.

import { WebSocketServer } from 'ws';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ── Default seed data ────────────────────────────────────────────────────
const DEFAULT_MENU = [
  {
    id: 'm1',
    name: 'Plain Paddu',
    price: 40,
    category: 'Plain',
    description: 'Traditional crispy golden paddus served with hot coconut chutney and sambar.',
    available: true,
    image: ''
  },
  {
    id: 'm2',
    name: 'Masala Paddu',
    price: 50,
    category: 'Masala',
    description: 'Prepared with spiced green chillies, fresh coriander, ginger, and curry leaves.',
    available: true,
    image: ''
  },
  {
    id: 'm3',
    name: 'Cheese Paddu',
    price: 65,
    category: 'Cheese',
    description: 'Loaded with premium mozzarella cheese that melts inside the warm, fluffy paddu.',
    available: true,
    image: ''
  },
  {
    id: 'm4',
    name: 'Onion Paddu',
    price: 45,
    category: 'Onion',
    description: 'Crispy outer layer stuffed with finely chopped onions, served with red tomato chutney.',
    available: true,
    image: ''
  },
  {
    id: 'm5',
    name: 'Corn Paddu',
    price: 55,
    category: 'Corn',
    description: 'Stuffed with juicy sweet corn kernels and mild spices. Kids favorite!',
    available: true,
    image: ''
  },
  {
    id: 'm6',
    name: 'Chocolate Sweet Paddu',
    price: 60,
    category: 'Sweet',
    description: 'Delicious dessert paddu stuffed with rich chocolate chips and drizzled with chocolate syrup.',
    available: true,
    image: ''
  }
];

const DEFAULT_SETTINGS = {
   upiId: 'BHARATPE2M0L0E1O2Y57508@unitype',
  whatsappNumber: '+919880243924',
  preparationTime: '15',
  baseUrl: ''
};

// ── Vite Plugin ──────────────────────────────────────────────────────────
export function padduWsPlugin() {
  return {
    name: 'paddu-ws-sync',

    configureServer(server) {
      const dataFilePath = resolve(server.config.root, 'server-data.json');

      // ── Load or seed persistent data ─────────────────────────────────
      let data;
      if (existsSync(dataFilePath)) {
        try {
          data = JSON.parse(readFileSync(dataFilePath, 'utf-8'));
          // Ensure all keys exist (forward-compat)
          if (!data.menu) data.menu = DEFAULT_MENU;
          if (!data.orders) data.orders = [];
          if (!data.feedback) data.feedback = [];
          if (!data.settings) data.settings = DEFAULT_SETTINGS;
        } catch {
          data = { menu: DEFAULT_MENU, orders: [], feedback: [], settings: DEFAULT_SETTINGS };
        }
      } else {
        data = { menu: DEFAULT_MENU, orders: [], feedback: [], settings: DEFAULT_SETTINGS };
      }
      persist(data);

      function persist(d) {
        try {
          writeFileSync(dataFilePath, JSON.stringify(d, null, 2));
        } catch (e) {
          console.error('[Paddu WS] Failed to persist data:', e.message);
        }
      }

      // ── WebSocket Server ─────────────────────────────────────────────
      const wss = new WebSocketServer({ noServer: true });

      // Attach to Vite's HTTP server, only for our path (/api/ws)
      server.httpServer?.on('upgrade', (request, socket, head) => {
        // Parse URL — handle bare paths gracefully
        let pathname;
        try {
          pathname = new URL(request.url, 'http://localhost').pathname;
        } catch {
          pathname = request.url;
        }

        if (pathname === '/api/ws') {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
          });
        }
        // Don't touch other upgrades (e.g. Vite HMR at /)
      });

      function broadcast(message, excludeWs = null) {
        const payload = JSON.stringify(message);
        wss.clients.forEach((client) => {
          if (client !== excludeWs && client.readyState === 1) {
            client.send(payload);
          }
        });
      }

      // ── Connection handler ───────────────────────────────────────────
      wss.on('connection', (ws) => {
        console.log(`[Paddu WS] ✅ Client connected (total: ${wss.clients.size})`);

        // Send full state snapshot to newly connected client
        ws.send(JSON.stringify({ type: 'STATE', data }));

        ws.on('message', (raw) => {
          try {
            const msg = JSON.parse(raw.toString());
            handleMessage(msg, ws);
          } catch (e) {
            console.error('[Paddu WS] Bad message:', e.message);
          }
        });

        ws.on('close', () => {
          console.log(`[Paddu WS] ❌ Client disconnected (total: ${wss.clients.size})`);
        });
      });

      // ── Message router ───────────────────────────────────────────────
      function handleMessage(msg, senderWs) {
        const reqId = msg.requestId; // echoed back for request/response pattern

        switch (msg.type) {

          // ── Menu ──────────────────────────────────────────────────────
          case 'UPDATE_MENU_ITEM': {
            const item = msg.item;
            const idx = data.menu.findIndex((i) => i.id === item.id);
            if (idx > -1) {
              data.menu[idx] = { ...data.menu[idx], ...item };
            } else {
              data.menu.push({ id: 'm_' + Date.now(), ...item });
            }
            persist(data);
            const reply = { type: 'MENU_UPDATED', menu: data.menu, requestId: reqId };
            senderWs.send(JSON.stringify(reply));
            broadcast(reply, senderWs);
            break;
          }

          case 'DELETE_MENU_ITEM': {
            data.menu = data.menu.filter((i) => i.id !== msg.itemId);
            persist(data);
            const reply = { type: 'MENU_UPDATED', menu: data.menu, requestId: reqId };
            senderWs.send(JSON.stringify(reply));
            broadcast(reply, senderWs);
            break;
          }

          // ── Orders ────────────────────────────────────────────────────
          case 'CREATE_ORDER': {
            const nextNum =
              data.orders.length > 0
                ? Math.max(...data.orders.map((o) => o.orderNumber)) + 1
                : 1001;
            const newOrder = {
              id: 'o_' + Date.now(),
              orderNumber: nextNum,
              timestamp: new Date().toISOString(),
              status: 'Pending',
              feedbackSubmitted: false,
              ...msg.orderData
            };
            data.orders.push(newOrder);
            persist(data);

            // Reply to sender with the created order
            senderWs.send(JSON.stringify({ type: 'ORDER_CREATED', order: newOrder, requestId: reqId }));
            // Broadcast full orders list to everyone
            const ordersReply = { type: 'ORDERS_UPDATED', orders: data.orders };
            senderWs.send(JSON.stringify(ordersReply));
            broadcast(ordersReply, senderWs);
            break;
          }

          case 'UPDATE_ORDER_STATUS': {
            const idx = data.orders.findIndex((o) => o.id === msg.orderId);
            if (idx > -1) {
              data.orders[idx].status = msg.status;
              data.orders[idx][`time_${msg.status.toLowerCase()}`] = new Date().toISOString();
              persist(data);
              const reply = { type: 'ORDERS_UPDATED', orders: data.orders, requestId: reqId };
              senderWs.send(JSON.stringify(reply));
              broadcast(reply, senderWs);
            }
            break;
          }

          // ── Settings ──────────────────────────────────────────────────
          case 'SAVE_SETTINGS': {
            data.settings = { ...data.settings, ...msg.settings };
            persist(data);
            const reply = { type: 'SETTINGS_UPDATED', settings: data.settings, requestId: reqId };
            senderWs.send(JSON.stringify(reply));
            broadcast(reply, senderWs);
            break;
          }

          // ── Feedback ──────────────────────────────────────────────────
          case 'SUBMIT_FEEDBACK': {
            const fb = {
              id: 'f_' + Date.now(),
              timestamp: new Date().toISOString(),
              ...msg.feedbackData
            };
            data.feedback.push(fb);

            // Mark order as feedback-submitted
            if (msg.feedbackData.orderId) {
              const oi = data.orders.findIndex((o) => o.id === msg.feedbackData.orderId);
              if (oi > -1) data.orders[oi].feedbackSubmitted = true;
            }
            persist(data);

            senderWs.send(JSON.stringify({ type: 'FEEDBACK_CREATED', feedback: fb, requestId: reqId }));
            const fbReply = { type: 'FEEDBACK_UPDATED', feedback: data.feedback };
            senderWs.send(JSON.stringify(fbReply));
            broadcast(fbReply, senderWs);

            if (msg.feedbackData.orderId) {
              const ordersReply = { type: 'ORDERS_UPDATED', orders: data.orders };
              senderWs.send(JSON.stringify(ordersReply));
              broadcast(ordersReply, senderWs);
            }
            break;
          }

          case 'GET_STATE': {
            senderWs.send(JSON.stringify({ type: 'STATE', data, requestId: reqId }));
            break;
          }

          default:
            console.warn('[Paddu WS] Unknown message type:', msg.type);
        }
      }

      console.log('[Paddu WS] 🚀 Real-time sync server ready at /api/ws');
    }
  };
}
