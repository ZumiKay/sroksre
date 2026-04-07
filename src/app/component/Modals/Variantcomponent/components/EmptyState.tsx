interface EmptyStateProps {
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  message,
  actionText,
  onAction,
}: EmptyStateProps) => {
  return (
    <div className="text-center py-8 text-gray-400">
      <p>{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
