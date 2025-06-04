import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  Menu as MuiMenu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Divider,
  Container,
} from '@mui/material';
import {
  Menu as MenuIcon,
  RestaurantMenu,
  ShoppingCart,
  Favorite,
  Receipt,
  Logout,
  AccountCircle,
  ReceiptLong,
  MenuBook,
} from '@mui/icons-material';

// Import your components
import Menu from '../components/user/Menu';
import Cart from '../components/user/Cart';
import Favorites from '../components/user/Favorites';
import CurrentOrder from '../components/user/CurrentOrder';
import OrderHistory from '../components/user/OrderHistory';

function UserDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  
  const drawerWidth = 240;
  
  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      console.log('Loaded user data:', userData); // Debug log
      setUser(userData);
    } else {
      // Redirect to login if no user
      console.log('No user data found in localStorage, redirecting to login');
      navigate('/login');
    }
  }, [navigate]);
  
  useEffect(() => {
    if (user) {
      fetchCartCount();
      fetchFavoritesCount();
    }
  }, [user]);
  
  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);
  
  const fetchCartCount = async () => {
    if (!user) return;
    
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
  
  const fetchFavoritesCount = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/favorites/${user.userid}`);
      const data = await response.json();
      
      if (data.success) {
        setFavoritesCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching favorites count:', error);
    }
  };
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleProfileMenuOpen = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const navigationItems = [
    { text: 'Menu', icon: <MenuBook />, path: '/user/menu' },
    { text: 'Cart', icon: <ShoppingCart />, path: '/user/cart', count: cartCount },
    { text: 'Favorites', icon: <Favorite />, path: '/user/favorites', count: favoritesCount },
    { text: 'Current Order', icon: <Receipt />, path: '/user/current-order' },
    { text: 'Order History', icon: <ReceiptLong />, path: '/user/order-history' },
  ];
  
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <RestaurantMenu sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          Food Ordering
        </Typography>
      </Box>
      
      <List sx={{ flexGrow: 1 }}>
        {navigationItems.map((item) => (
          <ListItem 
            button 
            component={Link} 
            to={item.path} 
            key={item.text}
            selected={isActive(item.path)}
            sx={{
              borderRadius: 2,
              mx: 1,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.contrastText,
                },
              },
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: isActive(item.path) 
                  ? theme.palette.primary.contrastText 
                  : theme.palette.text.primary,
                minWidth: 40,
              }}
            >
              {item.count > 0 ? (
                <Badge badgeContent={item.count} color="secondary">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      {user && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 40,
              height: 40
            }}
          >
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ ml: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {user.name || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {user.email || ''}
            </Typography>
          </Box>
        </Box>
      )}
      
      <Button
        variant="outlined"
        color="primary"
        startIcon={<Logout />}
        onClick={handleLogout}
        sx={{ m: 2 }}
      >
        Logout
      </Button>
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar for mobile */}
      <AppBar 
        position="fixed" 
        sx={{ 
          display: { xs: 'flex', md: 'flex' },
          width: { md: drawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { md: drawerOpen ? `${drawerWidth}px` : 0 },
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              color: 'text.primary',
              fontWeight: 600,
            }}
          >
            {navigationItems.find(item => isActive(item.path))?.text || 'Dashboard'}
          </Typography>
          
          <IconButton 
            component={Link} 
            to="/user/cart"
            color="inherit"
            sx={{ color: 'text.primary', mr: 1 }}
          >
            <Badge badgeContent={cartCount} color="secondary">
              <ShoppingCart />
            </Badge>
          </IconButton>
          
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{ color: 'text.primary' }}
          >
            <AccountCircle />
          </IconButton>
          
          <MuiMenu
            anchorEl={profileAnchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(profileAnchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </MuiMenu>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          '& .MuiDrawer-paper': { 
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px 0px',
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          width: { sm: drawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { sm: drawerOpen ? `${drawerWidth}px` : 0 },
          height: '100vh',
          overflow: 'auto',
          bgcolor: 'background.default',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          pt: drawerOpen ? 2 : 0,
        }}
      >
        <Toolbar sx={{ display: { xs: 'block', md: 'block' } }} />
        <Container maxWidth="xl" sx={{ py: drawerOpen ? 2 : 3 }}>
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/cart" element={<Cart updateCartCount={fetchCartCount} user={user} />} />
            <Route path="/favorites" element={<Favorites updateFavoritesCount={fetchFavoritesCount} user={user} />} />
            <Route path="/current-order" element={<CurrentOrder user={user} />} />
            <Route path="/order-history" element={<OrderHistory user={user} />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}

export default UserDashboard; 