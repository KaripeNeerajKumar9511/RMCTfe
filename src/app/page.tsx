export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">

      <h1 className="text-3xl font-bold">
        RMCT Platform
      </h1>

      <p>
        Rapid Manufacturing Critical Path Tool
      </p>

      <div className="flex gap-4">

        <a
          href="/login"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Login
        </a>

        <a
          href="/signup"
          className="border px-4 py-2 rounded"
        >
          Signup
        </a>

      </div>

    </div>
  )
}

