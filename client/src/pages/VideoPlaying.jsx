import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, User, Heart, ChevronDown } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import SummaryApi from '../common';

const VideoPlaying = () => {
  const { id } = useParams();
  const [videoData, setVideoData] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [likedVideos, setLikedVideos] = useState(new Set());

  const filters = ['all', 'breakfast', 'lunch', 'dinner', 'desserts', 'vegetarian'];

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${SummaryApi.defaultUrl}/api/videos/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch video data');
        }
        
        const data = await response.json();
        setVideoData(data);
        
        const relatedResponse = await fetch(`http://localhost:8000/api/videos/${id}/related`);
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          setRelatedVideos(relatedData);
        }

        // Fetch liked status for current user
        const likedResponse = await fetch(`${SummaryApi.defaultUrl}/api/users/me/liked-videos`);
        if (likedResponse.ok) {
          const likedData = await likedResponse.json();
          setLikedVideos(new Set(likedData.map(video => video.id)));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVideoData();
    }
  }, [id]);

  const handleLike = async (videoId) => {
    try {
      const isLiked = likedVideos.has(videoId);
      const method = isLiked ? 'DELETE' : 'POST';
      
      const response = await fetch(`${SummaryApi.defaultUrl}/api/videos/${videoId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update like status');
      }

      // Update local state
      setLikedVideos(prev => {
        const newLiked = new Set(prev);
        if (isLiked) {
          newLiked.delete(videoId);
        } else {
          newLiked.add(videoId);
        }
        return newLiked;
      });

      // Update video likes count in related videos
      setRelatedVideos(prev => 
        prev.map(video => {
          if (video.id === videoId) {
            return {
              ...video,
              likes: video.likes + (isLiked ? -1 : 1)
            };
          }
          return video;
        })
      );

      // Update main video likes if it's the current video
      if (videoData && videoData.id === videoId) {
        setVideoData(prev => ({
          ...prev,
          likes: prev.likes + (isLiked ? -1 : 1)
        }));
      }
    } catch (err) {
      console.error('Error updating like status:', err);
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 flex items-center space-x-2 z-50';
      notification.innerHTML = `
        <div class="text-red-600">⨯</div>
        <div>
          <div class="font-semibold">Error</div>
          <div class="text-sm text-gray-600">Failed to update like status</div>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!videoData) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Video not found</p>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <VideoPlayer videoData={videoData} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b">
        <div className="flex items-center space-x-4 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-6 py-2 rounded-full capitalize whitespace-nowrap ${
                selectedFilter === filter
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">More Recipes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedVideos.map((video) => (
            <div key={video.id} className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow">
              <div className="relative cursor-pointer">
                <div className="group relative rounded-lg overflow-hidden shadow-lg">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 p-4 w-full">
                      <h3 className="text-white text-lg font-semibold">{video.title}</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-white text-sm">{video.views} views</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(video.id);
                          }}
                          className="flex items-center text-white text-sm hover:text-orange-500 transition-colors"
                        >
                          <Heart
                            className={`w-4 h-4 mr-1 ${
                              likedVideos.has(video.id) ? 'fill-current text-orange-500' : ''
                            }`}
                          />
                          {video.likes}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-sm px-2 py-1 rounded">
                  {video.duration}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {video.title}
                </h3>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <User className="w-6 h-6 rounded-full" />
                    <span>{video.channel}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span>{video.views} views</span>
                    <span>•</span>
                    <span>{video.uploadedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Comments ({videoData.comments?.length || 0})
          </h2>
          
          <div className="space-y-6">
            {videoData.comments?.map((comment) => (
              <div key={comment.id} className="flex space-x-4">
                <img src={comment.userAvatar || "/api/placeholder/40/40"} alt="User" className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{comment.userName}</span>
                    <span className="text-sm text-gray-500">{comment.postedAt}</span>
                  </div>
                  <p className="mt-1 text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
          
          {videoData.comments?.length > 0 && (
            <button className="mt-6 text-orange-600 hover:text-orange-700 font-medium">
              Load more comments
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlaying;