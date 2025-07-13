export default function ApplicationsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center">
            <div className="h-10 bg-white/20 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-white/20 rounded-lg w-96 mx-auto animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Tabs Skeleton */}
      <section className="bg-white border-b">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex">
            <div className="h-12 bg-gray-200 rounded w-40 mr-4 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
