export default function Splash() {
  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-white">

      {/* Logo */}
     <div className="animate-pulse">
  <img
    src="./favicon.svg.png"
    alt="logo"
    className="w-20 h-20 object-contain"
  />
</div>

      {/* App Name */}
      <h1 className="mt-4 text-3xl font-bold tracking-wide text-white">
        IndianDost
      </h1>

      {/* Small Tagline */}
      <p className="text-gray-400 text-sm mt-1">
       Loadding
      </p>

      {/* Loader */}
      <div className="flex gap-2 mt-6">
        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
      </div>

    </div>
  );
}