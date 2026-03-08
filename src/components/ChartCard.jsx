import React from 'react';

const ChartCard = ({ title, children, subtitle }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="w-full overflow-x-auto">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
