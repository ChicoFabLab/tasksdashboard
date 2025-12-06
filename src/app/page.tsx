export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          🏗️ CFL Volunteer Board
        </h1>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/auth/discord"
              className="block bg-purple-600 text-white text-center py-4 rounded-lg font-bold hover:bg-purple-700 transition-colors"
            >
              🙋 Volunteer Portal
            </a>
            <a
              href="/display"
              className="block bg-blue-600 text-white text-center py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              📺 Fab Lab Display
            </a>
          </div>
          <a
            href="/mr"
            className="block bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-4 rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            📻 Maker Radio Display
          </a>
          <a
            href="/creations"
            className="block bg-gradient-to-r from-pink-600 to-purple-600 text-white text-center py-4 rounded-lg font-bold hover:from-pink-700 hover:to-purple-700 transition-colors"
          >
            🎨 Community Creations
          </a>
        </div>
      </div>
    </div>
  );
}
