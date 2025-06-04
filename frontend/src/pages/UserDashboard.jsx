import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  useTheme,
  useMediaQuery,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Restaurant as RestaurantIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  LocalShipping as CurrentOrderIcon,
  History as HistoryIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

import Menu from '../components/user/Menu';
import Cart from '../components/user/Cart';
import Favorites from '../components/user/Favorites';
import CurrentOrder from '../components/user/CurrentOrder';
import OrderHistory from '../components/user/OrderHistory';

const drawerWidth = 240;

const UserDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('menu');
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(userData);
      if (!parsedUser || !parsedUser.id) {
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      setUser({ 
        ...parsedUser,
        userid: parsedUser.id,
        id: parsedUser.id
      });
      setLoading(false);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (user?.userid) {
      fetchCartCount();
    }
  }, [user]);

  const fetchCartCount = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/cart/${user.userid}/count`);
      const data = await response.json();
      if (data.success) {
        setCartCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuSelect = (menu) => {
    setSelectedMenu(menu);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { text: 'Menu', icon: <RestaurantIcon />, value: 'menu' },
    { text: 'Cart', icon: <Badge badgeContent={cartCount} color="primary"><CartIcon /></Badge>, value: 'cart' },
    { text: 'Favorites', icon: <FavoriteIcon />, value: 'favorites' },
    { text: 'Current Order', icon: <CurrentOrderIcon />, value: 'current-order' },
    { text: 'Order History', icon: <HistoryIcon />, value: 'order-history' },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Food Ordering
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.value}
            onClick={() => handleMenuSelect(item.value)}
            selected={selectedMenu === item.value}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <Divider />
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  const renderContent = () => {
    if (!user) return null;
    
    switch (selectedMenu) {
      case 'menu':
        return <Menu updateCartCount={setCartCount} user={user} />;
      case 'cart':
        return <Cart updateCartCount={setCartCount} user={user} />;
      case 'favorites':
        return <Favorites updateCartCount={setCartCount} user={user} />;
      case 'current-order':
        return <CurrentOrder user={user} />;
      case 'order-history':
        return <OrderHistory user={user} />;
      default:
        return <Menu updateCartCount={setCartCount} user={user} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

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
          <Typography variant="h6" noWrap component="div">
            {menuItems.find(item => item.value === selectedMenu)?.text || 'Menu'}
          </Typography>
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
            keepMounted: true,
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
        }}
      >
        <Toolbar />
        {renderContent()}
      </Box>
    </Box>
  );
};

export default UserDashboard; 