const express = require('express');
const { registerUser, loginUser, logoutUser } = require('../controllers/authController');
const { uploadVideo, getVideo, updateVideo, deleteVideo, getVideos, addLike, addDislike, addView } = require('../controllers/videoController');
const { getBlogs, createBlog, getBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const { getProfile, updateProfile, myVideos, getProfileContent } = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { 
    addComment, 
    getComments, 
    toggleLike, 
    deleteComment 
} = require('../controllers/CommentController');
const aiModel = require('../models/AI');
const { generateRecipe } = require('../controllers/aiKitchenController');
const router = express.Router();

// Auth routes
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.post('/auth/logout', logoutUser);
// router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// router.get('/auth/google/callback', passport.authenticate('google'), handleGoogleCallback);

// Video routes
router.get('/videos', getVideos);
router.post('/videos', authenticateToken, uploadVideo);
router.get('/videos/:id', getVideo);
router.put('/videos/:id', authenticateToken, updateVideo);
router.delete('/videos/:id', authenticateToken, deleteVideo);
router.put('/videos/:id/like', authenticateToken, addLike);
router.put('/videos/:id/dislike', authenticateToken, addDislike);
router.put('/videos/:id/view',authenticateToken,addView);

// Blog routes
router.get('/blogs', getBlogs);
router.post('/blogs', authenticateToken, createBlog);
router.get('/blogs/:id', getBlog);
router.put('/blogs/:id', authenticateToken, updateBlog);
router.delete('/blogs/:id', authenticateToken, deleteBlog);

// Blog comment routes
router.get('/blogs/:blogId/comments', getComments);
router.post('/blogs/:blogId/comments', authenticateToken, addComment);
router.delete('/comments/:commentId', authenticateToken, deleteComment);
router.post('/comments/:commentId/like', authenticateToken, toggleLike);

// AI Kitchen routes
router.post('/generate-recipe',authenticateToken, generateRecipe);

// User profile routes

// In your routes file
router.get('/profile', authenticateToken, getProfile);
router.get('/profile/content/:contentType', authenticateToken, getProfileContent);
router.get('/profile/videos', authenticateToken, myVideos);
router.put('/profile', authenticateToken, updateProfile);
router.put('/profile/update', authenticateToken, updateProfile);

module.exports = router;