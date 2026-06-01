import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../config";
import { useNavigate, useParams  } from "react-router-dom";
import StoryBar from "../components/StoryBar";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
const token = localStorage.getItem("token"); 
const configtoken = token
  ? {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  : {};
const user = JSON.parse(localStorage.getItem("user") || "null");
const viewer = user?.srno || 0;

export default function Timeline() {

  const { id } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);

  const [hasMore, setHasMore] = useState(true);

  // =========================
  // FETCH SINGLE POST
  // =========================
  const fetchSinglePost = async () => {

    try {

      setLoading(true);

      const res = await axios.get(
        `${API}/api/post/${id}?viewer=${viewer}`
      );

      if (res.data.post) {
        setPosts([res.data.post]);
      }

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);
    }
  };

  // =========================
  // FETCH FEED
  // =========================
  const fetchFeed = async (pageNo = 1) => {

    try {

      setLoading(true);      
      const res = await axios.get(
        `${API}/api/feed?viewer=${viewer}&page=${pageNo}`,
        configtoken
      );
console.log(res.data);
      const newPosts = res.data.posts || [];

      if (pageNo === 1) {

        setPosts(newPosts);

      } else {

        setPosts((prev) => [
          ...prev,
          ...newPosts
        ]);
      }

      if (newPosts.length === 0) {
        setHasMore(false);
      }

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);
    }
  };

  // =========================
  // FIRST LOAD
  // =========================
  useEffect(() => {

    if (id) {

      fetchSinglePost();

    } else {

      fetchFeed(1);
    }

  }, [id]);

  // =========================
  // INFINITE SCROLL
  // ONLY FOR TIMELINE
  // =========================
  useEffect(() => {

    if (id) return;

    const handleScroll = () => {

      const scrollTop = window.scrollY;

      const windowHeight = window.innerHeight;

      const fullHeight =
        document.documentElement.scrollHeight;

      if (
        scrollTop + windowHeight >= fullHeight - 200
      ) {

        if (!loading && hasMore) {

          const nextPage = page + 1;

          setPage(nextPage);

          fetchFeed(nextPage);
        }
      }
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );

  }, [page, loading, hasMore, id]);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">

      {/* ONLY TIMELINE PAGE */}
      {!id && (
        <>
          <StoryBar />

          <CreatePost
            refresh={() => fetchFeed(1)}
          />
        </>
      )}

      {/* POSTS */}
      <div className="space-y-4 p-3">

        {posts.map((post) => (

          <PostCard
            key={post.id}
            post={post}
            refresh={() => {

              if (id) {
                fetchSinglePost();
              } else {
                fetchFeed(1);
              }
            }}
          />

        ))}

      </div>

      {/* LOADER */}
      {loading && !id && (
        <p className="text-center text-gray-400 py-4">
          Loading more posts...
        </p>
      )}

      {/* END */}
      {!hasMore && !id && (
        <p className="text-center text-gray-500 py-4">
          No more posts
        </p>
      )}

      {/* SINGLE POST PAGE */}
    {id && (
      <div className="p-4 text-center">
        <button
          onClick={() => navigate("/timeline")}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl"
        >
          View More Posts
        </button>
      </div>
    )}

    </div>
  );
}
