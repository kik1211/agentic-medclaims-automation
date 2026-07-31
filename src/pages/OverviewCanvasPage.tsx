import React, { useEffect, useState } from 'react';
import { Screen1 } from '../screens/AuthScreens';
import { Screen2, Screen8, Screen9, Screen16 } from '../screens/DashboardScreens';
import { Screen3, Screen3A, Screen4, Screen5, Screen12, Screen13 } from '../screens/ClaimScreens';
import { Screen6, Screen11, Screen10 } from '../screens/PipelineScreens';
import { Screen7, Screen14, Screen15 } from '../screens/DenialScreens';

const connections = [
  { from: 'btn-login', to: 'screen-2' },
  { from: 'nav-pre-auth', to: 'screen-3' },
  { from: 'nav-discharge', to: 'screen-4' },
  { from: 'nav-final-claims', to: 'screen-5' },
  { from: 'nav-pipeline', to: 'screen-6' },
  { from: 'nav-denial', to: 'screen-7' },
  { from: 'nav-reports', to: 'screen-8' },
  { from: 'nav-settings', to: 'screen-9' },
  { from: 'btn-notifications', to: 'screen-10' },
  { from: 'btn-upload-start', to: 'screen-3a' },
  { from: 'btn-3a-pipeline', to: 'screen-6' },
  { from: 'btn-row-missing', to: 'screen-12' },
  { from: 'btn-row-approved', to: 'screen-13' },
  { from: 'btn-row-rejected', to: 'screen-14' },
  { from: 'btn-12-submit', to: 'screen-3a' },
  { from: 'btn-6-view', to: 'screen-11' },
  { from: 'btn-6-review', to: 'screen-14' },
  { from: 'btn-7-view-ai', to: 'screen-15' },
  { from: 'btn-7-escalate', to: 'screen-14' },
  { from: 'btn-11-escalate', to: 'screen-14' },
  { from: 'btn-14-manual', to: 'screen-15' },
  { from: 'btn-15-resubmit', to: 'screen-3a' },
  { from: 'btn-9-add-insurer', to: 'screen-16' },
  { from: 'btn-10-view', to: 'screen-11' },
];

interface Connection {
  from: string;
  to: string;
}

interface LineData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  id: string;
}

const ArrowsOverlay: React.FC<{ connections: Connection[] }> = ({ connections }) => {
  const [lines, setLines] = useState<LineData[]>([]);

  useEffect(() => {
    const updateLines = () => {
      const newLines = connections
        .map((conn) => {
          const fromEl = document.getElementById(conn.from);
          const toEl = document.getElementById(conn.to);
          if (!fromEl || !toEl) return null;

          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();

          const container = document.getElementById('canvas-container');
          if (!container) return null;
          const containerRect = container.getBoundingClientRect();

          const startX = fromRect.right - containerRect.left + container.scrollLeft;
          const startY =
            fromRect.top + fromRect.height / 2 - containerRect.top + container.scrollTop;

          const endX = toRect.left - containerRect.left + container.scrollLeft;
          const endY = toRect.top + toRect.height / 2 - containerRect.top + container.scrollTop;

          return { startX, startY, endX, endY, id: `${conn.from}-${conn.to}` };
        })
        .filter((line): line is LineData => line !== null);
      setLines(newLines);
    };

    updateLines();
    window.addEventListener('resize', updateLines);
    const timeout = setTimeout(updateLines, 1000);
    return () => {
      window.removeEventListener('resize', updateLines);
      clearTimeout(timeout);
    };
  }, [connections]);

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#1f2937" />
        </marker>
      </defs>
      {lines.map((line) => {
        const dx = Math.abs(line.endX - line.startX);
        const cp1x = line.startX + dx * 0.5;
        const cp1y = line.startY;
        const cp2x = line.endX - dx * 0.5;
        const cp2y = line.endY;

        return (
          <path
            key={line.id}
            d={`M ${line.startX} ${line.startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${line.endX} ${line.endY}`}
            fill="none"
            stroke="#1f2937"
            strokeWidth="4"
            strokeDasharray="8,8"
            markerEnd="url(#arrowhead)"
          />
        );
      })}
    </svg>
  );
};

export const OverviewCanvasPage: React.FC = () => {
  return (
    <div
      id="canvas-container"
      className="w-screen h-screen overflow-auto bg-gray-200 relative font-sans"
    >
      <div className="absolute top-4 left-4 bg-gray-800 text-white px-4 py-2 font-bold z-50 shadow-lg border-2 border-white flex items-center gap-4">
        <span>ClaimPilot India - Interactive Wireframe Canvas (Scroll to pan)</span>
      </div>

      <div className="relative" style={{ width: 8000, height: 6000 }}>
        <ArrowsOverlay connections={connections} />

        {/* Col 1 */}
        <div className="absolute top-[100px] left-[100px]">
          <Screen1 />
        </div>

        {/* Col 2 */}
        <div className="absolute top-[100px] left-[1300px]">
          <Screen2 />
        </div>

        {/* Col 3 */}
        <div className="absolute top-[100px] left-[2500px]">
          <Screen3 />
        </div>
        <div className="absolute top-[950px] left-[2500px]">
          <Screen4 />
        </div>
        <div className="absolute top-[1800px] left-[2500px]">
          <Screen5 />
        </div>
        <div className="absolute top-[2650px] left-[2500px]">
          <Screen7 />
        </div>
        <div className="absolute top-[3500px] left-[2500px]">
          <Screen8 />
        </div>
        <div className="absolute top-[4350px] left-[2500px]">
          <Screen9 />
        </div>

        {/* Col 4 */}
        <div className="absolute top-[100px] left-[3700px]">
          <Screen3A />
        </div>
        <div className="absolute top-[950px] left-[3700px]">
          <Screen12 />
        </div>
        <div className="absolute top-[1800px] left-[3700px]">
          <Screen13 />
        </div>
        <div className="absolute top-[2650px] left-[3700px]">
          <Screen16 />
        </div>
        <div className="absolute top-[3500px] left-[3700px]">
          <Screen10 />
        </div>

        {/* Col 5 */}
        <div className="absolute top-[100px] left-[4900px]">
          <Screen6 />
        </div>
        <div className="absolute top-[2650px] left-[4900px]">
          <Screen15 />
        </div>

        {/* Col 6 */}
        <div className="absolute top-[100px] left-[6100px]">
          <Screen11 />
        </div>
        <div className="absolute top-[950px] left-[6100px]">
          <Screen14 />
        </div>
      </div>
    </div>
  );
};
