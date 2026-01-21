export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        <p className="mt-2 text-sm text-gray-400">Please wait</p>
      </div>
    </div>
  );
}
