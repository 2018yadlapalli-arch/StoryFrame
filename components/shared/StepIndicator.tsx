'use client';

const STEPS = [
  { label: 'Upload',  description: 'Choose your image', icon: '↑' },
  { label: 'Studio',  description: 'Edit your story',   icon: '✦' },
  { label: 'Preview', description: 'Watch & download',  icon: '▶' },
];

export default function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0 mb-10 animate-fade-in">
      {STEPS.map((step, i) => {
        const num  = i + 1;
        const done   = num < currentStep;
        const active = num === currentStep;

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              {/* Step circle */}
              <div className="relative">
                {/* Expanding ring on active */}
                {active && (
                  <span className="absolute inset-0 rounded-full animate-ring-expand"
                    style={{ background: 'rgba(249,115,22,0.4)' }} />
                )}
                <div
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                    transition-all duration-500 select-none
                    ${done
                      ? 'text-white'
                      : active
                      ? 'text-white ring-2 ring-brand-400/60 ring-offset-2 ring-offset-gray-950'
                      : 'bg-gray-800 text-gray-600'
                    }`}
                  style={
                    done
                      ? { background: 'linear-gradient(135deg,#f97316,#fbbf24)' }
                      : active
                      ? { background: 'linear-gradient(135deg,#ea580c,#f97316)', boxShadow: '0 0 16px rgba(249,115,22,0.5)' }
                      : {}
                  }
                >
                  {done ? '✓' : step.icon}
                </div>
              </div>

              {/* Labels */}
              <div className="text-center hidden sm:block">
                <p className={`text-xs font-semibold transition-colors duration-300 ${
                  active ? 'text-white' : done ? 'text-brand-500' : 'text-gray-600'
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-700">{step.description}</p>
              </div>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-3 relative overflow-hidden rounded-full bg-gray-800">
                {done && (
                  <div
                    className="absolute inset-0 animate-progress-shine rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #ea580c, #f97316, #fbbf24, #f97316, #ea580c)',
                      backgroundSize: '200% 100%',
                    }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
