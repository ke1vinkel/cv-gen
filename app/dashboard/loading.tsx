import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <main className="w-full space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-10 xl:px-14 2xl:px-16">
      <div className="space-y-3">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-5 w-full max-w-lg rounded-lg" />
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),23rem))] gap-5 xl:gap-6">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-80 rounded-2xl" />
        ))}
      </div>
    </main>
  )
}
