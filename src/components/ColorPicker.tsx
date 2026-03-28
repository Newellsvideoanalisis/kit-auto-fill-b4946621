import React from "react";

interface ColorPickerProps {
  color1: string;
  color2: string;
  onColor1Change: (c: string) => void;
  onColor2Change: (c: string) => void;
}

const PRESETS = [
  "#0f3460", "#1a1a2e", "#e94560", "#16213e",
  "#1b9e3e", "#fff200", "#000000", "#ffffff",
  "#c70039", "#2e86de", "#ff6348", "#6c5ce7",
];

const ColorPicker: React.FC<ColorPickerProps> = ({ color1, color2, onColor1Change, onColor2Change }) => {
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm font-display text-foreground tracking-wider">CENTRO:</span>
        <input type="color" value={color1} onChange={(e) => onColor1Change(e.target.value)} className="w-8 h-8 cursor-pointer rounded border border-border" />
        <div className="flex gap-1">
          {PRESETS.slice(0, 6).map((c) => (
            <button key={c} onClick={() => onColor1Change(c)} className="w-5 h-5 rounded-sm border border-border" style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-display text-foreground tracking-wider">ANILLO:</span>
        <input type="color" value={color2} onChange={(e) => onColor2Change(e.target.value)} className="w-8 h-8 cursor-pointer rounded border border-border" />
        <div className="flex gap-1">
          {PRESETS.slice(6).map((c) => (
            <button key={c} onClick={() => onColor2Change(c)} className="w-5 h-5 rounded-sm border border-border" style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
