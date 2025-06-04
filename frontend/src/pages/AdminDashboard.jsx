import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Category as CategoryIcon,
  ShoppingCart as OrdersIcon,
  Pending as PendingIcon,
  CheckCircle as CompletedIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FoodItems from '../components/admin/FoodItems';
import Categories from '../components/admin/Categories';
import AllOrders from '../components/admin/AllOrders';
import PendingOrders from '../components/admin/PendingOrders';
import CompletedOrders from '../components/admin/CompletedOrders';

const drawerWidth = 240;

const AdminDashboard = () => {
  const [selectedMenu, setSelectedMenu] = useState('pending-orders');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { text: 'Pending Orders', icon: <PendingIcon />, value: 'pending-orders' },
    { text: 'All Orders', icon: <OrdersIcon />, value: 'all-orders' },
    { text: 'Completed Orders', icon: <CompletedIcon />, value: 'completed-orders' },
    { text: 'Food Items', icon: <RestaurantIcon />, value: 'food-items' },
    { text: 'Categories', icon: <CategoryIcon />, value: 'categories' },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'food-items':
        return <FoodItems />;
      case 'categories':
        return <Categories />;
      case 'all-orders':
        return <AllOrders />;
      case 'pending-orders':
        return <PendingOrders />;
      case 'completed-orders':
        return <CompletedOrders />;
      default:
        return <PendingOrders />;
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin Panel
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.value}
            selected={selectedMenu === item.value}
            onClick={() => setSelectedMenu(item.value)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.value === selectedMenu)?.text || 'Admin Dashboard'}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default AdminDashboard; 