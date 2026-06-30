import { SkeletonHero, SkeletonTile, SkeletonGrid } from '@/components/SkeletonTile'

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex md:flex-col md:w-20 lg:w-64 p-4 gap-2 animate-pulse">
        <div className="h-8 w-32 bg-gray-800 rounded mb-6" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 w-full bg-gray-800/50 rounded-lg" />
        ))}
      </div>

      <main className="flex-1 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonHero />
          <SkeletonTile />
          <SkeletonTile />
        </div>
        <SkeletonGrid />
      </main>
    </div>
  )
}
