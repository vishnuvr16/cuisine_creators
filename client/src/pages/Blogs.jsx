import React, { useState, useEffect } from 'react';
import { Clock, Heart, MessageSquare, Share2, User, ChevronRight } from 'lucide-react';
import blog1 from "../assets/blog1.png";
import { Link } from 'react-router-dom';
import SummaryApi from '../common';

const Blogs = () => {
  const categories = ['All', 'Tips & Tricks', 'Recipes', 'Cooking Guides', 'Kitchen Hacks', 'Restaurant Reviews'];
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBlogs = async (pageNum = 1, category = selectedCategory) => {
    try {
      setLoading(true);
      const url = new URL(`${SummaryApi.defaultUrl}/api/blogs`);
      url.searchParams.append('page', pageNum);
      url.searchParams.append('limit', 6);
      if (category !== 'All') {
        url.searchParams.append('category', category);
      }

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch blogs');
      }

      const data = await response.json();
      
      if (pageNum === 1) {
        setBlogs(data.blogs);
      } else {
        setBlogs(prev => [...prev, ...data.blogs]);
      }
      
      setHasMore(data.blogs.length === 6); // Assuming backend sends 6 items per page
      setError(null);
    } catch (err) {
      setError('Failed to load blogs. Please try again later.');
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchBlogs(1, selectedCategory);
  }, [selectedCategory]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBlogs(nextPage, selectedCategory);
  };

  const formatDate = (dateString) => {
    const days = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">My Blogs</h1>
            <Link to="create" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              Create Blog
            </Link>
          </div>
          <p className="mt-2 text-gray-600">Discover cooking tips, tricks, and stories from our community</p>
          
          {/* Categories */}
          <div className="mt-6 flex items-center space-x-4 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-6 py-2 rounded-full transition-colors whitespace-nowrap ${
                  selectedCategory === category 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Post - Kept Static */}
      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg overflow-hidden shadow-lg">
          <div className="md:flex">
            <div className="md:w-1/2">
              <img src={blog1} alt="Featured" className="w-full h-80 object-cover" />
            </div>
            <div className="md:w-1/2 p-8">
              <div className="flex items-center space-x-2 text-sm text-orange-600">
                <span>Featured</span>
                <span>•</span>
                <span>Cooking Guide</span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                The Art of French Cooking: A Comprehensive Guide
              </h2>
              <p className="mt-4 text-gray-600 line-clamp-3">
                Discover the secrets of French cuisine, from basic techniques to advanced recipes that will transform your cooking skills...
              </p>
              
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <User alt="Author" className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-medium text-gray-900">Julia Chen</p>
                    <p className="text-sm text-gray-500">Master Chef</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  10 min read
                </div>
              </div>
              
              <Link to="id" className="mt-6 flex items-center text-orange-600 hover:text-orange-700 font-medium">
                Read More <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div> */}

      {/* Blog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="text-red-600 text-center mb-8">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <Link to={`/blogs/${blog._id}`}>
              <div key={blog._id} className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow">
              <img 
                src={blog.image || "/api/placeholder/400/250"} 
                alt={blog.title} 
                className="w-full h-48 object-cover" 
              />
              
              <div className="p-6">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-orange-600">{blog.category}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500">{formatDate(blog.createdAt)}</span>
                </div>
                
                <h3 className="mt-2 text-xl font-bold text-gray-900">
                  {blog.title}
                </h3>
                
                <p className="mt-3 text-gray-600 line-clamp-3">
                  {blog.description}
                </p>
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-gray-500">
                    <button className="flex items-center space-x-1 hover:text-gray-700">
                      <Heart className="w-5 h-5" />
                      <span>{blog.likes?.length || 0}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-gray-700">
                      <MessageSquare className="w-5 h-5" />
                      <span>{blog.comments?.length || 0}</span>
                    </button>
                    <button className="hover:text-gray-700">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {blog.readTime || '5'} min read
                  </div>
                </div>
              </div>
            </div>
            </Link>
          ))}
        </div>
        
        {loading && (
          <div className="text-center mt-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent"></div>
          </div>
        )}
        
        {!loading && hasMore && (
          <div className="mt-8 text-center">
            <button 
              onClick={handleLoadMore}
              className="bg-orange-600 text-white px-8 py-3 rounded-full hover:bg-orange-700 transition-colors"
            >
              Load More Articles
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blogs;