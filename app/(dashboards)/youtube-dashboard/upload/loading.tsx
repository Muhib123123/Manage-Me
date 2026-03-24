export default function Loading() {
    return (
        <div className="p-6 md:p-10 max-w-[1000px] mx-auto animate-in fade-in duration-300">
            {/* Header skeleton */}
            <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] animate-pulse" />
                <div>
                    <div className="h-6 w-48 bg-[var(--surface-2)] rounded-md animate-pulse mb-2" />
                    <div className="h-4 w-64 bg-[var(--surface-2)] rounded-md animate-pulse" />
                </div>
            </div>

            {/* Layout skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
                {/* Left column (Video preview + info) */}
                <div className="space-y-6">
                    <div className="w-full aspect-video bg-[var(--surface-2)] rounded-2xl animate-pulse" />
                    <div className="h-12 w-full bg-[var(--surface-2)] rounded-xl animate-pulse" />
                    <div className="h-32 w-full bg-[var(--surface-2)] rounded-xl animate-pulse" />
                </div>

                {/* Right column (Settings) */}
                <div className="space-y-6">
                    <div className="h-[400px] w-full bg-[var(--surface-2)] rounded-2xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}
