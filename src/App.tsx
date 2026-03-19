import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MetaAds } from './pages/MetaAds';
import { Financeiro } from './pages/Financeiro';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/meta-ads" replace />} />
          <Route path="/meta-ads" element={<MetaAds />} />
          <Route path="/financeiro" element={<Financeiro />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
