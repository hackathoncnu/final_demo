interface Props {
  current: 1 | 2 | 3
  steps: { label: string }[]
}

export default function StepIndicator({ current, steps }: Props) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-start justify-between">
        {steps.map((step, idx) => {
          const num = idx + 1
          const isActive = num === current
          const isCompleted = num < current
          return (
            <div key={num} className="flex items-start flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-card scale-110'
                      : isCompleted
                      ? 'bg-secondary text-white'
                      : 'bg-border-warm text-text-muted'
                  }`}
                >
                  {isCompleted ? '✓' : num}
                </div>
                <span
                  className={`mt-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                    isActive ? 'text-primary' : isCompleted ? 'text-secondary' : 'text-text-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 sm:mx-4 mt-5 rounded transition-colors ${
                    isCompleted ? 'bg-secondary' : 'bg-border-warm'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
