const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  author: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 }
});

module.exports = mongoose.model('Post', PostSchema);
