const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const videoLikeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  video: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: [true, 'Video ID is required']
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

// Create compound index to prevent duplicate likes
videoLikeSchema.index({ user: 1, video: 1 }, { unique: true });

// Static methods
videoLikeSchema.statics = {
  // Toggle like status
  async toggleLike(userId, videoId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const Video = mongoose.model('Video');
      const like = await this.findOne({ user: userId, video: videoId });
      
      if (like) {
        // Remove like
        await like.deleteOne({ session });
        await Video.findByIdAndUpdate(
          videoId,
          { $inc: { likesCount: -1 } },
          { session }
        );
        await session.commitTransaction();
        return { isLiked: false, likesCount: await this.countDocuments({ video: videoId }) };
      } else {
        // Add like
        await this.create([{ user: userId, video: videoId }], { session });
        await Video.findByIdAndUpdate(
          videoId,
          { $inc: { likesCount: 1 } },
          { session }
        );
        await session.commitTransaction();
        return { isLiked: true, likesCount: await this.countDocuments({ video: videoId }) };
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  // Get like status and count
  async getLikeStatus(userId, videoId) {
    const [isLiked, likesCount] = await Promise.all([
      this.exists({ user: userId, video: videoId }),
      this.countDocuments({ video: videoId })
    ]);
    return { isLiked: !!isLiked, likesCount };
  }
};

const VideoLike = mongoose.model('VideoLike', videoLikeSchema);

module.exports = VideoLike;