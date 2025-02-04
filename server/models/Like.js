const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Like Schema
const likeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  blog: {
    type: Schema.Types.ObjectId,
    ref: 'Blog',
    required: [true, 'Blog ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Create compound index for user and blog to prevent duplicate likes
likeSchema.index({ user: 1, blog: 1 }, { unique: true });

// Add any necessary instance methods
likeSchema.methods = {
  // Example method to check if like exists
  exists: function() {
    return !!this._id;
  }
};

// Add any necessary static methods
likeSchema.statics = {
  // Find likes by blog ID
  findByBlog: function(blogId) {
    return this.find({ blog: blogId }).populate('user', 'name email');
  },

  // Find likes by user ID
  findByUser: function(userId) {
    return this.find({ user: userId }).populate('blog', 'title');
  },

  // Toggle like
  async toggleLike(userId, blogId) {
    const like = await this.findOne({ user: userId, blog: blogId });
    if (like) {
      await like.remove();
      return { isLiked: false, like: null };
    } else {
      const newLike = await this.create({ user: userId, blog: blogId });
      return { isLiked: true, like: newLike };
    }
  },

  // Get like count for a blog
  getLikeCount: function(blogId) {
    return this.countDocuments({ blog: blogId });
  }
};

// Middleware to handle blog like count updates
likeSchema.post('save', async function(doc) {
  const Blog = mongoose.model('Blog');
  const likeCount = await this.constructor.getLikeCount(doc.blog);
  await Blog.findByIdAndUpdate(doc.blog, { $set: { likeCount: likeCount } });
});

likeSchema.post('remove', async function(doc) {
  const Blog = mongoose.model('Blog');
  const likeCount = await this.constructor.getLikeCount(doc.blog);
  await Blog.findByIdAndUpdate(doc.blog, { $set: { likeCount: likeCount } });
});

// Create the model
const Like = mongoose.model('Like', likeSchema);

module.exports = Like;