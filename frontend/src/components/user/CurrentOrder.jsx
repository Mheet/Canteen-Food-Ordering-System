import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

const orderSteps = ['Order Placed', 'Preparing', 'Ready for Pickup', 'Completed'];

const CurrentOrder = ({ user }) => {
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.userid) {
      fetchCurrentOrder();
      const interval = setInterval(fetchCurrentOrder, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchCurrentOrder = async () => {
    if (!user?.userid) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/orders/current/${user.userid}`);
      const data = await response.json();
      console.log('Current order data:', data); // Debug log

      if (data.success) {
        setCurrentOrder(data.order);
        setOrderItems(data.items || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching current order:', error);
      setLoading(false);
    }
  };

  const getStepIndex = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 0;
      case 'processing':
        return 1;
      case 'ready':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
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

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price_at_order * item.quantity), 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentOrder || !orderItems.length) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Current Order
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You don't have any active orders
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Current Order
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="text.secondary">
                Order Number
              </Typography>
              <Typography variant="h6">
                #{currentOrder.orderid}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="text.secondary">
                Order Date
              </Typography>
              <Typography variant="h6">
                {formatDate(currentOrder.order_date)}
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Stepper activeStep={getStepIndex(currentOrder.status)} alternativeLabel>
              {orderSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" gutterBottom>
            Order Details
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item.orderitemid}>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">₹{item.price_at_order.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      ₹{(item.price_at_order * item.quantity).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="subtitle1">Total</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle1">
                      ₹{calculateTotal().toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {currentOrder.status?.toLowerCase() === 'ready' && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="subtitle1" color="success.contrastText">
                Your order is ready for pickup! Please collect it from the counter.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CurrentOrder;
