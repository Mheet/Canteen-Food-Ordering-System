import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Grid,
  TextField,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const Cart = ({ updateCartCount, user }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, itemId: null });
  const [orderDialog, setOrderDialog] = useState({ open: false, orderId: null, items: null });

  const fetchCartItems = async () => {
    if (!user?.userid) return;

    try {
      const response = await fetch(`http://localhost:3000/api/cart/${user.userid}`);
      const data = await response.json();
      if (data.success) {
        const itemsWithNumericPrice = (data.items || []).map(item => ({
          ...item,
          price: parseFloat(item.price),
        }));
        setCartItems(itemsWithNumericPrice);
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Failed to load cart items',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load cart items',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userid) {
      fetchCartItems();
    }
  }, [user]);

  const handleQuantityChange = async (itemId, delta) => {
    const item = cartItems.find(i => i.cartitemid === itemId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) {
      setConfirmDialog({ open: true, itemId });
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchCartItems();
        const countResponse = await fetch(`http://localhost:3000/api/cart/${user.userid}/count`);
        const countData = await countResponse.json();
        if (countData.success) updateCartCount(countData.count);
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Failed to update quantity',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update quantity',
        severity: 'error',
      });
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setConfirmDialog({ open: false, itemId: null });
        await fetchCartItems();
        const countResponse = await fetch(`http://localhost:3000/api/cart/${user.userid}/count`);
        const countData = await countResponse.json();
        if (countData.success) updateCartCount(countData.count);
        setSnackbar({
          open: true,
          message: 'Item removed from cart',
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to remove item',
        severity: 'error',
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (!user?.userid) {
      setSnackbar({ open: true, message: 'Please log in to place an order', severity: 'error' });
      return;
    }

    if (cartItems.length === 0) {
      setSnackbar({ open: true, message: 'Your cart is empty', severity: 'error' });
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userid }),
      });

      const data = await response.json();
      if (data.success) {
        setOrderDialog({ open: true, orderId: data.orderId, items: data.items });
        await fetchCartItems();
        const countResponse = await fetch(`http://localhost:3000/api/cart/${user.userid}/count`);
        const countData = await countResponse.json();
        if (countData.success) updateCartCount(countData.count);
        setSnackbar({
          open: true,
          message: 'Order placed successfully!',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Failed to place order',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to place order',
        severity: 'error',
      });
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
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
      <Typography variant="h5" gutterBottom>
        Shopping Cart
      </Typography>

      {cartItems.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Your cart is empty
        </Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {cartItems.map((item) => (
              <Grid item xs={12} key={item.cartitemid}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6">{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          ₹{item.price.toFixed(2)} each
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <IconButton size="small" onClick={() => handleQuantityChange(item.cartitemid, -1)}>
                            <RemoveIcon />
                          </IconButton>
                          <TextField
                            size="small"
                            value={item.quantity}
                            InputProps={{
                              readOnly: true,
                              sx: { width: '60px', mx: 1, textAlign: 'center' },
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.cartitemid, 1)}
                            disabled={item.quantity >= item.stock_quantity}
                          >
                            <AddIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => setConfirmDialog({ open: true, itemId: item.cartitemid })}
                          >
                            <DeleteIcon />
                          </IconButton>
                          <Typography variant="subtitle1" sx={{ ml: 2, minWidth: '80px' }}>
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mr: 3 }}>
              Total: ₹{calculateTotal().toFixed(2)}
            </Typography>
            <Button variant="contained" color="primary" size="large" onClick={handlePlaceOrder}>
              Place Order
            </Button>
          </Box>
        </>
      )}

      {/* Remove Item Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, itemId: null })}>
        <DialogTitle>Remove Item</DialogTitle>
        <DialogContent>
          Are you sure you want to remove this item from your cart?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, itemId: null })}>Cancel</Button>
          <Button
            onClick={() => handleRemoveItem(confirmDialog.itemId)}
            color="error"
            variant="contained"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Placed Dialog */}
      <Dialog
        open={orderDialog.open}
        onClose={() => setOrderDialog({ open: false, orderId: null, items: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Order Placed Successfully!</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Order #{orderDialog.orderId}
          </Typography>
          {orderDialog.items && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Order Summary:
              </Typography>
              <Box sx={{ mt: 2 }}>
                {orderDialog.items.map((item) => (
                  <Box key={item.fooditemid} sx={{ mb: 1 }}>
                    <Typography>
                      {item.name} x {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Total: ₹{orderDialog.items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
                </Typography>
              </Box>
            </>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            You can track your order status in the Current Order section.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOrderDialog({ open: false, orderId: null, items: null })}
            color="primary"
            variant="contained"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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

export default Cart;
