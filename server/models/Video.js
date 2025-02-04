const mongoose = require('mongoose');

const videoRecipeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    ingredients: {type: String, require: true},
    cookingSteps: [{
      step: Number,
      description: String,
      duration: Number
    }],
    category: {type : String,required:true},
    duration: { type: Number },
    videoUrl: { type: String, required: true },
    thumbnail: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    likesCount: {
      type: Number,
      default: 0
    },
    dislikesCount: {
      type: Number,
      default: 0
    },
    comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
  });

  const videoModel = mongoose.model("Video",videoRecipeSchema);

  module.exports = videoModel;