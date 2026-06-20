import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState('landing');

  return (
    <>
      {view === 'landing' ? (
        <LandingPage onViewChange={setView} />
      ) : (
        <Dashboard onViewChange={setView} />
      )}
    </>
  );
}

export default App;
