import React, { useState, useEffect } from 'react';
import { Search, X, Menu, ChefHat } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout
} from '../redux/authSlice';
import SummaryApi from '../common';

const Navbar = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector(state => state.auth);
  
  const [showModal, setShowModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [showModal]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleLogout = async () => {
    try {
      await fetch(`${SummaryApi.defaultUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      dispatch(logout());
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
      dispatch(logout());
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleModalOpen = (isSignUpForm = false) => {
    setIsSignUp(isSignUpForm);
    setShowModal(true);
    setIsMenuOpen(false);
    resetForm();
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
  };

  const handleOutsideClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      handleModalClose();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      dispatch(loginFailure('Please fill in all required fields'));
      return false;
    }

    if (isSignUp) {
      if (!formData.name) {
        dispatch(registerFailure('Please enter your name'));
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        dispatch(registerFailure('Passwords do not match'));
        return false;
      }
      if (formData.password.length < 8) {
        dispatch(registerFailure('Password must be at least 8 characters long'));
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isSignUp) {
        dispatch(registerStart());
      } else {
        dispatch(loginStart());
      }

      const endpoint = isSignUp ? `${SummaryApi.defaultUrl}/api/auth/register` : `${SummaryApi.defaultUrl}/api/auth/login`;
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (isSignUp) {
        dispatch(registerSuccess(data));
      } else {
        dispatch(loginSuccess(data));
      }

      handleModalClose();

    } catch (err) {
      const errorMessage = err.message || 'An error occurred. Please try again.';
      if (isSignUp) {
        dispatch(registerFailure(errorMessage));
      } else {
        dispatch(loginFailure(errorMessage));
      }
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChefHat className="w-8 h-8" />
              <span className="text-2xl font-bold text-orange-600">CuisineCreators</span>
            </div>

            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>

            <div className="hidden lg:flex items-center space-x-8">
              <a href="/" className="text-gray-700 hover:text-orange-600">Explore</a>
              <a href="/videos" className="text-gray-700 hover:text-orange-600">Videos</a>
              <a href="/blogs" className="text-gray-700 hover:text-orange-600">Blogs</a>
              <a href="/aiReceipe" className="text-gray-700 hover:text-orange-600">AI Kitchen</a>
              {isAuthenticated && <a href="/profile" className="text-gray-700 hover:text-orange-600">Profile</a>}
              
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => handleModalOpen(false)}
                  className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          <div 
            className={`lg:hidden transition-all duration-300 ease-in-out ${
              isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
            }`}
          >
            <div className="py-4 space-y-4">
              <a 
                href="/" 
                className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Explore
              </a>
              <a 
                href="/videos" 
                className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Videos
              </a>
              <a 
                href="/blogs" 
                className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Blogs
              </a>
              <a 
                href="/aiReceipe" 
                className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                AI Kitchen
              </a>
              {isAuthenticated && (
                <a 
                  href="/profile" 
                  className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </a>
              )}
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => handleModalOpen(false)}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
          onClick={handleOutsideClick}
        >
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </h3>
              <button 
                onClick={handleModalClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                {error}
                <button
                  onClick={() => dispatch(isSignUp ? registerFailure(null) : loginFailure(null))}
                  className="float-right"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter your name"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your password"
                />
              </div>
              
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Confirm your password"
                  />
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-400"
              >
                {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  className="text-orange-600 hover:text-orange-700 font-medium"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    resetForm();
                  }}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;