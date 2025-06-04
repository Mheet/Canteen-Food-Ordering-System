import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  TablePagination,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (user?.userid) {
      fetchOrderHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrderHistory = async () => {
    if (!user?.userid) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/orders/history/${user.userid}`);
      const data = await response.json();
      
      console.log('Order history data:', data); // Debug log
      
      if (data.success) {
        setOrders(data.orders || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order history:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'ready':
        return 'primary';
      default:
        return 'default';
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user?.userid) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Order History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please log in to view your order history
        </Typography>
      </Box>
    );
  }

  if (orders.length === 0) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Order History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You haven't placed any orders yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Order History
      </Typography>

      <Card>
        <CardContent>
          {orders
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((order) => (
              <Accordion key={order.orderid} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle1">
                        Order #{order.orderid}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.order_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle1" color="primary">
                        ₹{(order.total_amount || 0).toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Chip
                        label={order.status?.charAt(0).toUpperCase() + order.status?.slice(1).toLowerCase()}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Items:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {order.items}
                    </Typography>
                    <Typography variant="subtitle2" color="primary">
                      Total Amount: ₹{(order.total_amount || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Items: {order.item_count}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}

          <TablePagination
            component="div"
            count={orders.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default OrderHistory;
