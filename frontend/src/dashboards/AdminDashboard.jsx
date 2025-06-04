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
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Divider,
  Container,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  Fastfood as FoodIcon,
  ListAlt as OrderIcon,
  Logout,
  AccountCircle,
  RestaurantMenu,
} from '@mui/icons-material';

// Import your admin components
import Dashboard from '../components/admin/Dashboard';
import Categories from '../components/admin/Categories';
import FoodItems from '../components/admin/FoodItems';
import Orders from '../components/admin/Orders';

function AdminDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  
  const drawerWidth = 240;
  
  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Check if user is admin
      if (parsedUser.role === 'admin') {
        setUser(parsedUser);
      } else {
        // Redirect to user dashboard if not admin
        navigate('/user/menu');
      }
    } else {
      // Redirect to login if no user
      navigate('/login');
    }
  }, [navigate]);
  
  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);
  
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
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/admin/categories' },
    { text: 'Food Items', icon: <FoodIcon />, path: '/admin/food-items' },
    { text: 'Orders', icon: <OrderIcon />, path: '/admin/orders' },
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
          Admin Panel
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
              {item.icon}
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
            {user.name?.charAt(0).toUpperCase() || 'A'}
          </Avatar>
          <Box sx={{ ml: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {user.name || 'Admin'}
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
            {navigationItems.find(item => isActive(item.path))?.text || 'Admin Panel'}
          </Typography>
          
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
          
          <Menu
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
          </Menu>
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
          pt: drawerOpen ? 2 : 0
        }}
      >
        <Toolbar sx={{ display: { xs: 'block', md: 'block' } }} />
        <Container maxWidth="xl" sx={{ py: drawerOpen ? 2 : 3 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/food-items" element={<FoodItems />} />
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}

export default AdminDashboard; 