import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Grid,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Skeleton,
  Zoom,
  Tooltip,
  useTheme,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Search,
  Add,
  ShoppingCart,
  Favorite,
  FavoriteBorder,
  AttachMoney,
  Clear,
} from '@mui/icons-material';

// Simple data URL for a gray image with text
const fallbackImageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' text-anchor='middle' dominant-baseline='middle' fill='%23757575'%3ENo Image%3C/text%3E%3C/svg%3E";

// CSS for consistent image styling
const imageStyles = {
  objectFit: 'cover',
  width: '100%',
  height: '200px',
  display: 'block',
};

function Menu() {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    fetchMenu();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchMenu = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/menu');
      const data = await response.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/favorites/${user.userid}`);
      const data = await response.json();
      
      if (data.success) {
        // Create an array of just the fooditemid values
        const favoriteIds = data.items.map(item => item.fooditemid);
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleAddToCart = async (item) => {
    if (!user) {
      setSnackbar({
        open: true,
        message: 'Please login to add items to cart',
        severity: 'error',
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
          foodItemId: item.fooditemid,
          quantity: 1,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbar({
          open: true,
          message: 'Item added to cart!',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Failed to add item to cart',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setSnackbar({
        open: true,
        message: 'Error adding item to cart',
        severity: 'error',
      });
    }
  };

  const handleToggleFavorite = async (itemId) => {
    if (!user) {
      setSnackbar({
        open: true,
        message: 'Please login to add favorites',
        severity: 'error',
      });
      return;
    }
    
    try {
      const isFavorite = favorites.includes(itemId);
      const url = `http://localhost:3000/api/favorites/${user.userid}/${itemId}`;
      const method = isFavorite ? 'DELETE' : 'POST';
      
      const response = await fetch(url, { method });
      const data = await response.json();
      
      if (data.success) {
        if (isFavorite) {
          setFavorites(favorites.filter(id => id !== itemId));
          setSnackbar({
            open: true,
            message: 'Removed from favorites',
            severity: 'success',
          });
        } else {
          setFavorites([...favorites, itemId]);
          setSnackbar({
            open: true,
            message: 'Added to favorites',
            severity: 'success',
          });
        }
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      setSnackbar({
        open: true,
        message: 'Error updating favorites',
        severity: 'error',
      });
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Filter items based on search query and selected category
  const filteredItems = items.filter((item) => {
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === '' || item.categoryid === parseInt(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Group items by category for display
  const groupedItems = {};
  filteredItems.forEach((item) => {
    const categoryName = item.category_name || 'Uncategorized';
    if (!groupedItems[categoryName]) {
      groupedItems[categoryName] = [];
    }
    groupedItems[categoryName].push(item);
  });

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
          Our Menu
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, maxWidth: 600 }}>
          Explore our wide range of delicious items prepared with the finest ingredients.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search menu..."
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery('')} edge="end" size="small">
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'white',
                  },
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <Select
                displayEmpty
                value={selectedCategory}
                onChange={handleCategoryChange}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'white',
                  },
                }}
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.categoryid} value={category.categoryid}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {(searchQuery || selectedCategory) && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="text" 
              onClick={clearFilters}
              size="small"
              sx={{ color: 'white', textTransform: 'none' }}
            >
              Clear Filters
            </Button>
          </Box>
        )}
      </Paper>

      {loading ? (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={32} width="70%" />
                  <Skeleton variant="text" height={20} width="40%" />
                  <Skeleton variant="text" height={20} width="90%" />
                </CardContent>
                <CardActions>
                  <Skeleton variant="rectangular" height={36} width={120} />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No items found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </Box>
      ) : (
        <Box>
          {selectedCategory === '' ? (
            // Display grouped by category when no category filter is applied
            Object.keys(groupedItems).map((categoryName) => (
              <Box key={categoryName} sx={{ mb: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                      fontWeight: 600,
                      position: 'relative',
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -4,
                        left: 0,
                        width: 40,
                        height: 4,
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: 2,
                      }
                    }}
                  >
                    {categoryName}
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  {groupedItems[categoryName].map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.fooditemid}>
                      <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            overflow: 'visible',
                          }}
                        >
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
                          
                          <Box 
                            sx={{ 
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              zIndex: 1,
                            }}
                          >
                            <Tooltip title={favorites.includes(item.fooditemid) ? "Remove from favorites" : "Add to favorites"}>
                              <IconButton 
                                onClick={() => handleToggleFavorite(item.fooditemid)}
                                sx={{ 
                                  bgcolor: 'rgba(255,255,255,0.8)',
                                  '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.95)',
                                  }
                                }}
                              >
                                {favorites.includes(item.fooditemid) ? 
                                  <Favorite color="error" /> : 
                                  <FavoriteBorder />
                                }
                              </IconButton>
                            </Tooltip>
                          </Box>
                          
                          <Box 
                            sx={{ 
                              position: 'absolute',
                              top: 12,
                              left: 12,
                              zIndex: 1,
                            }}
                          >
                            <Chip 
                              label={`₹${parseFloat(item.price).toFixed(2)}`}
                              color="primary"
                              icon={<AttachMoney fontSize="small" />}
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                          
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="h3" gutterBottom>
                              {item.name}
                            </Typography>
                            {item.description && (
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ 
                                  mb: 2,
                                  display: '-webkit-box',
                                  overflow: 'hidden',
                                  WebkitBoxOrient: 'vertical',
                                  WebkitLineClamp: 2,
                                }}
                              >
                                {item.description}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Chip 
                                label={`Stock: ${item.stock_quantity}`}
                                size="small"
                                color={item.stock_quantity > 5 ? "success" : "warning"}
                                variant="outlined"
                              />
                            </Box>
                          </CardContent>
                          
                          <Divider />
                          
                          <CardActions sx={{ padding: 2 }}>
                            <Button
                              variant="contained"
                              startIcon={<ShoppingCart />}
                              onClick={() => handleAddToCart(item)}
                              fullWidth
                              disabled={item.stock_quantity < 1}
                            >
                              {item.stock_quantity < 1 ? 'Out of Stock' : 'Add to Cart'}
                            </Button>
                          </CardActions>
                        </Card>
                      </Zoom>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))
          ) : (
            // Display flat list when category filter is applied
            <Grid container spacing={3}>
              {filteredItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.fooditemid}>
                  <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'visible',
                      }}
                    >
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
                      
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 1,
                        }}
                      >
                        <Tooltip title={favorites.includes(item.fooditemid) ? "Remove from favorites" : "Add to favorites"}>
                          <IconButton 
                            onClick={() => handleToggleFavorite(item.fooditemid)}
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.8)',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.95)',
                              }
                            }}
                          >
                            {favorites.includes(item.fooditemid) ? 
                              <Favorite color="error" /> : 
                              <FavoriteBorder />
                            }
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          zIndex: 1,
                        }}
                      >
                        <Chip 
                          label={`₹${parseFloat(item.price).toFixed(2)}`}
                          color="primary"
                          icon={<AttachMoney fontSize="small" />}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                      
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {item.name}
                        </Typography>
                        {item.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              mb: 2,
                              display: '-webkit-box',
                              overflow: 'hidden',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 2,
                            }}
                          >
                            {item.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip 
                            label={`Stock: ${item.stock_quantity}`}
                            size="small"
                            color={item.stock_quantity > 5 ? "success" : "warning"}
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                      
                      <Divider />
                      
                      <CardActions sx={{ padding: 2 }}>
                        <Button
                          variant="contained"
                          startIcon={<ShoppingCart />}
                          onClick={() => handleAddToCart(item)}
                          fullWidth
                          disabled={item.stock_quantity < 1}
                        >
                          {item.stock_quantity < 1 ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                      </CardActions>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Menu;
