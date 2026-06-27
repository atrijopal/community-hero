import { useState } from 'react';
import {
  IconRoad, IconDroplet, IconTrash, IconBolt, IconTree, IconSparkles,
} from '@tabler/icons-react';
import { useTranslateMap } from '../../../hooks/useTranslate';

const STRINGS = {
  title:       'What type of issue?',
  subtitle:    'Choose a category to help us route your report correctly',
  continueBtn: 'Continue →',
  aiBtn:       'Not sure? Let AI decide the category',
  aiNote:      'AI will classify from your photo automatically',
  // categories
  infra:       'Roads & Infrastructure',
  infra_d:     'Potholes, damaged roads, broken footpaths, manholes, signals',
  water:       'Water & Drainage',
  water_d:     'Waterlogging, leakage, sewage overflow, water supply',
  sanitation:  'Sanitation',
  sanitation_d:'Garbage dump, illegal dumping, waste overflow',
  electricity: 'Electricity',
  electricity_d:'Broken streetlights, exposed wires, signals',
  parks:       'Parks & Public Spaces',
  parks_d:     'Fallen trees, broken park equipment, public areas',
};

export default function Step0Category({ onNext }) {
  const [selected, setSelected] = useState(null);
  const tr = useTranslateMap(STRINGS);

  const CATEGORIES = [
    { id: 'Infrastructure',   labelKey: 'infra',       descKey: 'infra_d',       icon: IconRoad,    departmentHint: 'roads_infrastructure' },
    { id: 'Water_Drainage',   labelKey: 'water',       descKey: 'water_d',       icon: IconDroplet, departmentHint: 'water_supply' },
    { id: 'Sanitation',       labelKey: 'sanitation',  descKey: 'sanitation_d',  icon: IconTrash,   departmentHint: 'sanitation' },
    { id: 'Electricity',      labelKey: 'electricity', descKey: 'electricity_d', icon: IconBolt,    departmentHint: 'electricity' },
    { id: 'Public_Facilities',labelKey: 'parks',       descKey: 'parks_d',       icon: IconTree,    departmentHint: 'parks_recreation' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#4A4A48' }}>{tr.title}</h2>
        <p className="text-sm" style={{ color: '#7A7875' }}>{tr.subtitle}</p>
      </div>

      <div className="space-y-2.5">
        {CATEGORIES.map(cat => {
          const Icon       = cat.icon;
          const isSelected = selected === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelected(cat.id)}
              className="w-full flex items-center gap-4 p-4 border-2 text-left transition-colors"
              style={{
                borderColor:     isSelected ? '#C13B2A' : '#E5E2DE',
                backgroundColor: isSelected ? '#FDF1EF' : 'white',
                borderRadius:    '8px',
              }}
            >
              <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg"
                style={{ backgroundColor: isSelected ? '#C13B2A' : '#F5F3F0' }}>
                <Icon size={20} stroke={1.5} style={{ color: isSelected ? 'white' : '#7A7875' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: isSelected ? '#C13B2A' : '#4A4A48' }}>{tr[cat.labelKey]}</p>
                <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>{tr[cat.descKey]}</p>
              </div>
              {isSelected && (
                <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: '#C13B2A' }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        className="w-full py-3.5 font-semibold text-base text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}
      >
        {tr.continueBtn}
      </button>

      <div className="border-t pt-4" style={{ borderColor: '#E5E2DE' }}>
        <button
          onClick={() => onNext(null)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium border transition-colors hover:opacity-80"
          style={{ borderColor: '#B8A9E5', color: '#6B50B8', backgroundColor: '#EDE9F8', borderRadius: '6px' }}
        >
          <IconSparkles size={15} stroke={1.5} />
          {tr.aiBtn}
        </button>
        <p className="text-xs text-center mt-2" style={{ color: '#B8B5B0' }}>{tr.aiNote}</p>
      </div>
    </div>
  );
}
