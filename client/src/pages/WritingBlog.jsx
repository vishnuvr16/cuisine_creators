import React, { useState } from 'react';
import { ChefHat, Clock, Users, Scale, Plus, Trash } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useNavigate } from 'react-router-dom';
import SummaryApi from '../common';

const WriteBlogPage = () => {
  const [blogData, setBlogData] = useState({
    title: '',
    description: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    difficulty: 'Easy',
    ingredients: [''],
    instructions: [''],
    image: null,
  });
  const [isUploading, setIsUploading] = useState({ image: false });
  const [uploadProgress, setUploadProgress] = useState({ image: 0 });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBlogData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = async (file, type) => {
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log(`Starting ${type} upload:`, file.name); // Debug log

    try {
      setIsUploading((prev) => ({ ...prev, [type]: true }));

      // Create storage reference
      const fileRef = ref(storage, `${type}s/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
      console.log('Storage reference created:', fileRef.fullPath); // Debug log

      // Create upload task
      const uploadTask = uploadBytesResumable(fileRef, file);

      // Monitor upload
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred * 100) / snapshot.totalBytes);
          console.log(`${type} upload progress:`, progress); // Debug log
          setUploadProgress((prev) => ({
            ...prev,
            [type]: progress,
          }));
        },
        (error) => {
          // Handle upload errors
          console.error(`${type} upload error:`, error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          setError(`Error uploading ${type}: ${error.message}`);
          setIsUploading((prev) => ({ ...prev, [type]: false }));
          setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(fileRef);
            console.log(`${type} upload completed. URL:`, downloadURL); // Debug log

            setBlogData((prev) => ({
              ...prev,
              image: downloadURL,
            }));
          } catch (urlError) {
            console.error(`Error getting ${type} download URL:`, urlError);
            setError(`Error getting download URL for ${type}`);
          } finally {
            setIsUploading((prev) => ({ ...prev, [type]: false }));
            setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
          }
        }
      );
    } catch (error) {
      console.error(`Error initiating ${type} upload:`, error);
      setError(`Error initiating ${type} upload`);
      setIsUploading((prev) => ({ ...prev, [type]: false }));
      setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file, 'image');
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...blogData.ingredients];
    newIngredients[index] = value;
    setBlogData((prev) => ({
      ...prev,
      ingredients: newIngredients,
    }));
  };

  const handleInstructionChange = (index, value) => {
    const newInstructions = [...blogData.instructions];
    newInstructions[index] = value;
    setBlogData((prev) => ({
      ...prev,
      instructions: newInstructions,
    }));
  };

  const addIngredient = () => {
    setBlogData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ''],
    }));
  };

  const addInstruction = () => {
    setBlogData((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ''],
    }));
  };

  const removeIngredient = (index) => {
    const newIngredients = blogData.ingredients.filter((_, i) => i !== index);
    setBlogData((prev) => ({
      ...prev,
      ingredients: newIngredients,
    }));
  };

  const removeInstruction = (index) => {
    const newInstructions = blogData.instructions.filter((_, i) => i !== index);
    setBlogData((prev) => ({
      ...prev,
      instructions: newInstructions,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
      const cleanedBlogData = {
        ...blogData,
        // Filter out any empty ingredients and instructions
        ingredients: blogData.ingredients.filter(item => item.trim() !== ''),
        instructions: blogData.instructions.filter(item => item.trim() !== ''),
        // Convert numeric strings to numbers
        prepTime: Number(blogData.prepTime),
        cookTime: Number(blogData.cookTime),
        servings: Number(blogData.servings)
      };

      const response = await fetch(`${SummaryApi.defaultUrl}/api/blogs`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedBlogData)  // Send the cleaned data
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      alert('Blog posted successfully!');
      navigate("/blogs")
    } catch (err) {
      console.error('Error posting blog:', err);
      setError(err.message);
      alert('Failed to post blog: ' + err.message);
    }
    
  };

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <ChefHat className="w-8 h-8" />
          Write New Recipe Blog
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={blogData.title}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={blogData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    name="prepTime"
                    value={blogData.prepTime}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Cook Time (mins)</label>
                  <input
                    type="number"
                    name="cookTime"
                    value={blogData.cookTime}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Servings</label>
                  <input
                    type="number"
                    name="servings"
                    value={blogData.servings}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select
                    name="difficulty"
                    value={blogData.difficulty}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Recipe Image</label>
                <div className="flex items-center">
                  <label
                    htmlFor="image-upload"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-red-700 transition-colors"
                  >
                    {blogData.image ? 'Change Image' : 'Upload Image'}
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {isUploading.image && (
                    <div className="ml-4 flex-grow">
                      <div className="bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-red-600 rounded-full h-4"
                          style={{ width: `${uploadProgress.image}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-500">{Math.round(uploadProgress.image)}%</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Ingredients</h2>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Plus className="w-4 h-4" />
                Add Ingredient
              </button>
            </div>

            <div className="space-y-3">
              {blogData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => handleIngredientChange(index, e.target.value)}
                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-red-500"
                    placeholder="e.g., 2 cups flour"
                    required
                  />
                  {blogData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Instructions</h2>
              <button
                type="button"
                onClick={addInstruction}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </button>
            </div>

            <div className="space-y-3">
              {blogData.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={instruction}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-red-500"
                    placeholder={`Step ${index + 1}`}
                    rows="2"
                    required
                  />
                  {blogData.instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Publish Recipe
          </button>
        </form>
      </div>
    </div>
  );
};

export default WriteBlogPage;