export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sz = { sm: 'w-5 h-5 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-[3px]' }[size] || 'w-8 h-8 border-2';
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sz} rounded-full animate-spin`} style={{ borderColor: '#E5E2DE', borderTopColor: '#C13B2A' }} />
      {text && <p className="text-sm font-medium" style={{ color: '#7A7875' }}>{text}</p>}
    </div>
  );
}
