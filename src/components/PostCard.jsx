import axios from "axios";
import {
  Heart,
  MessageCircle
} from "lucide-react";

import {
  useEffect,
  useState
} from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function PostCard({ post, refresh}) {

  const user =  JSON.parse(localStorage.getItem("user") );
  const navigate = useNavigate();
// =============================
// TIME FORMAT
// =============================
const formatTime = (timestamp) => {

  if (!timestamp) return "";

  const now = new Date();
  const time = new Date(timestamp);

  const diff = Math.floor((now - time) / 1000);

  // seconds
  if (diff < 60) {
    return "Just now";
  }

  // minutes
  if (diff < 3600) {
    return `${Math.floor(diff / 60)} min ago`;
  }

  // hours
  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} hour ago`;
  }

  // yesterday
  if (diff < 172800) {
    return "Yesterday";
  }

  // date
  return time.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
  // =============================
  // LOCAL STATES
  // =============================
  const [liked, setLiked] =
    useState(post.reacted);

  const [likes, setLikes] =
    useState(
      post.total_reactions ||
      post.reactions ||
      0
    );
const [showLikes, setShowLikes] =  useState(false);

const [likesUsers, setLikesUsers] =  useState([]);
  const [commentText, setCommentText] =
    useState("");

  const [commentsCount, setCommentsCount] =
    useState(
      post.total_comments ||
      post.comments ||
      0
    );

  const [comments, setComments] =
    useState([]);

  const [showComments, setShowComments] =
    useState(false);
// =============================
// LOAD LIKES
// =============================
const loadLikes = async () => {

  try {

    const res = await axios.get(
      `${API}/api/post-likes/${post.id}`
    );

    setLikesUsers(res.data.likes);

    setShowLikes(true);

  } catch (err) {

    console.log(err);

  }
};

// =============================
// DELETE POST
// =============================
const deletePost = async () => {

  const ok =
    window.confirm(
      "Delete this post?"
    );

  if (!ok) return;

  try {

    await axios.delete(
      `${API}/api/delete-post/${post.id}/${user.srno}`
    );

    if (refresh) {
      refresh();
    }

  } catch (err) {

    console.log(err);

  }
};
  // =============================
  // LOAD COMMENTS
  // =============================
  const loadComments = async () => {

    try {

      const res = await axios.get(
        `${API}/api/comments/${post.id}`
      );

      if (res.data.success) {

        setComments(
          res.data.comments || []
        );

      }

    } catch (err) {

      console.log(err);

    }
  };

  // =============================
  // LIKE POST
  // =============================
  const reactPost = async () => {

    try {

      await axios.post(
        `${API}/api/react-post`,
        {
          post_id: post.id,
          user_id: user.srno,
          reaction: "like",
        }
      );

      // LIVE UPDATE
      if (!liked) {

        setLikes(prev => prev + 1);

      }

      setLiked(true);

    } catch (err) {

      console.log(err);

    }
  };

  // =============================
  // COMMENT POST
  // =============================
  const commentPost = async () => {

    if (!commentText.trim()) return;

    try {

      const res = await axios.post(
        `${API}/api/comment-post`,
        {
          post_id: post.id,
          user_id: user.srno,
          comment: commentText,
        }
      );

      if (res.data.success) {

        // INSTANT COMMENT COUNT
        setCommentsCount(prev => prev + 1);

        // INSTANT COMMENT SHOW
        const newComment = {
          comment: commentText,
          name: user.name,
          image: user.pic,
        };

        setComments(prev => [
          newComment,
          ...prev
        ]);

        setCommentText("");

        setShowComments(true);

      }

    } catch (err) {

      console.log(err);

    }
  };

  // =============================
  // TOGGLE COMMENTS
  // =============================
  const toggleComments = async () => {

    if (!showComments) {

      await loadComments();

    }

    setShowComments(!showComments);
  };

  //copy function
  const copyLink = async () => {

  const postUrl =
    `${window.location.origin}/post/${post.id}`;

  await navigator.clipboard.writeText(
    postUrl
  );

  alert("Link copied");

};

  return (

    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-lg">

      {/* HEADER */}
      <div className="flex items-center gap-3 p-4">
        <img
          src={
            post.pic
              ? post.pic
              : "https://indiandost.com/image/nopic.jpg"
          }
          alt={post.name} onClick={() => navigate(`/profile/${post.user_id}`)}
          className="w-12 h-12 rounded-full object-cover"
        />

        <div>

          <h3 className="font-semibold text-white" onClick={() => navigate(`/profile/${post.srno}`)}>
            {post.name}
          </h3>

          <p className="text-xs text-gray-400">
            {/*@{post.srno} */}
          </p>

        </div>

      </div>

      {/* TEXT */}
      {post.content && (

        <p className="px-4 pb-3 text-gray-200 whitespace-pre-wrap break-words">
          {post.content}
        </p>

      )}

      {/* IMAGE */}
      {post.media &&
        post.media_type === "image" && (

        <img
          src={post.media}
          alt=""
          className="w-full max-h-[500px] object-cover"
        />

      )}

      {/* VIDEO */}
      {post.media &&
        post.media_type === "video" && (

        <video
          src={post.media}
          controls
          className="w-full max-h-[500px] bg-black"
        />

      )}

      {/* COUNTS */}
    {/* COUNTS */}
<div className="flex justify-between px-4 py-3 text-sm text-gray-400">

  {/* LIKES */}
  <button
    onClick={loadLikes}
    className="hover:text-pink-400"
  >
    ❤️ {likes} Likes
  </button>

  {/* COMMENTS */}
  <button
    onClick={toggleComments}
    className="hover:text-white"
  >
    💬 {commentsCount} Comments
  </button>

  {/* SHARE */}
  <button
    onClick={async () => {

      // =========================
      // POST URL
      // =========================

      const postUrl =
        `${window.location.origin}/idost/post/${post.id}`;

      const shareData = {

        title: post.name,

        text:
          post.content ||
          "Check this post",

        url: postUrl,

      };

      // =========================
      // MOBILE SHARE API
      // =========================

      try {

        if (navigator.share) {

          await navigator.share(
            shareData
          );

        }

        else {

          // =====================
          // FALLBACK
          // =====================

          window.open(

            `https://wa.me/?text=${encodeURIComponent(
              `${shareData.text}\n${postUrl}`
            )}`,

            "_blank"

          );

        }

      }

      catch (err) {

        console.log(
          "SHARE ERROR:",
          err
        );

      }

    }}
    className="hover:text-green-400"
  >
    🔗 Share
  </button>
   {/* COPY LINK 
  <button
    onClick={() => {

      navigator.clipboard.writeText(
        shareUrl
      );

      alert("Post link copied");

    }}
    className="hover:text-blue-400"
  >
    🔗 Share
  </button>*/}

</div>

      {/* ACTIONS */}
      <div className="flex border-t border-gray-800">

        <button
          onClick={reactPost}
          className={`flex-1 flex items-center justify-center gap-2 py-3 transition ${
            liked
              ? "text-pink-500"
              : "text-gray-300 hover:bg-gray-800"
          }`}
        >

          <Heart size={20} />
          Like

        </button>

        <button
          onClick={toggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-300 hover:bg-gray-800 transition"
        >

          <MessageCircle size={20} />
          Comment

        </button> 
      {Number(post.user_id) === Number(user.srno) && (
        <button
          onClick={deletePost}
          className="ml-auto text-red-400 hover:text-red-500 text-sm"
        >
          Delete
        </button>
      )}

      </div>

      {/* COMMENT BOX */}
      <div className="p-3 border-t border-gray-800">

        <div className="flex gap-2">

          <input
            type="text"
            value={commentText}
            onChange={(e) =>
              setCommentText(e.target.value)
            }
            placeholder="Write a comment..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 outline-none"
          />

          <button
            onClick={commentPost}
            className="bg-pink-500 px-4 rounded-lg text-white flex items-center justify-center"
          >

            <MessageCircle size={18} />

          </button>

        </div>

      </div>

      {/* COMMENTS LIST */}



{showComments && (

  <div className="border-t border-gray-800 px-4 py-4 space-y-4 bg-[#0f172a]">

    {comments.length === 0 ? (

      <p className="text-gray-500 text-sm text-center">
        No comments yet
      </p>

    ) : (

      comments.map((c, index) => (

        <div
          key={index}
          className="flex items-start gap-3 animate-fadeIn"
        >

          {/* USER IMAGE */}
          <img
            src={
              c.pic ||
              c.image ||
              "https://indiandost.com/image/nopic.jpg"
            }
            alt=""
            className="w-11 h-11 rounded-full object-cover border border-gray-700 shrink-0"
          />

          {/* COMMENT BOX */}
          <div className="flex-1">

            <div className="bg-gray-800/80 rounded-2xl px-4 py-3 shadow-sm">

              <div className="flex items-center gap-2 mb-1">

                <h4 className="text-sm font-semibold text-white">
                  {c.name}
                </h4>

                <span className="text-xs text-gray-500">
                  {formatTime(c.created_at)}
                </span>

              </div>

              <p className="text-sm text-gray-200 leading-relaxed break-words">
                {c.comment}
              </p>

            </div>

            {/* OPTIONAL ACTIONS */}
            <div className="flex items-center gap-4 mt-1 ml-2">

              <button className="text-xs text-gray-500 hover:text-pink-400 transition">
                Like
              </button>

              <button className="text-xs text-gray-500 hover:text-pink-400 transition">
                Reply
              </button>

            </div>

          </div>

        </div>

      ))

    )}

  </div>

)}



{/* LIKES MODAL */}
{showLikes && (

  <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">

    <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-700 max-h-[80vh] overflow-y-auto">

      {/* HEADER */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800">

        <h2 className="text-white text-lg font-bold">
          Likes
        </h2>

        <button
          onClick={() => setShowLikes(false)}
          className="text-gray-400 text-xl"
        >
          ✕
        </button>

      </div>

      {/* USERS */}
      <div className="p-3 space-y-3">

        {likesUsers.length === 0 && (

          <p className="text-gray-400 text-center py-5">
            No likes yet
          </p>

        )}

        {likesUsers.map((u) => (

          <div
            key={u.id}
            className="flex items-center gap-3 bg-gray-800 rounded-xl p-3"
          >

            <img
              src={
                u.pic ||
                "https://indiandost.com/image/nopic.jpg"
              }
              alt=""
              className="w-12 h-12 rounded-full object-cover"
            />

            <div>

              <h3 className="text-white font-semibold">
                {u.name}
              </h3>

              <p className="text-gray-400 text-sm">
                liked this post
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>

  </div>

)}
    </div>
  );
}