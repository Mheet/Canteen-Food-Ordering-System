import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Button,
  useTheme,
  Stack,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Category as CategoryIcon,
  ShoppingCart as CartIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

function Dashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    categories: 0,
    foodItems: 0,
    pendingOrders: 0,
    completedOrders: 0,
    revenue: 0,
    todayRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    // Simulate fetching dashboard data
    setTimeout(() => {
      fetchDashboardData();
    }, 1000);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch categories count
      const categoriesResponse = await fetch('http://localhost:3000/api/categories');
      const categoriesData = await categoriesResponse.json();
      
      // Fetch food items
      const foodItemsResponse = await fetch('http://localhost:3000/api/food-items');
      const foodItemsData = await foodItemsResponse.json();
      
      // Fetch pending orders
      const pendingOrdersResponse = await fetch('http://localhost:3000/api/orders/pending');
      const pendingOrdersData = await pendingOrdersResponse.json();
      
      // Fetch all orders for completed count and revenue
      const ordersResponse = await fetch('http://localhost:3000/api/orders');
      const ordersData = await ordersResponse.json();
      
      // Fetch today's revenue
      const todayRevenueResponse = await fetch('http://localhost:3000/api/admin/revenue/today');
      const todayRevenueData = await todayRevenueResponse.json();
      
      // Calculate statistics
      const completedOrders = ordersData.success ? 
        ordersData.orders.filter(order => order.status === 'Completed').length : 0;
      
      // Calculate total revenue (simplified)
      let totalRevenue = 0;
      if (ordersData.success) {
        // This is simplified - in a real app you'd calculate from order details
        ordersData.orders.forEach(order => {
          if (order.total_amount) {
            totalRevenue += parseFloat(order.total_amount);
          }
        });
      }
      
      // Update stats
      setStats({
        categories: categoriesData.success ? categoriesData.categories.length : 0,
        foodItems: foodItemsData.success ? foodItemsData.foodItems.length : 0,
        pendingOrders: pendingOrdersData.success ? pendingOrdersData.orders.length : 0,
        completedOrders,
        revenue: totalRevenue,
        todayRevenue: todayRevenueData.success ? parseFloat(todayRevenueData.today_revenue) : 0
      });
      
      // Get recent orders for display
      if (ordersData.success) {
        setRecentOrders(ordersData.orders.slice(0, 5));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, link, children }) => (
    <Card 
      sx={{ 
        height: '100%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          {value}
        </Typography>
        {children}
        {link && (
          <Button 
            component={Link} 
            to={link} 
            size="small" 
            color={color} 
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );

  // Format date as DD-MM-YYYY
  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Get current date
  const today = new Date();

  return (
    <Box>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: `linear-gradient(45deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography variant="body1">
          Welcome to the admin dashboard. Here's an overview of your restaurant's statistics.
        </Typography>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Categories"
                value={stats.categories}
                icon={<CategoryIcon />}
                color="primary"
                link="/admin/categories"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Food Items"
                value={stats.foodItems}
                icon={<RestaurantIcon />}
                color="success"
                link="/admin/food-items"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Pending Orders"
                value={stats.pendingOrders}
                icon={<CartIcon />}
                color="warning"
                link="/admin/orders"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Completed Orders"
                value={stats.completedOrders}
                icon={<CartIcon />}
                color="info"
                link="/admin/orders"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Total Revenue"
                value={`₹${stats.revenue.toFixed(2)}`}
                icon={<TrendingUpIcon />}
                color="error"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Today's Revenue"
                value={`₹${stats.todayRevenue.toFixed(2)}`}
                icon={<CalendarIcon />}
                color="secondary"
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <TimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(today)}
                  </Typography>
                </Stack>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mt: 1,
                    pt: 1,
                    borderTop: `1px dashed ${theme.palette.divider}`
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₹{stats.revenue.toFixed(2)}
                  </Typography>
                </Box>
              </StatCard>
            </Grid>
          </Grid>

          <Box sx={{ mt: 5 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Recent Orders
            </Typography>
            <Paper sx={{ overflow: 'hidden', borderRadius: 2 }}>
              {recentOrders.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No recent orders found
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {recentOrders.map((order, index) => (
                    <Box key={order.orderid}>
                      {index > 0 && <Divider />}
                      <Box sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4} md={3}>
                            <Typography variant="subtitle1" fontWeight={500}>
                              #{order.orderid}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <TimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                              {new Date(order.order_date).toLocaleString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4} md={3}>
                            <Typography variant="body2" fontWeight={500}>
                              {order.user_name || 'Unknown User'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4} md={3}>
                            <Box sx={{ 
                              display: 'inline-block',
                              px: 1.5, 
                              py: 0.5, 
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              color: getStatusColor(order.status).text,
                              bgcolor: getStatusColor(order.status).bg,
                            }}>
                              {order.status}
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={12} md={3} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                            <Button 
                              component={Link} 
                              to={`/admin/orders?id=${order.orderid}`}
                              size="small"
                              variant="outlined"
                            >
                              View Details
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// Helper function to get status color
function getStatusColor(status) {
  switch (status) {
    case 'Pending':
      return { bg: '#fff8e1', text: '#f57c00' };
    case 'Processing':
      return { bg: '#e3f2fd', text: '#1976d2' };
    case 'Completed':
      return { bg: '#e8f5e9', text: '#2e7d32' };
    case 'Cancelled':
      return { bg: '#ffebee', text: '#d32f2f' };
    default:
      return { bg: '#f5f5f5', text: '#757575' };
  }
}

export default Dashboard; 