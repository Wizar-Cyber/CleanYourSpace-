interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-[#F2F2F2] rounded-[4px]';

  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: '',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-[#F2F2F2] rounded-[12px] p-6 space-y-4">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" />
      <Skeleton variant="text" width="80%" />
    </div>
  );
}
