interface CreateProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick?: (stepNumber: number) => void;
  completedSteps?: number[];
}

export const CreateProgressBar = ({
  currentStep,
  totalSteps = 4,
  onStepClick,
  completedSteps = []
}: CreateProgressBarProps) => {
  const handleStepClick = (stepNumber: number) => {
    // Only allow navigation to completed steps or current step
    if (stepNumber <= currentStep && onStepClick) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="relative flex items-center justify-between">
        {/* Progress line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#3C3C3C] -translate-y-1/2 mx-5" />

        {/* Progress dots */}
        <div className="relative flex justify-between w-full">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isPassed = stepNumber < currentStep;
            const isClickable = stepNumber <= currentStep;

            return (
              <button
                key={stepNumber}
                onClick={() => handleStepClick(stepNumber)}
                disabled={!isClickable}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive || isPassed
                    ? 'bg-[#FFAE00]'
                    : 'bg-[#3C3C3C]'
                } ${
                  isClickable
                    ? 'cursor-pointer hover:scale-110'
                    : 'cursor-not-allowed'
                }`}
                aria-label={`Step ${stepNumber}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
