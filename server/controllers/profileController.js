const User = require("../models/User");
const VideoRecipe = require('../models/Video');
const BlogRecipe = require('../models/Blog'); // Add this import

exports.getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .select('-password');
      
      // Calculate stats
      const videoCount = await VideoRecipe.countDocuments({ author: req.user._id });
      // You might want to add similar counts for followers, following etc.
      
      const userWithStats = {
        ...user.toObject(),
        stats: {
          videos: videoCount,
          followers: 0, // Placeholder - implement followers logic
          following: 0  // Placeholder - implement following logic
        }
      };
      
      res.json(userWithStats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.getProfileContent = async (req, res) => {
  try {
    const { contentType } = req.params;
    
    switch(contentType) {
      case 'videos':
        const videos = await VideoRecipe.find({ author: req.user._id })
          .sort('-createdAt')
          .limit(10);
        return res.json(videos);
      
      case 'blogs':
        const blogs = await BlogRecipe.find({ author: req.user._id })
          .sort('-createdAt')
          .limit(10);
        return res.json(blogs);
      
      case 'liked':
        // Implement liked content logic
        // This would depend on how you track liked content in your models
        return res.json([]);
      
      case 'saved':
        // Implement saved content logic
        // This would depend on how you track saved content in your models
        return res.json([]);
      
      default:
        return res.status(400).json({ error: 'Invalid content type' });
    }
  } catch (error) {
    console.error('Error fetching profile content:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.myVideos = async(req,res) =>{
  try {
    const { page = 1, limit = 10, search, sort = '-createdAt', category } = req.query;
    
    let query = { author: req.user._id };
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    const videos = await VideoRecipe.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('author', 'name avatar');

    const total = await VideoRecipe.countDocuments(query);

    res.json({
      videos,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error in getVideos:', error);
    res.status(500).json({ error: error.message });
  }
}
  
exports.updateProfile = async (req, res) => {
    try {
      const { name,username, bio, avatar } = req.body;
      
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { name,username, bio, avatar },
        { new: true }
      ).select('-password');
  
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
exports.getPublicProfile = async (req, res) => {
    try {
      const user = await User.findById(req.params.userId)
        .select('-password');
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const videos = await VideoRecipe.find({ author: user._id })
        .sort('-createdAt')
        .limit(5);
      
      const blogs = await BlogRecipe.find({ author: user._id })
        .sort('-createdAt')
        .limit(5);
  
      res.json({
        user,
        content: {
          videos,
          blogs
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };