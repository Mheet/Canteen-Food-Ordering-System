import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
  Grid,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';

// Simple data URL for a gray image with text
const fallbackImageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='140' viewBox='0 0 300 140'%3E%3Crect width='300' height='140' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' text-anchor='middle' dominant-baseline='middle' fill='%23757575'%3ENo Image%3C/text%3E%3C/svg%3E";

// CSS for consistent image styling
const imageStyles = {
  objectFit: 'cover',
  width: '100%',
  height: '200px',
  display: 'block',
};

const Favorites = ({ updateCartCount, user }) => {
  const [favorites, setFavorites] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user?.userid) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user?.userid) {
      console.error('No user ID available');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching favorites for user:', user.userid);
      const response = await fetch(`http://localhost:3000/api/favorites/${user.userid}`);
      const data = await response.json();
      console.log('Favorites API response:', data); // Debug log

      if (data.success && Array.isArray(data.items)) {
        // Ensure price is a number
        const itemsWithNumericPrice = data.items.map(item => ({
          ...item,
          price: parseFloat(item.price)
        }));
        console.log('Processed favorites:', itemsWithNumericPrice); // Debug log
        setFavorites(itemsWithNumericPrice);
        
        // Initialize quantities state
        const initialQuantities = {};
        itemsWithNumericPrice.forEach(item => {
          initialQuantities[item.fooditemid] = 0;
        });
        setQuantities(initialQuantities);
      } else {
        console.error('Invalid favorites data:', data);
        setSnackbar({
          open: true,
          message: data.message || 'Failed to load favorites',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load favorites',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId, delta) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
    }));
  };

  const handleRemoveFavorite = async (itemId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/favorites/${user.userid}/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        await fetchFavorites();
        setSnackbar({
          open: true,
          message: 'Removed from favorites',
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      setSnackbar({
        open: true,
        message: 'Failed to remove from favorites',
        severity: 'error',
      });
    }
  };

  const handleAddToCart = async (item) => {
    if (quantities[item.fooditemid] === 0) return;

    try {
      const response = await fetch('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userid: user.userid,
          fooditemid: item.fooditemid,
          quantity: quantities[item.fooditemid],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setQuantities(prev => ({
          ...prev,
          [item.fooditemid]: 0
        }));
        setSnackbar({
          open: true,
          message: 'Added to cart successfully!',
          severity: 'success',
        });
        // Update cart count in parent component
        const cartResponse = await fetch(`http://localhost:3000/api/cart/${user.userid}/count`);
        const cartData = await cartResponse.json();
        if (cartData.success) {
          updateCartCount(cartData.count);
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add to cart',
        severity: 'error',
      });
    }
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
        Favorite Items
      </Typography>

      {favorites.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          You haven't added any items to your favorites yet
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {favorites.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.fooditemid}>
              <Card>
                <CardMedia
                  component="img"
                  height={200}
                  image={item.image_url || fallbackImageUrl}
                  alt={item.name}
                  sx={imageStyles}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackImageUrl;
                  }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">
                      {item.name}
                    </Typography>
                    <IconButton
                      onClick={() => handleRemoveFavorite(item.fooditemid)}
                      color="primary"
                    >
                      <FavoriteIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                    ${item.price.toFixed(2)}
                  </Typography>
                  {!item.availability ? (
                    <Typography color="error">Out of Stock</Typography>
                  ) : (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.fooditemid, -1)}
                        disabled={quantities[item.fooditemid] === 0}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <TextField
                        size="small"
                        value={quantities[item.fooditemid] || 0}
                        InputProps={{
                          readOnly: true,
                          sx: { width: '60px', mx: 1, textAlign: 'center' },
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.fooditemid, 1)}
                        disabled={quantities[item.fooditemid] >= item.stock_quantity}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={!item.availability || quantities[item.fooditemid] === 0}
                    onClick={() => handleAddToCart(item)}
                  >
                    Add to Cart
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

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

export default Favorites; 