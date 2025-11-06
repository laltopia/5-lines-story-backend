const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { requireAuthentication } = require('../middleware/auth');
const { validate, userSchemas } = require('../utils/validation');

// GET - Buscar todos os usuarios (PROTECTED)
router.get('/', requireAuthentication, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      count: data.length,
      users: data
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users. Please try again later.'
    });
  }
});

// POST - Criar novo usuario (PROTECTED + VALIDATED)
router.post('/', requireAuthentication, validate(userSchemas.create), async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email }])
      .select();
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'User created successfully!',
      user: data[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user. Please try again later.'
    });
  }
});

// GET - Buscar usuario por ID (PROTECTED)
router.get('/:id', requireAuthentication, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      user: data
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
});

module.exports = router;
