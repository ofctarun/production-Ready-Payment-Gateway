import React from 'react';
import { createRoot } from 'react-dom/client';
import CheckoutForm from './CheckoutForm';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<CheckoutForm />);
