export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sz = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }[size] || 'w-8 h-8';
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sz} border-4 border-blue-500 border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
