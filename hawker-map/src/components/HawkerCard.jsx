import React from 'react';

const HawkerCard = ({ props }) => {
  const address = props.ADDRESS_MYENV || (props.ADDRESSBLOCKHOUSENUMBER || props.ADDRESSSTREETNAME ? `${props.ADDRESSBLOCKHOUSENUMBER || ""} ${props.ADDRESSSTREETNAME || ""}`.trim() : "N/A");
  
  return (
    <div className="p-2 w-72 flex flex-col gap-2 whitespace-normal overflow-hidden leading-relaxed">
      {props.PHOTOURL && <img src={props.PHOTOURL} alt={props.NAME} className="w-full h-40 object-cover rounded shadow-sm border border-gray-200" />}
      <h2 className="font-black text-lg border-b border-gray-200 pb-2 mb-1 text-gray-900 leading-tight">{props.NAME}</h2>
      <p className="text-sm text-gray-800 leading-snug"><strong>Address:</strong> {address}</p>
      <div className="flex justify-between items-center mt-1 bg-gray-50 p-2 rounded">
        <p className="text-sm text-gray-700 font-mono font-bold">{props.ADDRESSPOSTALCODE}</p>
        <span className="bg-blue-700 text-white font-black py-1 px-3 rounded text-xs tracking-wide">STALLS: {props.NUMBER_OF_COOKED_FOOD_STALLS || 0}</span>
      </div>
    </div>
  );
};

export default HawkerCard;