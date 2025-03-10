import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from '@/App';
import ErrorPage from '@/components/error-page';
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';
import ForgotPassword from '@/components/auth/ForgotPassword';
import ResetPassword from '@/components/auth/ResetPassword';
import Dashboard from '@/components/dashboard/Dashboard';
import Inventory from '@/routes/inventory';
import InventoryCategories from '@/routes/inventory-categories';
import InventoryMovements from '@/routes/inventory-movements';
import Suppliers from '@/routes/suppliers';
import Suitcases from '@/routes/suitcases';
import SuitcaseDetails from '@/routes/suitcase-details';
import PlatingTypes from '@/routes/plating-types';
import Profile from '@/routes/profile';
import Users from '@/routes/users';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: '/reset-password',
        element: <ResetPassword />,
      },
      {
        path: '/dashboard',
        element: <Dashboard />,
        children: [
          {
            path: '/dashboard',
            element: <Inventory />,
          },
          {
            path: '/dashboard/inventory',
            element: <Inventory />,
          },
          {
            path: '/dashboard/inventory-categories',
            element: <InventoryCategories />,
          },
          {
            path: '/dashboard/inventory-movements',
            element: <InventoryMovements />,
          },
          {
            path: '/dashboard/suppliers',
            element: <Suppliers />,
          },
          {
            path: '/dashboard/suitcases',
            element: <Suitcases />,
          },
          {
            path: '/dashboard/suitcases/:id',
            element: <SuitcaseDetails />,
          },
          {
            path: '/dashboard/plating-types',
            element: <PlatingTypes />,
          },
          {
            path: '/dashboard/profile',
            element: <Profile />,
          },
           {
            path: '/dashboard/users',
            element: <Users />,
          },
        ],
      },
    ],
  },
]);

export default router;
