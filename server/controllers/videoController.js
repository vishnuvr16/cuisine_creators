// controllers/videoController.js
const VideoRecipe = require('../models/Video');

// Get all videos with pagination, search, and sorting
// exports.getVideos = async (req, res) => {
//   console.log("entering")
//   try {
//     const { page = 1, limit = 10, search, sort = '-createdAt' } = req.query;
    
//     // Build search query if search parameter exists
//     const query = search 
//       ? { title: { $regex: search, $options: 'i' } }
//       : {};

//     // Fetch videos with pagination
//     const videos = await VideoRecipe.find(query)
//       .sort(sort)  // Sort by creation date by default
//       .limit(limit * 1)  // Convert limit to number
//       .skip((page - 1) * limit)  // Skip previous pages
//       .populate('author', 'name avatar');  // Include author details

//     // Get total count for pagination
//     const total = await VideoRecipe.countDocuments(query);

//     res.json({
//       videos,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.getVideos = async (req, res) => {
  console.log("entering")
  try {
    const { page = 1, limit = 10, search, sort = '-createdAt', category } = req.query;
    
    // Build query object
    let query = {};
    
    // Add search filter if exists
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    // Add category filter if exists and is not 'all'
    if (category && category !== 'all') {
      query.category = category;
    }

    console.log('Query:', query); // Debug log

    // Fetch videos with pagination and filters
    const videos = await VideoRecipe.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('author', 'name avatar');

    // Get total count for pagination
    const total = await VideoRecipe.countDocuments(query);

    res.json({
      videos,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error in getVideos:', error); // Debug log
    res.status(500).json({ error: error.message });
  }
};

// Upload new video
exports.uploadVideo = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      ingredients,
      category, 
      videoUrl, 
      thumbnailUrl 
    } = req.body;

    // Validate required fields
    if (!title || !description || !videoUrl) {
      return res.status(400).json({ 
        error: 'Title, description, and video URL are required' 
      });
    }

    // Convert ingredients string to array of objects
    const ingredientsArray = ingredients.split(',').map(ingredient => ({
      name: ingredient.trim(),
      quantity: '',
      unit: ''
    }));

    // Create new video recipe
    const video = await VideoRecipe.create({
      title,
      description,
      category,
      ingredients: ingredientsArray,
      videoUrl,
      thumbnail: thumbnailUrl,
      author: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      video
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Error uploading video'
    });
  }
};

// Get single video by ID
exports.getVideo = async (req, res) => {
  try {
    const video = await VideoRecipe.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('comments.user', 'name avatar')
      .populate('likes', 'name avatar');

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update video
exports.updateVideo = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      ingredients, 
      cookingSteps, 
      duration, 
      thumbnail 
    } = req.body;

    const video = await VideoRecipe.findById(req.params.id);

    // Check if video exists
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if user is the author
    if (video.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this video' });
    }

    // Update video
    const updatedVideo = await VideoRecipe.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        ingredients,
        cookingSteps,
        duration,
        thumbnail
      },
      { new: true }  // Return updated document
    ).populate('author', 'name avatar');

    res.json(updatedVideo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const video = await VideoRecipe.findById(req.params.id);

    // Check if video exists
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if user is the author
    if (video.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this video' });
    }

    await video.remove();
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.handleInteraction = async (video, userId, action, oppositeAction) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Remove user from opposite list if present
    if (video[oppositeAction].includes(userId)) {
      video[oppositeAction] = video[oppositeAction].filter(id => !id.equals(userId));
      video[`${oppositeAction}Count`]--;
    }

    // Toggle user in current action list
    const userIndex = video[action].findIndex(id => id.equals(userId));
    
    if (userIndex === -1) {
      // Add like/dislike
      video[action].push(userId);
      video[`${action}Count`]++;
    } else {
      // Remove like/dislike
      video[action].splice(userIndex, 1);
      video[`${action}Count`]--;
    }

    await video.save({ session });
    await session.commitTransaction();
    
    return {
      message: `Video ${action} updated successfully`,
      likesCount: video.likesCount,
      dislikesCount: video.dislikesCount,
      isLiked: video.likes.includes(userId),
      isDisliked: video.dislikes.includes(userId)
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};


// Like/Unlike video
exports.addLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const video = await VideoRecipe.findById(req.params.id);

    if (video.dislikes.includes(userId)) {
      await VideoRecipe.findByIdAndUpdate(req.params.id, {
        $pull: { dislikes: userId }
      });
    }

    // Example MongoDB update
    const result = await VideoRecipe.findByIdAndUpdate(
      id,
      { 
        $addToSet: { likes: userId } // Add userId to likes array if not already present
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error in like video endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.addDislike = async (req, res) => {
  try {
    const video = await VideoRecipe.findById(req.params.id);
    const userId = req.user.id;

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // If video is already disliked, remove dislike
    if (video.dislikes.includes(userId)) {
      await VideoRecipe.findByIdAndUpdate(req.params.id, {
        $pull: { dislikes: userId }
      });
      return res.status(200).json({ message: 'Video undisliked' });
    }

    // Remove from likes if present
    if (video.likes.includes(userId)) {
      await VideoRecipe.findByIdAndUpdate(req.params.id, {
        $pull: { likes: userId }
      });
    }

    // Add dislike
    await VideoRecipe.findByIdAndUpdate(req.params.id, {
      $addToSet: { dislikes: userId }
    });

    res.status(200).json({ message: 'Video disliked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

exports.addView = async (req, res) => {
  try {
    const video = await VideoRecipe.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Increment views count
    await VideoRecipe.findByIdAndUpdate(req.params.id, {
      $inc: { views: 1 }
    });

    res.status(200).json({ message: 'View count updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const video = await VideoRecipe.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    video.comments.push({
      user: req.user._id,
      text
    });

    await video.save();

    // Populate the newly added comment's user details
    const populatedVideo = await VideoRecipe.findById(video._id)
      .populate('comments.user', 'name avatar');

    res.json(populatedVideo.comments[populatedVideo.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const video = await VideoRecipe.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Find comment
    const comment = video.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is authorized to delete comment
    if (comment.user.toString() !== req.user._id.toString() && 
        video.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    comment.remove();
    await video.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};