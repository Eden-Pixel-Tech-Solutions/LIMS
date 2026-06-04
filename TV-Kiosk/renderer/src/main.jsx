import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import LabTVMode from './pages/LabTVMode';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LabTVMode />
  </StrictMode>
);
