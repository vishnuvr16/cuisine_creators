const backendDomain = `${process.env.REACT_APP_BACKEND_URL}` || "http://localhost:8000";

const SummaryApi = {
  register: {
    url: `${backendDomain}/api/users/register`,
    method: "post",
  },
  login: {
    url: `${backendDomain}/api/users/login`,
    method: "post"
  },
  logout: {
    url: `${backendDomain}/api/users/logout`,
    method: "post"
  },
  profile:{
    url: `${backendDomain}/api/users/profile`,
    method: "get"
  },
  update_profile: {
    url: `${backendDomain}/api/users/update-profile`,
    method: "patch"
  },
  getVideos: {
    url: `${backendDomain}/api/videos`,
    method: "get"
  },
  trendingVideos: {
    url: `${backendDomain}/api/videos/trending`,
    method: "get",
  },
  uploadVideo: {
    url: `${backendDomain}/api/videos/upload`,
    method: "post"
  },
  getBlogs: {
    url: `${backendDomain}/api/blogs`,
    method: "get",
  },
  featuredBlogs: {
    url: `${backendDomain}/api/blogs/featured`,
    method: "get"
  },
  createBlog: {
    url: `${backendDomain}/api/blogs/create`,
    method: "post"
  },
  defaultUrl: backendDomain
};

export default SummaryApi;
