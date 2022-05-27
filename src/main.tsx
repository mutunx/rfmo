import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

import './global.less';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  /*
  * 严格模式：检查开发中的不规范行为，只在开发环境下生效
  * */
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
