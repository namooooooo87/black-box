import { DiagramSpec } from '../types/game';

export function formatDiagramSummary(diagram?: DiagramSpec): string {
  if (!diagram) return '';

  switch (diagram.type) {
    case 'sequence':
      return `시퀀스 자료: ${diagram.items.join(' | ')}`;
    case 'shape-matrix':
      return (
        '3x3 도형 표:\n' +
        diagram.rows
          .map((row, rIdx) =>
            `${rIdx + 1}행: ` +
            row
              .map((cell) =>
                cell ? `${cell.shape}(${cell.count}개)` : '[빈칸]'
              )
              .join(', ')
          )
          .join('\n')
      );
    case 'binary-leds':
      return (
        `이진수 LED(${diagram.note}): ` +
        diagram.groups.map((g) => `${g.label}=[${g.bits.join('')}]`).join(', ')
      );
    case 'packet-table':
      return (
        `${diagram.ruleSummary}\n` +
        diagram.rows.map((r) => r.cells.join(' / ')).join('\n')
      );
    case 'robot-grid':
      return `${diagram.size}x${diagram.size} 격자, 시작=[${diagram.start.join(',')}], 도착=[${diagram.goal.join(',')}], 시작방향=${diagram.startDir}, 장애물=${diagram.obstacles
        .map((o) => `[${o.join(',')}]`)
        .join(', ')}`;
    case 'network-graph':
      return (
        `노드: ${diagram.nodes.map((n) => n.label || n.id).join(', ')} / 간선: ` +
        diagram.edges.map((e) => `${e.from}-${e.to}(${e.weight})`).join(', ')
      );
    case 'code-block':
      return (
        `코드(${diagram.language}):\n` +
        diagram.lines.map((l) => `${l.num}: ${l.code}`).join('\n')
      );
    case 'logic-cards':
      return diagram.cards
        .map((c) => `[${c.title}] ${c.items.join(' / ')}`)
        .join('\n');
    default:
      return '';
  }
}

export function buildFallbackGuideReply(
  hints: [string, string, string],
  hintsUsed: number
): string {
  // Respect progressive disclosure: if no hint tier unlocked yet, only use Hint 1 (direction).
  const safeTierIndex = hintsUsed <= 0 ? 0 : Math.min(hintsUsed - 1, 2);
  const chosenHint = hints[safeTierIndex] || hints[0];
  return [
    `[저장된 기본 힌트 ${safeTierIndex + 1}단계 기반 안내]`,
    chosenHint,
    '이 단서를 바탕으로 첫 번째 조건부터 직접 차근차근 확인해 볼까요?',
  ].join('\n\n');
}
