import { useEffect, useRef, useState } from "react";
import axios from "axios";
import StoryViewer from "./StoryViewer";
import { API } from "../config";

export default function StoryBar() {

  const [stories, setStories] = useState([]);

  const [selectedStory, setSelectedStory] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const fileRef = useRef();

  const user =
    JSON.parse(localStorage.getItem("user"));

  // =========================
  // LOAD STORIES
  // =========================
  useEffect(() => {

    loadStories();

  }, []);

  const loadStories = async () => {

    try {

      const res = await axios.get(
        `${API}/api/stories`
      );

      setStories(res.data.data || []);

    } catch (err) {

      console.log(err);

      setStories([]);
    }
  };

  // =========================
  // CREATE STORY
  // =========================
  const createStory = async (file) => {

    try {

      setUploading(true);

      setProgress(0);

      const formData = new FormData();

      formData.append(
        "user_id",
        user.srno
      );

      formData.append(
        "media",
        file
      );

      const res = await axios.post(
        `${API}/api/create-story`,
        formData,
        {

          headers: {
            "Content-Type":
              "multipart/form-data",
          },

          onUploadProgress: (evt) => {

            const percent =
              Math.round(
                (evt.loaded * 100) /
                evt.total
              );

            setProgress(percent);
          },
        }
      );

      if (res.data.success) {

        await loadStories();

        alert("Story uploaded");

      } else {

        alert(
          res.data.message ||
          "Upload failed"
        );
      }

    } catch (err) {

      console.log(err);

      alert("Story upload failed");

    } finally {

      setUploading(false);

      setProgress(0);
    }
  };

  return (

    <>
      {/* UPLOAD PROGRESS */}
      {uploading && (

        <div className="px-3 mb-2">

          <div className="bg-gray-800 rounded-full h-3 overflow-hidden">

            <div
              className="
                bg-pink-500
                h-3
                transition-all
              "
              style={{
                width: `${progress}%`
              }}
            />

          </div>

          <p className="text-xs text-white mt-1">

            Uploading story...
            {progress}%

          </p>

        </div>
      )}

      <div className="
  sticky top-14 z-30
  mx-2 mt-2 mb-3
  px-3 py-3
  flex gap-3 overflow-x-auto scrollbar-hide
  bg-gray-900/80
  backdrop-blur-lg
  rounded-2xl
  border border-gray-800
  shadow-xl
">
        

        {/* YOUR STORY */}
        <div
          onClick={() => {

            if (!uploading) {
              fileRef.current.click();
            }

          }}
          className="
            flex
            flex-col
            items-center
            cursor-pointer
            min-w-[70px]
          "
        >

          <div className="
             w-16 h-16 rounded-full
  bg-gradient-to-tr
  from-pink-500
  to-purple-600
  flex items-center justify-center
  text-3xl font-bold
  shadow-lg shadow-pink-500/30
  hover:scale-105 transition
          ">

            {uploading
              ? `${progress}%`
              : "+"}

          </div>

          <p className="text-xs text-white mt-1">

            {uploading
              ? "Uploading..."
              : "Your Story"}

          </p>

          <input
            type="file"
            hidden
            ref={fileRef}
            accept="image/*,video/mp4"
            onChange={(e) => {

              if (e.target.files[0]) {

                createStory(
                  e.target.files[0]
                );
              }
            }}
          />

        </div>

        {/* STORIES */}
        {stories.map((s) => (

          <div
            key={s.id}
            onClick={() => setSelectedStory(s)}
            className="
              flex
              flex-col
              items-center
              cursor-pointer
              min-w-[70px]
            "
          >

           <div className="  p-[3px]
              rounded-full
              bg-gradient-to-tr
              from-pink-500
              via-red-500
              to-yellow-400
              shadow-lg shadow-pink-500/30
            ">
              <img
                src={s.photo}
                alt=""
                className="
                  w-16 h-16 rounded-full
                    object-cover
                    border-2 border-gray-900
                    transition duration-300
                    hover:scale-105
                "
              />

            </div>

            <p className="
              text-xs
              text-white
              mt-1
              truncate
              w-16
              text-center
            ">

              {s.name}

            </p>

          </div>
        ))}

      </div>

      {/* VIEWER */}
      {selectedStory && (

  <StoryViewer
    stories={stories}
    currentIndex={
      stories.findIndex(
        s => s.id === selectedStory.id
      )
    }
    onClose={() => setSelectedStory(null)}
  />

)}
    </>
  );
}