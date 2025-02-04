// controllers/commentController.js
const Comment = require('../models/Comment');
const Blog = require('../models/Blog');

// Helper to handle async errors
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

exports.addComment = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const { content } = req.body;
  const userId = req.user.id; // Assuming you have user auth middleware

  const comment = await Comment.create({
    blog: blogId,
    user: userId,
    content,
    createdAt: new Date()
  });

  // Populate user details
  const populatedComment = await Comment.findById(comment._id)
    .populate('user', 'name avatar');

  res.status(201).json(populatedComment);
});

exports.getComments = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const comments = await Comment.find({ blog: blogId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'name avatar')
    .lean();

  const total = await Comment.countDocuments({ blog: blogId });

  res.json({
    comments,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

exports.toggleLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id; // Assuming you have user auth middleware

  const comment = await Comment.findById(commentId);
  
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  const likeIndex = comment.likes.indexOf(userId);
  
  if (likeIndex === -1) {
    comment.likes.push(userId);
  } else {
    comment.likes.splice(likeIndex, 1);
  }

  await comment.save();

  res.json({ likes: comment.likes.length, isLiked: likeIndex === -1 });
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  // Check if user is comment owner
  if (comment.user.toString() !== userId) {
    return res.status(403).json({ message: 'Not authorized to delete this comment' });
  }

  await comment.remove();
  res.json({ message: 'Comment deleted successfully' });
});