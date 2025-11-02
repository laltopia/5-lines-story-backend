const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET - Buscar todos os usuarios
router.get('/', async (req, res) => {
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
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST - Criar novo usuario
router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and email are required' 
      });
    }
    
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
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET - Buscar usuario por ID
router.get('/:id', async (req, res) => {
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
    res.status(404).json({ 
      success: false, 
      error: 'User not found' 
    });
  }
});

module.exports = router;
