import React, { useState, useEffect } from 'react';
import { OrderProvider, useOrder } from './context/OrderContext';
import { CustomerView } from './components/CustomerView';
import { OrderTracker } from './components/OrderTracker';
import { AdminView } from './components/AdminView';
import { Sun, Moon, Utensils, ClipboardList, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
import './styles/app.css';

const MainAppContent = () => {
  const { tableNumber, setTableNumber, theme, toggleTheme, currentOrder, isServerConnected } = useOrder();
  
  // Custom router state using hash
  const [route, setRoute] = useState(() => window.location.hash || '#/');

  // Listen to hash changes for routing
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Parse Table Number query parameter from URL (e.g. ?table=3)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam) {
      setTableNumber(tableParam);
      // Clean query parameters from URL without reloading page, maintaining hash
      const cleanUrl = window.location.pathname + (window.location.hash || '#/');
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [setTableNumber]);

  // Navigate to tracker route helper
  const navigateToTracker = () => {
    window.location.hash = '#/track';
  };

  const navigateToMenu = () => {
    window.location.hash = '#/';
  };

  const navigateToAdmin = () => {
    window.location.hash = '#/admin';
  };

  // Select view based on route
  const renderView = () => {
    switch (route) {
      case '#/admin':
        return <AdminView />;
      case '#/track':
        return <OrderTracker onBackToMenu={navigateToMenu} />;
      case '#/':
      default:
        return <CustomerView onViewTracker={navigateToTracker} />;
    }
  };

  const isAdminRoute = route === '#/admin';

  return (
    <div className={`app-container ${isAdminRoute ? 'full-width' : ''}`}>
      {/* App Header */}
      <header className="app-header">
        <div className="logo-section" style={{ cursor: 'pointer' }} onClick={navigateToMenu}>
          <div className="logo-icon">PP</div>
          <h1>Paddu <span>Point</span></h1>
        </div>

        {/* Connection Status Indicator */}
        <div 
          className={`connection-badge ${isServerConnected ? 'connected' : 'disconnected'}`}
          title={isServerConnected ? 'Sync server connected — phone orders will appear here!' : 'Not connected to sync server — phone orders won\'t sync'}
        >
          {isServerConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{isServerConnected ? 'Live' : 'Offline'}</span>
        </div>

        <div className="header-actions">
          {/* Direct navigation links */}
          <button 
            className="icon-btn" 
            onClick={navigateToMenu} 
            title="View Menu"
            style={{ display: route === '#/' ? 'none' : 'flex' }}
          >
            <Utensils size={18} />
          </button>

          {currentOrder && route !== '#/track' && (
            <button 
              className="icon-btn" 
              onClick={navigateToTracker} 
              title="Track Order"
              style={{ border: '2px solid var(--primary)', backgroundColor: 'var(--primary-light)' }}
            >
              <ClipboardList size={18} color="var(--primary)" />
              <span className="badge" style={{ backgroundColor: 'var(--primary)' }}>!</span>
            </button>
          )}

          {/* Theme Selector Toggle */}
          <button className="icon-btn" onClick={toggleTheme} title="Toggle Light/Dark Theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          <button 
            className="icon-btn" 
            onClick={navigateToAdmin} 
            title="Vendor Admin Panel"
            style={{ background: isAdminRoute ? 'var(--primary)' : 'var(--bg-secondary)', color: isAdminRoute ? 'white' : 'var(--text-color)' }}
          >
            <ShieldAlert size={18} />
          </button>
        </div>
      </header>

      {/* Render Current Page View */}
      {renderView()}

      {/* Persistent Footer on Customer Views */}
      {!isAdminRoute && (
        <footer style={{ 
          padding: '24px 20px', 
          textAlign: 'center', 
          fontSize: '12px', 
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          marginTop: 'auto'
        }}>
          <div><b>Paddu Point Ordering App</b></div>
          <div style={{ marginTop: '4px' }}>Scan QR Code on Table • Order Instantly • Eat Fresh & Hot!</div>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <a href="#/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Menu Home</a>
            <span>•</span>
            <a href="#/track" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Track Active Order</a>
            <span>•</span>
            <a href="#/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Vendor Dashboard</a>
          </div>
        </footer>
      )}
    </div>
  );
};

function App() {
  return (
    <OrderProvider>
      <MainAppContent />
    </OrderProvider>
  );
}

export default App;
