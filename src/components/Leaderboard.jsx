export default function Leaderboard({ players }) {

  return (
    <div className="mt-2 bg-zinc-900 rounded-2xl p-5">
       {players
        ?.sort((a, b) => b.score - a.score)
        .map((player, index) => (

          <div
            key={index}
            className="flex justify-between border-b border-zinc-700 py-2"
          >
            <span>{player.name}</span>

            <span>{player.score}</span>
          </div>
        ))}
    </div>
  );
}