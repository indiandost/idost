import { useState } from "react";
import axios from "axios";
import { Image, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function CreatePost({ refresh }) {

  const [content, setContent] = useState("");
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token"); 
  const createPost = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!content && !media) return;

    try {

      setLoading(true);

      const formData = new FormData();

      formData.append("user_id", user.srno);
      formData.append("content", content);

      if (media) {
        formData.append("media", media);
      }
        const res = await axios.post(
          `${API}/api/create-post`,
          formData,
          {
            headers: {
               Authorization: `Bearer ${token}`,
            },
          }
        );

        // SHOW ERROR MESSAGE
        if (!res.data.success) {

          alert(res.data.message);

          return;
        }

        // SUCCESS
        //alert("Post uploaded successfully");

      setContent("");
      setMedia(null);

      if (refresh) {
        refresh();
      }

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 m-3 rounded-2xl p-4 border border-gray-800 shadow-lg">

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows={3}
        className="w-full bg-gray-800 text-white rounded-xl p-3 outline-none resize-none placeholder-gray-400"
      />

      {media && (
        <div className="mt-2 text-sm text-green-400 break-all">
          Selected: {media.name}
        </div>
      )}

      <div className="flex justify-between items-center mt-4">

        <label className="cursor-pointer flex items-center gap-4 text-gray-300 hover:text-white transition">

          <div className="flex items-center gap-1">
            <Image size={22} />
            <span className="text-sm">Photo</span>
          </div>

          <div className="flex items-center gap-1">
            <Video size={22} />
            <span className="text-sm">Video</span>
          </div>

          <input
            type="file"
            hidden
            accept="image/*,video/mp4"
            onChange={(e) => setMedia(e.target.files[0])}
          />
        </label>

        <button
          onClick={createPost}
          disabled={loading}
          className={`px-5 py-2 rounded-xl font-semibold transition ${
            loading
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-pink-600 hover:bg-pink-700 text-white"
          }`}
        >
          {loading ? "Posting..." : "Post"}
        </button>

      </div>
    </div>
  );
}