const mongoose = require('mongoose');
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  photo: {
    type: String,
  },
  date: {
    type: Date,
  },
});
const Blog = mongoose.model('blog', blogSchema);
module.exports = Blog;