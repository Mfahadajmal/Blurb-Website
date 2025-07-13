export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded-lg w-96 animate-pulse"></div>
        </div>

        {/* Card Skeleton */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="h-20 bg-gradient-to-r from-blue-600 to-purple-600"></div>

          {/* Content */}
          <div className="p-8">
            {/* Profile Picture Skeleton */}
            <div className="flex flex-col items-center space-y-4 mb-8">
              <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse"></div>
            </div>

            {/* Form Fields Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Password Section Skeleton */}
            <div className="border-t border-gray-200 pt-8">
              <div className="h-6 bg-gray-200 rounded w-40 mb-6 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Button Skeleton */}
            <div className="flex justify-end pt-6">
              <div className="h-12 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
