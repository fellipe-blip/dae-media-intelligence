interface Props {
  message: string;
  sub?: string;
}

export default function EmptyState({ message, sub }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-gray-400 font-medium">{message}</p>
      {sub && <p className="text-gray-600 text-sm mt-1">{sub}</p>}
    </div>
  );
}
