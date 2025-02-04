const BlogRecipe = require('../models/Blog');

exports.getBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sort = '-createdAt' } = req.query;
    
    const query = search 
      ? { title: { $regex: search, $options: 'i' } }
      : {};

    const blogs = await BlogRecipe.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('author', 'name avatar');

    const total = await BlogRecipe.countDocuments(query);

    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// In blogController.js
exports.createBlog = async (req, res) => {
  try {
    // The ingredients and instructions will now be arrays
    const { title, description, ingredients, instructions, ...otherData } = req.body;
    
    // Validate that ingredients and instructions are arrays
    if (!Array.isArray(ingredients) || !Array.isArray(instructions)) {
      return res.status(400).json({ 
        error: 'Ingredients and instructions must be arrays' 
      });
    }

    const blog = new BlogRecipe({
      title,
      description,
      ingredients,  // Already an array, no need to parse
      instructions, // Already an array, no need to parse
      ...otherData,
      author: req.user._id  // Assuming you're using auth middleware
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    console.error('Blog creation error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBlog = async (req, res) => {
  try {
    const blog = await BlogRecipe.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('comments.user', 'name avatar');

    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      ingredients, 
      cookingSteps, 
      duration, 
      content, 
      coverImage 
    } = req.body;

    // Find blog and check ownership
    const blog = await BlogRecipe.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Check if the user is the author
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this blog post' });
    }

    // Update the blog post
    const updatedBlog = await BlogRecipe.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        ingredients,
        cookingSteps,
        duration,
        content,
        coverImage
      },
      { new: true } // Return the updated document
    ).populate('author', 'name avatar');

    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    // Find blog and check ownership
    const blog = await BlogRecipe.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Check if the user is the author
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this blog post' });
    }

    // Delete the blog post
    await BlogRecipe.findByIdAndDelete(req.params.id);

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};