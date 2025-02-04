const Like = require("../models/Like")

exports.post('/blogs/:id/like', isAuthenticated, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const blogId = req.params.id;
      const userId = req.user._id;
      const { liked } = req.body;
  
      const blog = await mongoose.model('Blog').findById(blogId).session(session);
      if (!blog) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'Blog post not found' });
      }
  
      if (liked) {
        // Add like
        try {
          await Like.create([{
            userId,
            blogId
          }], { session });
          
          blog.likesCount += 1;
          await blog.save({ session });
        } catch (err) {
          if (err.code === 11000) { // Duplicate key error
            await session.abortTransaction();
            return res.status(400).json({ error: 'Blog post already liked' });
          }
          throw err;
        }
      } else {
        // Remove like
        const result = await Like.deleteOne({ userId, blogId }).session(session);
        if (result.deletedCount > 0) {
          blog.likesCount = Math.max(0, blog.likesCount - 1); // Ensure we don't go below 0
          await blog.save({ session });
        }
      }
  
      await session.commitTransaction();
  
      // Return updated like status and count
      return res.json({
        isLiked: liked,
        likes: blog.likesCount
      });
  
    } catch (error) {
      await session.abortTransaction();
      console.error('Error handling like:', error);
      return res.status(500).json({ error: 'Failed to update like status' });
    } finally {
      session.endSession();
    }
  });


exports.get('/blogs/:id/like-status', isAuthenticated, async (req, res) => {
    try {
      const blogId = req.params.id;
      const userId = req.user._id;
  
      const like = await Like.findOne({ userId, blogId });
      const blog = await mongoose.model('Blog').findById(blogId);
  
      if (!blog) {
        return res.status(404).json({ error: 'Blog post not found' });
      }
  
      return res.json({
        isLiked: !!like,
        likes: blog.likesCount
      });
    } catch (error) {
      console.error('Error fetching like status:', error);
      return res.status(500).json({ error: 'Failed to fetch like status' });
    }
  });