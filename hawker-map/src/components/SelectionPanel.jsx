import React from 'react';

const SelectionPanel = ({ selectedIds, toggleSelection, clearAll }) => {
  if (selectedIds.length === 0) return null;

  return (
    <div className="bg-white border-t border-gray-300 p-5 max-h-48 overflow-y-auto z-[3000] shadow-2xl">
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Selected Centres ({selectedIds.length})</h3>
        <button onClick={clearAll} className="text-red-600 hover:text-white hover:bg-red-600 font-black border-2 border-red-200 px-4 py-1.5 rounded-full text-xs transition-all">
          CLEAR ALL SELECTIONS
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        {selectedIds.map(name => (
          <div key={name} className="bg-blue-600 text-white pl-4 pr-2 py-2 rounded-full text-sm flex items-center gap-3 font-bold shadow-md hover:bg-blue-700 transition-colors">
            {name}
            <button onClick={() => toggleSelection(name)} className="bg-blue-500 hover:bg-red-500 rounded-full w-6 h-6 flex items-center justify-center text-lg leading-none transition-colors">&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectionPanel;