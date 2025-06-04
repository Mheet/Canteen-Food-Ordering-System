import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Input,
  FormLabel,
  CircularProgress,
  Tab,
  Tabs,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Image as ImageIcon, Link as LinkIcon, Upload as UploadIcon } from '@mui/icons-material';

// Simple data URL for a gray image with text
const fallbackImageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='140' viewBox='0 0 300 140'%3E%3Crect width='300' height='140' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' text-anchor='middle' dominant-baseline='middle' fill='%23757575'%3ENo Image%3C/text%3E%3C/svg%3E";

// CSS for consistent image styling
const imageStyles = {
  objectFit: 'cover',
  width: '100%',
  height: '200px',
  display: 'block',
};

const previewImageStyles = {
  maxWidth: '100%',
  height: '200px',
  objectFit: 'cover',
  margin: '0 auto',
};

const FoodItems = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    availability: true,
    stock_quantity: '',
    categoryid: '',
    image_url: '',
    delete_image: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageInputTab, setImageInputTab] = useState(0);

  useEffect(() => {
    fetchFoodItems();
    fetchCategories();
  }, []);

  const fetchFoodItems = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/food-items');
      const data = await response.json();
      if (data.success) {
        setFoodItems(data.foodItems);
      }
    } catch (error) {
      console.error('Error fetching food items:', error);
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

  const handleOpen = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        availability: Boolean(item.availability),
        stock_quantity: item.stock_quantity.toString(),
        categoryid: item.categoryid || '',
        image_url: item.image_url || '',
        delete_image: false,
      });
      setPreviewUrl(item.image_url || '');
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        availability: true,
        stock_quantity: '',
        categoryid: '',
        image_url: '',
        delete_image: false,
      });
      setPreviewUrl('');
    }
    setSelectedFile(null);
    setImageInputTab(0);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      availability: true,
      stock_quantity: '',
      categoryid: '',
      image_url: '',
      delete_image: false,
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setImageInputTab(0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size too large. Maximum size is 10MB.');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, GIF)');
        return;
      }
      
      setSelectedFile(file);
      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData({ ...formData, image_url: url });
    setPreviewUrl(url);
  };

  const handleImageTabChange = (event, newValue) => {
    setImageInputTab(newValue);
    // Clear preview if switching tabs
    if (newValue === 0) {
      setFormData({ ...formData, image_url: '' });
      if (!selectedFile) setPreviewUrl('');
    } else {
      setSelectedFile(null);
      setPreviewUrl(formData.image_url);
    }
  };

  const handleClearImage = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setFormData({
      ...formData,
      image_url: "",
      delete_image: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const url = editingItem
        ? `http://localhost:3000/api/food-items/${editingItem.fooditemid}`
        : 'http://localhost:3000/api/food-items';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      // Create a FormData object for the multipart/form-data request
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('name', formData.name);
      formDataToSubmit.append('description', formData.description);
      formDataToSubmit.append('price', formData.price);
      formDataToSubmit.append('availability', Boolean(formData.availability));
      formDataToSubmit.append('stock_quantity', formData.stock_quantity);
      formDataToSubmit.append('categoryid', formData.categoryid);
      
      // Add the file if selected or use image URL
      if (selectedFile) {
        formDataToSubmit.append('image', selectedFile);
      } else if (formData.image_url) {
        formDataToSubmit.append('image_url', formData.image_url);
      }
      
      // If editing and there's an existing image but no new file/url
      if (editingItem && previewUrl && !selectedFile && !formData.image_url) {
        formDataToSubmit.append('current_image_url', previewUrl);
      }
      
      // Add delete_image flag if present
      if (formData.delete_image) {
        formDataToSubmit.append('delete_image', true);
      }
      
      const response = await fetch(url, {
        method,
        body: formDataToSubmit, // Don't set Content-Type header when using FormData
      });

      const data = await response.json();
      if (data.success) {
        fetchFoodItems();
        handleClose();
      }
    } catch (error) {
      console.error('Error saving food item:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this food item?')) {
      try {
        const response = await fetch(`http://localhost:3000/api/food-items/${itemId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          fetchFoodItems();
        }
      } catch (error) {
        console.error('Error deleting food item:', error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Food Items</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Food Item
        </Button>
      </Box>

      <Grid container spacing={3}>
        {foodItems.map((item) => (
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
                <Typography variant="h6" component="div">
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" color="primary">
                    ₹{parseFloat(item.price).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color={item.availability ? 'success.main' : 'error.main'}>
                    {item.availability ? 'Available' : 'Unavailable'}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  Stock: {item.stock_quantity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Category: {item.category_name || 'None'}
                </Typography>
              </CardContent>
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton onClick={() => handleOpen(item)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(item.fooditemid)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Food Item' : 'Add Food Item'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Food Item Name"
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  margin="dense"
                  label="Price"
                  type="number"
                  fullWidth
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  margin="dense"
                  label="Stock Quantity"
                  type="number"
                  fullWidth
                  required
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
            </Grid>
            <FormControl fullWidth margin="dense">
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.categoryid}
                label="Category"
                onChange={(e) => setFormData({ ...formData, categoryid: e.target.value })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.categoryid} value={category.categoryid}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(formData.availability)}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.checked })}
                />
              }
              label="Available"
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <FormLabel>Food Item Image</FormLabel>
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={imageInputTab} onChange={handleImageTabChange}>
                  <Tab icon={<ImageIcon />} label="Upload" />
                  <Tab icon={<LinkIcon />} label="URL" />
                </Tabs>
              </Box>
              
              {imageInputTab === 0 ? (
                <Box sx={{ mt: 2 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="item-image-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="item-image-upload">
                    <Button 
                      variant="contained" 
                      component="span"
                      startIcon={<UploadIcon />}
                      sx={{ mr: 1 }}
                    >
                      Select Image
                    </Button>
                    {previewUrl && (
                      <Button 
                        variant="outlined" 
                        color="error"
                        onClick={handleClearImage}
                        startIcon={<DeleteIcon />}
                      >
                        Remove Image
                      </Button>
                    )}
                  </label>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Maximum file size: 10MB. Supported formats: JPG, PNG, GIF
                  </Typography>
                </Box>
              ) : (
                <TextField
                  margin="dense"
                  label="Image URL"
                  type="url"
                  fullWidth
                  value={formData.image_url}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/image.jpg"
                />
              )}
              
              {previewUrl && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="subtitle2" gutterBottom>Image Preview</Typography>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      marginBottom: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = fallbackImageUrl;
                    }}
                  />
                </Box>
              )}
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={uploading}
            >
              {uploading ? <CircularProgress size={24} /> : 
                editingItem ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default FoodItems;
