import React, { useState,useEffect } from 'react';
import { Play, Upload, Plus, X } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {storage} from "../firebase";
import {format} from "timeago.js"
import { Link } from 'react-router-dom';
import SummaryApi from '../common';

const Videos = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videos,setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    thumbnail: 0,
    video: 0
  });
  const [isUploading, setIsUploading] = useState({
    thumbnail: false,
    video: false
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    ingredients: '',
    thumbnail: null,
    videoUrl: null
  });


  const filters = ['all', 'breakfast', 'lunch', 'dinner', 'desserts', 'vegetarian'];


//  ! file upload
    // Firebase upload function
    const handleFileUpload = async (file, type) => {
        if (!file) {
          console.log('No file selected');
          return;
        }
    
        console.log(`Starting ${type} upload:`, file.name); // Debug log
    
        try {
          setIsUploading(prev => ({ ...prev, [type]: true }));
    
          // Create storage reference
          const fileRef = ref(storage, `${type}s/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
          console.log('Storage reference created:', fileRef.fullPath); // Debug log
    
          // Create upload task
          const uploadTask = uploadBytesResumable(fileRef, file);
    
          // Monitor upload
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round(
                (snapshot.bytesTransferred * 100) / snapshot.totalBytes
              );
              console.log(`${type} upload progress:`, progress); // Debug log
              setUploadProgress(prev => ({
                ...prev,
                [type]: progress
              }));
            },
            (error) => {
              // Handle upload errors
              console.error(`${type} upload error:`, error);
              console.error('Error code:', error.code);
              console.error('Error message:', error.message);
              setError(`Error uploading ${type}: ${error.message}`);
              setIsUploading(prev => ({ ...prev, [type]: false }));
              setUploadProgress(prev => ({ ...prev, [type]: 0 }));
            },
            async () => {
              try {
                // Get download URL
                const downloadURL = await getDownloadURL(fileRef);
                console.log(`${type} upload completed. URL:`, downloadURL); // Debug log
    
                setFormData(prev => ({
                  ...prev,
                  [`${type}`]: downloadURL
                }));
              } catch (urlError) {
                console.error(`Error getting ${type} download URL:`, urlError);
                setError(`Error getting download URL for ${type}`);
              } finally {
                setIsUploading(prev => ({ ...prev, [type]: false }));
                setUploadProgress(prev => ({ ...prev, [type]: 0 }));
              }
            }
          );
        } catch (error) {
          console.error(`Error initiating ${type} upload:`, error);
          setError(`Error initiating ${type} upload`);
          setIsUploading(prev => ({ ...prev, [type]: false }));
          setUploadProgress(prev => ({ ...prev, [type]: 0 }));
        }
      };
    
    
//  ! input change
const handleInputChange = async (e) => {
    const { name, value, files } = e.target;
    
    if (files && files[0]) {
      console.log(`File selected for ${name}:`, files[0].name); // Debug log
      
      if (name === 'thumbnail') {
        if (!files[0].type.startsWith('image/')) {
          alert('Please select an image file for the thumbnail');
          return;
        }
        await handleFileUpload(files[0], 'thumbnail');
      } else if (name === 'video') {
        if (!files[0].type.startsWith('video/')) {
          alert('Please select a video file');
          return;
        }
        await handleFileUpload(files[0], 'videoUrl');
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return false;
    }
    if (!formData.description.trim()) {
      alert('Please enter a description');
      return false;
    }
    if (!formData.videoUrl) {
      alert('Please upload a video');
      return false;
    }
    if (!formData.thumbnail) {
      alert('Please upload a thumbnail');
      return false;
    }
    if (!formData.category) {
      alert('Please select a category');
      return false;
    }
    if (!formData.ingredients.trim()) {
      alert('Please enter ingredients');
      return false;
    }
    return true;
  };
  
  

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
      }
    
    try {
      // Create the payload matching your backend expectations
      const payload = {
        title: formData.title,
        description: formData.description,
        ingredients: formData.ingredients,
        videoUrl: formData.videoUrl,
        thumbnailUrl: formData.thumbnail, // Match the field name with backend
        category: formData.category
      };
  
      const response = await fetch(`${SummaryApi.defaultUrl}/api/videos`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json', // Add this header
        },
        body: JSON.stringify(payload) // Send payload directly, not wrapped in formData
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload video');
      }
  
      const data = await response.json();
      console.log('Video uploaded successfully:', data);
      setIsModalOpen(false);
      fetchVideos(); // Refresh the videos list
    } catch (error) {
      console.error('Error saving video:', error);
      alert(error.message);
    }
  };

  const UploadProgress = ({ progress, type }) => (
    <div className="mt-2">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>Uploading {type}...</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-orange-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Construct the URL with filter if not 'all'
      const url = selectedFilter === 'all' 
        ? `${SummaryApi.defaultUrl}/api/videos`
        : `${SummaryApi.defaultUrl}/api/videos?category=${selectedFilter}`;
        
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      
      // Need to parse the JSON response
      const data = await response.json();
      
      // Set videos from the parsed response
      setVideos(data?.videos || []);
    } catch (err) {
      setError('Failed to fetch videos. Please try again later.');
      console.error('Error fetching videos:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchVideos();
  }, [selectedFilter]); // Don't forget to add fetchVideos to dependencies if it's using any state/props

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header with Upload Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Curlinary Videos</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Video
        </button>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            {/* Modal Header - Same as before */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Upload New Video</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Thumbnail Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thumbnail
                    </label>
                    <div className="border-2 border-gray-200 border-dashed rounded-xl p-6 hover:border-orange-500 transition-colors">
                      {formData.thumbnail ? (
                        <div className="relative">
                          <img 
                            src={formData.thumbnail} 
                            alt="Thumbnail preview" 
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                            <Plus className="w-6 h-6 text-orange-600" />
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-medium text-orange-600">Click to upload</span>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                          </div>
                          <input
                            type="file"
                            name="thumbnail"
                            accept="image/*"
                            onChange={handleInputChange}
                            className="hidden"
                            disabled={isUploading.thumbnail}
                          />
                        </label>
                      )}
                      {isUploading.thumbnail && (
                        <UploadProgress progress={uploadProgress.thumbnail} type="thumbnail" />
                      )}
                    </div>
                  </div>

                  {/* Video Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Video File
                    </label>
                    <div className="border-2 border-gray-200 border-dashed rounded-xl p-6 hover:border-orange-500 transition-colors">
                      {formData.videoUrl ? (
                        <div className="relative">
                          <video 
                            src={formData.videoUrl} 
                            className="w-full h-32 object-cover rounded-lg" 
                            controls
                          />
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, video: '' }))}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                            <Upload className="w-6 h-6 text-orange-600" />
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-medium text-orange-600">Click to upload</span>
                            <p className="text-xs text-gray-500 mt-1">MP4, WebM up to 2GB</p>
                          </div>
                          <input
                            type="file"
                            name="video"
                            accept="video/*"
                            onChange={handleInputChange}
                            className="hidden"
                            disabled={isUploading.video}
                          />
                        </label>
                      )}
                      {isUploading.video && (
                        <UploadProgress progress={uploadProgress.video} type="video" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter video title"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter video description"
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select category</option>
                  {filters.map((filter) => (
                    <option key={filter} value={filter}>
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ingredients */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ingredients
                </label>
                <input
                  type="text"
                  name="ingredients"
                  value={formData.ingredients}
                  onChange={handleInputChange}
                  placeholder="Enter receipe ingredients"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
                
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading.thumbnail || isUploading.video}
                className={`px-4 py-2 bg-orange-600 text-white rounded-lg transition-colors ${
                  (isUploading.thumbnail || isUploading.video)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-orange-700'
                }`}
              >
                Upload Video
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Filters */}
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

      {/* Video Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No videos found for this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Link to={`/videos/${video._id}`}>
                <div key={video.id} className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow">
                <div className="group relative cursor-pointer">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 p-4 w-full">
                      <h3 className="text-white text-lg font-semibold">{video.title}</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-white text-sm">{video.description}</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-sm px-2 py-1 rounded">
                    {/* {video.} */}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{video.ingredients}</span>
                    <div className="flex items-center space-x-2">
                      <span>{video.description}</span>
                      <span>•</span>
                      <span>{format(video.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Videos;