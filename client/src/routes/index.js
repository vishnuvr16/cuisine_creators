import {createBrowserRouter, Route} from "react-router-dom"
import App from "../App"
import HomePage from "../pages/HomePage"
import Videos from "../pages/Videos";
import BlogPage from "../pages/BlogPage";
import AIKitchenPage from "../pages/AIReceipe";
import ProfilePage from "../pages/Profile";
import Blogs from "../pages/Blogs";
import WriteBlogPage from "../pages/WritingBlog";
import ProtectedRoute from '../components/ProtectedRoutes'
import VideoPlaying from "../pages/VideoPlaying";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "",
                element: <HomePage />
            },
            {
                path: "videos",
                element: <Videos />
            },
            {
                path: "videos/:id",
                element: <VideoPlaying />
            },
            {
                path: "blogs",
                element: <Blogs />
            },
            {
                path: "blogs/:id",
                element: <BlogPage />
            },
            {
                path: "aiReceipe",
                element: <AIKitchenPage />
            },
            {
                path: "/profile",
                element: (
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                )
                
            },
            {
                path: "blogs/create",
                element: (
                    <ProtectedRoute>
                        <WriteBlogPage />
                    </ProtectedRoute>
                )
            }
        ]
    }
])

export default router;