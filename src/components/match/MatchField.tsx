import React from "react";

interface Props {
  width: number;
  height: number;
  children?: React.ReactNode;
}

const MatchField: React.FC<Props> = ({ width, height, children }) => {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      {/* Background */}
      <rect width={width} height={height} fill="#f5f5f5" stroke="#999" strokeWidth="1.5" />

      {/* Pitch outline */}
      <rect x="3" y="3" width={width - 6} height={height - 6} fill="none" stroke="#888" strokeWidth="1" />

      {/* Center line */}
      <line x1="3" y1={height / 2} x2={width - 3} y2={height / 2} stroke="#888" strokeWidth="1" />

      {/* Center circle */}
      <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.1} fill="none" stroke="#888" strokeWidth="1" />
      <circle cx={width / 2} cy={height / 2} r="2" fill="#888" />

      {/* Top goal area */}
      <rect x={width / 2 - width * 0.2} y="3" width={width * 0.4} height={height * 0.12} fill="none" stroke="#888" strokeWidth="1" />
      <rect x={width / 2 - width * 0.08} y="3" width={width * 0.16} height={height * 0.05} fill="none" stroke="#888" strokeWidth="1" />
      {/* Goal */}
      <rect x={width / 2 - width * 0.04} y="0" width={width * 0.08} height="4" fill="none" stroke="#888" strokeWidth="1" rx="1" />
      {/* Penalty arc top */}
      <path
        d={`M ${width / 2 - width * 0.08} ${3 + height * 0.12} A ${width * 0.08} ${width * 0.08} 0 0 0 ${width / 2 + width * 0.08} ${3 + height * 0.12}`}
        fill="none" stroke="#888" strokeWidth="1"
      />

      {/* Bottom goal area */}
      <rect x={width / 2 - width * 0.2} y={height - 3 - height * 0.12} width={width * 0.4} height={height * 0.12} fill="none" stroke="#888" strokeWidth="1" />
      <rect x={width / 2 - width * 0.08} y={height - 3 - height * 0.05} width={width * 0.16} height={height * 0.05} fill="none" stroke="#888" strokeWidth="1" />
      {/* Goal bottom */}
      <rect x={width / 2 - width * 0.04} y={height - 4} width={width * 0.08} height="4" fill="none" stroke="#888" strokeWidth="1" rx="1" />
      {/* Penalty arc bottom */}
      <path
        d={`M ${width / 2 - width * 0.08} ${height - 3 - height * 0.12} A ${width * 0.08} ${width * 0.08} 0 0 1 ${width / 2 + width * 0.08} ${height - 3 - height * 0.12}`}
        fill="none" stroke="#888" strokeWidth="1"
      />

      {children}
    </svg>
  );
};

export default MatchField;
