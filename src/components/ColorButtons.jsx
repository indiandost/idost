export default function ColorButtons({ tapColor }) {

  const colors = [
    "red",
    "green",
    "blue",
    "yellow",
  ];


  return (
    <div className="grid grid-cols-2 gap-4 mt-10 max-w-md mx-auto">

      {colors.map((color) => (

        <button
          key={color}
          onClick={() => tapColor(color)}
          className="h-24 rounded-2xl font-bold text-white text-2xl"
          style={{ background: color }}
        >
          {color}
        </button>
      ))}
    </div>
  );
}