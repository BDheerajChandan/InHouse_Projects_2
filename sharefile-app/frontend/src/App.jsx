import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';

/**
 * App — root component, manages global state shared between Navbar and Home
 */
function App() {
  const [serverInfo, setServerInfo] = useState(null);
  const [connected, setConnected] = useState(false);

  // Listen for serverInfo events from Home page
  useEffect(() => {
    const handler = (e) => {
      setServerInfo(e.detail.serverInfo);
      setConnected(e.detail.connected);
    };
    window.addEventListener('serverInfo', handler);
    return () => window.removeEventListener('serverInfo', handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <Navbar serverInfo={serverInfo} connected={connected} />
      <Home />
    </div>
  );
}

export default App;
