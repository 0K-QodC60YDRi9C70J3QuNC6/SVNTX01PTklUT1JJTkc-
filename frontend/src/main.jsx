import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.jsx';

import 'leaflet/dist/leaflet.css';
import './styles.css';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(<App />);
