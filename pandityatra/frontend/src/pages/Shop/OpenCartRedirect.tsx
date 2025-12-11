import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';

const OpenCartRedirect: React.FC = () => {
  const { openDrawer } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    openDrawer();
    // navigate back to home (or previous) while drawer remains open
    navigate('/', { replace: true });
  }, [openDrawer, navigate]);

  return null;
};

export default OpenCartRedirect;
