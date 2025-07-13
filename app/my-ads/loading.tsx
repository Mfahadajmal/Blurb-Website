export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="h-10 bg-gray-200 rounded-lg w-48 mb-2 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-white rounded-lg shadow-sm">
              <div className="text-center">
                <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs Skeleton */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
          ))}
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-video bg-gray-200 animate-pulse"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
