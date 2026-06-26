export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white max-w-md w-full p-6" style={{ borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}>
        <h3 className="text-lg font-bold mb-2" style={{ color: '#4A4A48' }}>{title}</h3>
        <p className="text-sm mb-6" style={{ color: '#7A7875' }}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border transition-colors hover:opacity-80"
            style={{ color: '#7A7875', borderColor: '#E5E2DE', borderRadius: '6px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: danger ? '#C13B2A' : '#1A7A4A', borderRadius: '6px' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
