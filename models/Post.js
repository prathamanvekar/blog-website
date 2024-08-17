import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  rawDate: Date,
  date: String
});

const Post = mongoose.model('Post', postSchema);

export default Post;
