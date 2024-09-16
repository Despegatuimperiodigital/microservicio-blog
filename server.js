require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Importar el modelo
const Post = require('./models/Post');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar multer para la subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads'); // Usa ruta absoluta
    cb(null, uploadPath); // Ahora usa la ruta absoluta
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Añadir timestamp al nombre del archivo
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen con formato JPG o PNG'));
    }
  }
});

// Servir archivos estáticos (imágenes) desde la carpeta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conectado a MongoDB');
}).catch(err => {
  console.error('Error al conectar a MongoDB:', err);
});

// Rutas

// Obtener todos los posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Obtener un post por ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id); // Buscar post por ID
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear un nuevo post con imagen
app.post('/api/posts', upload.single('image'), async (req, res) => {
  // Obtener la URL de la imagen
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    author: req.body.author,
    category: req.body.category,
    image: imageUrl,
    likes: req.body.likes || 0,
    comments: req.body.comments || 0
  });

  try {
    const newPost = await post.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Actualizar un post por ID
app.put('/api/posts/:id', upload.single('image'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' });
    }

    // Actualizar los campos del post
    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;
    post.author = req.body.author || post.author;
    post.category = req.body.category || post.category;
    post.likes = req.body.likes || post.likes;
    post.comments = req.body.comments || post.comments;

    // Si se sube una nueva imagen
    if (req.file) {
      post.image = `/uploads/${req.file.filename}`;
    }

    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Eliminar un post por ID
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' });
    }

    await post.remove();
    res.json({ message: 'Post eliminado con éxito' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Escuchar en el puerto 4010
const PORT = process.env.PORT || 4010;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
