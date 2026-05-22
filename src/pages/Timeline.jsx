import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../config";
import StoryBar from "../components/StoryBar";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import { useParams } from "react-router-dom";

export default function Timeline() {

  const { id } = useParams();

  const [posts, setPosts] = useState([]);

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);

  const [hasMore, setHasMore] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  // =========================
  // FETCH SINGLE POST
  // =========================
  const fetchSinglePost = async () => {

    try {

      setLoading(true);

      const res = await axios.get(
        `${API}/api/post/${id}?viewer=${user.srno}`
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
        `${API}/api/feed?viewer=${user.srno}&page=${pageNo}`
      );

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

    </div>
  );
}
/*import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../config";
import StoryBar from "../components/StoryBar";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";

export default function Timeline() {
  const [posts, setPosts] = useState([]);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchFeed = async (pageNo = 1) => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API}/api/feed?viewer=${user.srno}&page=${pageNo}`
      );

      const newPosts = res.data.posts || [];

      if (pageNo === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
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

  // FIRST LOAD
  useEffect(() => {
    fetchFeed(1);
  }, []);

  // INFINITE SCROLL
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= fullHeight - 200) {
        if (!loading && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchFeed(nextPage);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, loading, hasMore]);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">

      <StoryBar />

      <CreatePost refresh={() => fetchFeed(1)} />

      <div className="space-y-4 p-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            refresh={() => fetchFeed(1)}
          />
        ))}
      </div>

      {loading && (
        <p className="text-center text-gray-400 py-4">
          Loading more posts...
        </p>
      )}

      {!hasMore && (
        <p className="text-center text-gray-500 py-4">
          No more posts
        </p>
      )}

    </div>
  );
}
  */