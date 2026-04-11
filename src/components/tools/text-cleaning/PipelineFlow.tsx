// ============================================================
// 流水线连线 + 箭头动画
// ============================================================

interface Props {
  nodeCount: number;
}

export default function PipelineFlow({ nodeCount }: Props) {
  if (nodeCount < 2) return null;

  return (
    <div className="flex items-center gap-0 pointer-events-none" aria-hidden>
      {Array.from({ length: nodeCount - 1 }, (_, i) => (
        <div key={i} className="flex items-center w-6 flex-shrink-0">
          <div className="relative w-full h-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 dark:from-teal-600 dark:to-cyan-600 overflow-hidden rounded">
            {/* Animated particle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal-400 dark:bg-teal-300 animate-flow-particle"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          </div>
          <svg className="w-2 h-2 text-cyan-400 dark:text-cyan-600 -ml-px flex-shrink-0" viewBox="0 0 8 8">
            <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
          </svg>
        </div>
      ))}
      {/* CSS animation injected via style tag */}
      <style>{`
        @keyframes flow-particle {
          0% { left: -4px; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { left: calc(100% + 4px); opacity: 0; }
        }
        .animate-flow-particle {
          animation: flow-particle 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
