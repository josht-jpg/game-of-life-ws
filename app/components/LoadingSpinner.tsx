export const LoadingSpinner = ({ className }: { className?: string }) => {
  return (
    <div
      role="presentation"
      className={`size-10 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin ${className ?? ""}`}
    />
  );
};
