export default function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      className="border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin"
      style={{ width: size, height: size }}
    />
  );
}
