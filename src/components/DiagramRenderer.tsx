import React from 'react';
import { DiagramSpec } from '../types/game';

interface Props {
  diagram: DiagramSpec;
}

function renderShapeSvg(shape: 'circle' | 'triangle' | 'square', color: string, size = 20) {
  if (shape === 'circle') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" fill={color} />
      </svg>
    );
  }
  if (shape === 'square') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="2.5" fill={color} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <polygon points="12,3 21,20 3,20" fill={color} />
    </svg>
  );
}

export const DiagramRenderer: React.FC<Props> = ({ diagram }) => {
  if (diagram.type === 'sequence') {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2">
        {diagram.items.map((item, idx) => {
          const isLast = diagram.highlightLast && idx === diagram.items.length - 1;
          return (
            <div
              key={idx}
              className={`font-mono text-sm px-3 py-2 rounded-lg tabular-nums ${
                isLast
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40 font-semibold'
                  : 'bg-slate-800/80 text-slate-200'
              }`}
            >
              {item}
            </div>
          );
        })}
      </div>
    );
  }

  if (diagram.type === 'shape-matrix') {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto">
          {diagram.rows.flatMap((row, rIdx) =>
            row.map((cell, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`h-20 rounded-lg flex items-center justify-center gap-1.5 border ${
                  cell
                    ? 'bg-slate-800/90 border-slate-700'
                    : 'bg-sky-500/10 border-sky-400/60 border-dashed'
                }`}
              >
                {cell ? (
                  Array.from({ length: cell.count }).map((_, i) => (
                    <span key={i}>{renderShapeSvg(cell.shape, cell.color, 20)}</span>
                  ))
                ) : (
                  <span className="font-mono text-lg font-bold text-sky-300">?</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (diagram.type === 'binary-leds') {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
        {diagram.groups.map((grp, idx) => (
          <div key={idx} className="flex items-center justify-between bg-slate-800/70 rounded-lg px-3 py-2">
            <span className="text-xs font-medium text-slate-300">{grp.label}</span>
            <div className="flex items-center gap-2.5">
              {grp.bits.map((bit, bIdx) => (
                <div key={bIdx} className="flex flex-col items-center gap-0.5">
                  <span
                    className={`w-5 h-5 rounded-full border ${
                      bit === 1
                        ? 'bg-emerald-400 border-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                        : 'bg-slate-700 border-slate-600'
                    }`}
                  />
                  <span className="font-mono text-[11px] text-slate-400">{bit}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="text-xs font-mono text-slate-400 pt-1">{diagram.note}</p>
      </div>
    );
  }

  if (diagram.type === 'packet-table') {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                {diagram.headers.map((h) => (
                  <th key={h} className="py-2 px-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {diagram.rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-800/80 text-slate-200">
                  {row.cells.map((c, i) => (
                    <td key={i} className="py-2 px-2.5">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-2">
          {diagram.ruleSummary}
        </p>
      </div>
    );
  }

  if (diagram.type === 'robot-grid') {
    const cells: React.ReactNode[] = [];
    for (let r = 0; r < diagram.size; r++) {
      for (let c = 0; c < diagram.size; c++) {
        const isStart = diagram.start[0] === r && diagram.start[1] === c;
        const isGoal = diagram.goal[0] === r && diagram.goal[1] === c;
        const isObs = diagram.obstacles.some(([or, oc]) => or === r && oc === c);

        cells.push(
          <div
            key={`${r}-${c}`}
            className={`h-14 rounded-lg border flex flex-col items-center justify-center text-xs font-mono ${
              isObs
                ? 'bg-slate-700 border-slate-600 text-slate-400'
                : isGoal
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                : isStart
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            {isStart && <span>S (→)</span>}
            {isGoal && <span>G 목표</span>}
            {isObs && <span>■ 장애물</span>}
            {!isStart && !isGoal && !isObs && (
              <span className="text-[10px] text-slate-500">
                ({r},{c})
              </span>
            )}
          </div>
        );
      }
    }
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2">
        <div
          className="grid gap-2 max-w-xs mx-auto"
          style={{ gridTemplateColumns: `repeat(${diagram.size}, minmax(0, 1fr))` }}
        >
          {cells}
        </div>
        <p className="text-xs text-slate-400 text-center">
          시작 위치 S(0,0)에서 오른쪽(→)을 바라보고 있습니다.
        </p>
      </div>
    );
  }

  if (diagram.type === 'network-graph') {
    const nodeMap = new Map(diagram.nodes.map((n) => [n.id, n]));
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3">
        <svg viewBox="0 0 400 190" className="w-full h-44">
          {diagram.edges.map((edge, idx) => {
            const from = nodeMap.get(edge.from);
            const to = nodeMap.get(edge.to);
            if (!from || !to) return null;
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            return (
              <g key={idx}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#475569"
                  strokeWidth="2.5"
                />
                <circle cx={mx} cy={my} r="11" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                <text
                  x={mx}
                  y={my + 4}
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                >
                  {edge.weight}
                </text>
              </g>
            );
          })}
          {diagram.nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill={node.required ? '#4f46e5' : '#1e293b'}
                stroke={node.required ? '#a5b4fc' : '#38bdf8'}
                strokeWidth="2.5"
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="11"
                fontWeight="700"
              >
                {node.label || node.id}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  if (diagram.type === 'code-block') {
    return (
      <div className="bg-slate-950 border border-slate-700 rounded-xl p-3.5 font-mono text-xs overflow-x-auto">
        <div className="text-[11px] text-slate-400 pb-2 mb-2 border-b border-slate-800">
          {diagram.language}
        </div>
        <div className="space-y-1">
          {diagram.lines.map((ln) => (
            <div key={ln.num} className="flex items-start gap-3 leading-relaxed">
              <span className="w-5 text-right text-slate-500 select-none shrink-0 tabular-nums">
                {ln.num}
              </span>
              <pre className="text-slate-100 whitespace-pre">{ln.code}</pre>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (diagram.type === 'logic-cards') {
    return (
      <div className="space-y-2.5">
        {diagram.cards.map((card, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2">
            <div className="text-xs font-semibold text-sky-300">{card.title}</div>
            <ul className="space-y-1.5 text-xs text-slate-200 leading-relaxed">
              {card.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return null;
};
