import { useEffect, useState } from 'react';
import Navbar from '../../components/shared/Navbar';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

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

  const PRIORITY_COLORS = {
    high:   'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low:    'border-green-200 bg-green-50',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🔮 AI Predictions</h1>
        <p className="text-gray-500 text-sm mb-6">Issues AI predicts will occur in the next 30 days based on historical patterns</p>

        {predictions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-5xl mb-3">🤖</p>
            <p className="text-gray-600">No active predictions — AI will generate them based on ticket history</p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.sort((a, b) => b.probability - a.probability).map(pred => (
              <div key={pred.id} className={`border-2 rounded-2xl p-5 ${PRIORITY_COLORS[pred.priority] || 'border-gray-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        pred.priority === 'high' ? 'bg-red-100 text-red-700' :
                        pred.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {pred.priority?.toUpperCase()}
                      </span>
                      <span className="text-lg font-bold text-gray-900">{pred.probability}% probability</span>
                    </div>
                    <p className="font-semibold text-gray-900 capitalize mb-1">{pred.issueType?.replace(/_/g,' ')}</p>
                    <p className="text-sm text-gray-700 mb-1">📍 {pred.location}</p>
                    <p className="text-sm text-gray-600 mb-3">{pred.reason}</p>
                    <div className="bg-white/60 rounded-xl p-3 text-sm">
                      <p className="font-medium text-gray-700">💡 Suggested Action:</p>
                      <p className="text-gray-600 mt-1">{pred.suggestedAction}</p>
                      {pred.estimatedCost && <p className="text-gray-500 text-xs mt-1">Estimated cost: {pred.estimatedCost}</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400 mb-2">Ward: {pred.ward}</p>
                    <button onClick={() => dismiss(pred.id)} className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition">
                      Dismiss
                    </button>
                  </div>
                </div>
                <div className="mt-3 bg-white/50 rounded-lg h-2 overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-lg transition-all" style={{ width: `${pred.probability}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
