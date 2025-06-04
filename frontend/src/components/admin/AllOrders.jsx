import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/orders');
      const data = await response.json();
      
      if (data.success) {
        const formattedOrders = data.orders.map(order => ({
          ...order,
          order_date: new Date(order.order_date).toLocaleString()
        }));
        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error('Error fetching all orders:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching orders',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`http://localhost:3000/api/orders/${orderId}/details`);
      const data = await response.json();
      
      if (data.success) {
        setOrderDetails(data.orderItems || []);
        setDetailsOpen(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching order details',
        severity: 'error'
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setSnackbar({
          open: true,
          message: `Order status updated to ${newStatus}`,
          severity: 'success'
        });
        fetchAllOrders();
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Error updating order status',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setSnackbar({
        open: true,
        message: 'Error updating order status',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'processing':
        return 'info';
      case 'ready':
        return 'primary';
      default:
        return 'default';
    }
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price_at_order || 0);
      const quantity = parseInt(item.quantity || 0, 10);
      return sum + (price * quantity);
    }, 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        All Orders
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.orderid}>
                <TableCell>{order.orderid}</TableCell>
                <TableCell>{order.user_name || 'Unknown'}</TableCell>
                <TableCell>{order.order_date}</TableCell>
                <TableCell>
                  <Chip
                    label={order.status?.charAt(0).toUpperCase() + order.status?.slice(1).toLowerCase()}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedOrder(order);
                        fetchOrderDetails(order.orderid);
                      }}
                    >
                      View Details
                    </Button>
                    {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          onClick={() => handleStatusChange(order.orderid, 'Completed')}
                        >
                          Complete
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleStatusChange(order.orderid, 'Cancelled')}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Order Details - #{selectedOrder?.orderid}
          <Typography variant="subtitle2" color="text.secondary">
            Status: {selectedOrder?.status}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderDetails.map((item) => {
                    const price = parseFloat(item.price_at_order || 0);
                    const quantity = parseInt(item.quantity || 0, 10);
                    return (
                      <TableRow key={item.orderitemid}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{quantity}</TableCell>
                        <TableCell align="right">
                          ₹{price.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          ₹{(price * quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      <strong>Total:</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>₹{calculateTotal(orderDetails).toFixed(2)}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AllOrders;
