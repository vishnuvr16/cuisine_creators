import React, { useState, useEffect } from 'react';
import { 
  Calendar, User, MessageCircle, Clock, Flame, Users,
  LayersIcon, Heart, Share2, Twitter, Facebook, Printer,
  Star, BookmarkPlus, ThumbsUp, Timer, ChefHat, Scale,
  Utensils, Instagram
} from 'lucide-react';
import axios from 'axios';
import blog1 from "../assets/blog1.png";
import { useParams } from 'react-router-dom';
import CommentSection from '../components/Comment';
import SummaryApi from '../common';

const BlogPage = () => {
  const {id} = useParams();
  const [blogData, setBlogData] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false); 
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [rating, setRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to safely render potentially object values
  const renderValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      // If the value is an object with a name property, use that
      if (value.name) return value.name;
      // If it's an object with _id, convert to string
      if (value._id) return String(value._id);
      // For other objects, convert to string
      return JSON.stringify(value);
    }
    return String(value);
  };

  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${SummaryApi.defaultUrl}/api/blogs/${id}`);
        setBlogData(response.data);
        setIsLiked(response.data.isLiked);
        setIsBookmarked(response.data.isBookmarked);
        setRating(response.data.userRating || 0);
      } catch (err) {
        setError('Failed to load blog post');
        console.error('Error fetching blog data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogData();
  }, [id]); // Added id to dependency array

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`/api/blogs/${id}/comments`);
        setComments(response.data);
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    };

    fetchComments();
  }, [id]);

  const handleLike = async () => {
    if (likeLoading) return; // Prevent multiple clicks while loading

    try {
      setLikeLoading(true);
      const response = await fetch(`${SummaryApi.defaultUrl}/api/blogs/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ liked: !isLiked })
      });

      if (!response.ok) {
        throw new Error('Failed to update like status');
      }

      const data = await response.json();
      setIsLiked(data.isLiked);
      setLikes(data.likes);
      
      // Optimistically update the blogData state
      setBlogData(prev => ({
        ...prev,
        isLiked: data.isLiked,
        likes: data.likes
      }));
      
    } catch (err) {
      console.error('Error updating like status:', err);
      // Optionally show an error message to the user
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBookmark = async () => {
    try {
      await axios.post(`/api/blogs/${id}/bookmark`, { bookmarked: !isBookmarked });
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error('Error updating bookmark status:', err);
    }
  };

  const handleRating = async (value) => {
    try {
      await axios.post(`/api/blogs/${id}/rate`, { rating: value });
      setRating(value);
    } catch (err) {
      console.error('Error updating rating:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(`/api/blogs/${id}/comments`, {
        content: newComment
      });
      setComments([...comments, response.data]);
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = blogData?.title ? renderValue(blogData.title) : 'Delicious Recipe';
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      instagram: `https://www.instagram.com/share?url=${url}`
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const recipeInfo = [
    { icon: Timer, label: "Prep Time", value: renderValue(blogData?.prepTime) || "30 mins" },
    { icon: Flame, label: "Cook Time", value: renderValue(blogData?.cookTime) || "15 mins" },
    { icon: Users, label: "Servings", value: renderValue(blogData?.servings) || "4 people" },
    { icon: Scale, label: "Difficulty", value: renderValue(blogData?.difficulty) || "Medium" }
  ];

  return (
    <div className='pt-20'>
      <div className="bg-gray-50 min-h-screen">      
        <div className="max-w-4xl mx-auto px-4 py-8 mb-64">
          <article>
            <div className="mb-8">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-4xl font-bold text-gray-900">
                  {renderValue(blogData?.title) || "Delicious Homemade Pizza Recipe"}
                </h1>
                <div className="flex gap-2">
                  <button 
                    onClick={handleLike}
                    disabled={likeLoading}
                    className={`p-2 rounded-full transition-colors relative ${
                      isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                    } ${likeLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'}`}
                  >
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                    {/* Optional: Add likes count next to the heart */}
                    <span className="absolute -bottom-4 -right-1 text-sm font-medium">
                      {likes}
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-6 text-gray-600">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {renderValue(blogData?.date) || "October 24, 2024"}
                </span>
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {renderValue(blogData?.author) || "By Chef Sarah"}
                </span>
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {blogData?.comments.length} Comments
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <Star
                      key={index}
                      className={`w-5 h-5 cursor-pointer ${
                        index <= rating ? 'fill-current text-yellow-400' : 'text-gray-300'
                      }`}
                      onClick={() => handleRating(index)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <img 
              src={blogData?.image || blog1}
              alt={renderValue(blogData?.title) || "Recipe"}
              className="w-full h-96 object-cover rounded-lg mb-8"
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {recipeInfo.map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white p-4 rounded-lg shadow text-center hover:shadow-lg transition-shadow">
                  <Icon className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="font-semibold">{label}</p>
                  <p>{value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white p-8 rounded-lg shadow mb-8">
              <p className="mb-8">{renderValue(blogData?.description)}</p>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <LayersIcon className="w-6 h-6" />
                  Ingredients
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  {blogData?.ingredients?.map((ingredient, index) => (
                    <li key={index}>{renderValue(ingredient)}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Utensils className="w-6 h-6" />
                  Instructions
                </h2>
                <ol className="list-decimal pl-6 space-y-2">
                  {blogData?.instructions?.map((instruction, index) => (
                    <li key={index}>{renderValue(instruction)}</li>
                  ))}
                </ol>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => handleShare('facebook')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="w-4 h-4" /> Share
                </button>
                <button 
                  onClick={() => handleShare('twitter')}
                  className="flex items-center gap-2 bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500 transition-colors"
                >
                  <Twitter className="w-4 h-4" /> Tweet
                </button>
                <button 
                  onClick={() => handleShare('instagram')}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  <Instagram className="w-4 h-4" /> Reel
                </button>
              </div>
            </div>

            <CommentSection blogId={id} />

          </article>
        </div>

        <button 
          onClick={() => window.print()}
          className="fixed bottom-8 right-8 bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-gray-900 transition-colors"
        >
          <Printer className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default BlogPage;