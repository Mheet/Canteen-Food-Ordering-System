import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  IconButton,
  CardActions,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';

const Menu = ({ user, onCartUpdate, defaultFoodImage }) => {
  const [items, setItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    fetchItems();
    if (user?.userid) {
      fetchFavorites();
    }
  }, [user]);

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/menu');
      const data = await response.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setSnackbar({
        open: true,
        message: 'Error loading menu items',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user?.userid) {
      setFavorites([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/favorites/${user.userid}`);
      const data = await response.json();
      
      console.log('Favorites response:', data); // Debug log
      
      if (data.success) {
        setFavorites(data.items || []);
      } else {
        console.error('Error in favorites response:', data.message);
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    }
  };

  const toggleFavorite = async (foodItemId) => {
    if (!user?.userid) {
      setSnackbar({
        open: true,
        message: 'Please log in to add items to favorites',
        severity: 'warning'
      });
      return;
    }

    try {
      const isFavorite = favorites.some(fav => fav.fooditemid === foodItemId);
      const method = isFavorite ? 'DELETE' : 'POST';
      const response = await fetch(
        `http://localhost:3000/api/favorites/${user.userid}/${foodItemId}`,
        { method }
      );
      const data = await response.json();

      if (data.success) {
        setSnackbar({
          open: true,
          message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
          severity: 'success'
        });
        fetchFavorites(); // Refresh favorites list
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Error updating favorites',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setSnackbar({
        open: true,
        message: 'Error updating favorites',
        severity: 'error'
      });
    }
  };

  const handleAddToCart = async (foodItem) => {
    if (!user?.userid) {
      setSnackbar({
        open: true,
        message: 'Please log in to add items to cart',
        severity: 'warning'
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.userid,
          foodItemId: foodItem.fooditemid,
          quantity: 1
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSnackbar({
          open: true,
          message: 'Added to cart',
          severity: 'success'
        });
        if (onCartUpdate) onCartUpdate();
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Error adding to cart',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setSnackbar({
        open: true,
        message: 'Error adding to cart',
        severity: 'error'
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
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.fooditemid}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="140"
                image={item.image_url || defaultFoodImage}
                alt={item.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div">
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {item.description}
                </Typography>
                <Typography variant="h6" color="primary">
                  ${item.price.toFixed(2)}
                </Typography>
                <Typography variant="body2" color={item.stock_quantity > 5 ? "success.main" : "warning.main"}>
                  {item.stock_quantity > 0 ? `${item.stock_quantity} left in stock` : 'Out of stock'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.stock_quantity}
                >
                  Add to Cart
                </Button>
                <IconButton
                  onClick={() => toggleFavorite(item.fooditemid)}
                  color={favorites.some(fav => fav.fooditemid === item.fooditemid) ? "primary" : "default"}
                >
                  <FavoriteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

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

export default Menu; 