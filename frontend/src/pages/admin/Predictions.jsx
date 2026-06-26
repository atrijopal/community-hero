import { useEffect, useState } from 'react';
import { IconSparkles } from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const PRIORITY = {
  high:   { bg: '#FDF1EF', border: '#E5C5BF', badge: '#FDF1EF', badgeText: '#C13B2A', bar: '#C13B2A' },
  medium: { bg: '#FFF8E0', border: '#F5D9A8', badge: '#FFF8E0', badgeText: '#D4730A', bar: '#D4730A' },
  low:    { bg: '#E8F5EE', border: '#A7D5B9', badge: '#E8F5EE', badgeText: '#1A7A4A', bar: '#1A7A4A' },
};

export default function Predictions() {
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'predictions'), where('active', '==', true));
    return onSnapshot(q, snap => setPredictions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const dismiss = async (id) => {
    await updateDoc(doc(db, 'predictions', id), { active: false });
    toast.success('Prediction dismissed');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-1">
          <IconSparkles size={18} stroke={1.5} style={{ color: '#6B50B8' }} />
          <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>AI Predictions</h1>
        </div>
        <p className="text-sm mb-6" style={{ color: '#7A7875' }}>Issues AI predicts will occur in the next 30 days based on historical patterns</p>

        {predictions.length === 0 ? (
          <div className="text-center py-16 bg-white border" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <IconSparkles size={40} stroke={1} style={{ color: '#B8B5B0', margin: '0 auto 12px' }} />
            <p style={{ color: '#4A4A48' }}>No active predictions — AI will generate them based on ticket history</p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.sort((a, b) => b.probability - a.probability).map(pred => {
              const p = PRIORITY[pred.priority] || PRIORITY.low;
              return (
                <div key={pred.id} className="border-2 p-5" style={{ backgroundColor: p.bg, borderColor: p.border, borderRadius: '8px' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5" style={{ backgroundColor: p.badge, color: p.badgeText, borderRadius: '4px' }}>
                          {pred.priority?.toUpperCase()}
                        </span>
                        <span className="text-lg font-bold" style={{ color: '#4A4A48' }}>{pred.probability}% probability</span>
                      </div>
                      <p className="font-semibold capitalize mb-1" style={{ color: '#4A4A48' }}>{pred.issueType?.replace(/_/g,' ')}</p>
                      <p className="text-sm mb-1" style={{ color: '#7A7875' }}>Ward: {pred.ward} · {pred.location}</p>
                      <p className="text-sm mb-3" style={{ color: '#4A4A48' }}>{pred.reason}</p>
                      <div className="p-3 text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '6px' }}>
                        <p className="font-medium mb-1" style={{ color: '#4A4A48' }}>Suggested Action:</p>
                        <p style={{ color: '#7A7875' }}>{pred.suggestedAction}</p>
                        {pred.estimatedCost && <p className="text-xs mt-1" style={{ color: '#B8B5B0' }}>Estimated cost: {pred.estimatedCost}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <button onClick={() => dismiss(pred.id)}
                        className="text-xs border px-3 py-1.5 transition-colors"
                        style={{ borderColor: '#E5E2DE', color: '#7A7875', borderRadius: '6px' }}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                    <div className="h-2 rounded transition-all" style={{ width: `${pred.probability}%`, backgroundColor: p.bar }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
