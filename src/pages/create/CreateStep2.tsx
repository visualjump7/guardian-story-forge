import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, StoryKind } from '@/contexts/StoryConfigContext';
import { CreateProgressBar } from '@/components/create/CreateProgressBar';

interface StoryKindOption {
  id: StoryKind;
  label: string;
  image: string;
  video: string;
  borderColor: string;
  borderColorSelected: string;
  labelColor: string;
  labelColorSelected: string;
  glowRgb: string;
}

const STORY_KINDS: StoryKindOption[] = [
  {
    id: 'Action',
    label: 'Action',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fbd7079eb565f486b952b669c06ab277c?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F05ee7d40af3a4fc6ae70af4ee38a48e2?alt=media&token=001e8311-7afc-4bfd-b443-99bbb8875fa2&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#FFE500',
    borderColorSelected: '#FFE500',
    labelColor: '#CCB700',
    labelColorSelected: '#CCB700',
    glowRgb: '255 229 0'
  },
  {
    id: 'Agent',
    label: 'Agent',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fff79eb9a3bf4450ca01ad00b847c0952?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fe6b3d6ab91924be18fa8ebf382bd1be8?alt=media&token=47f81526-faac-42ec-9f9f-fd4d718c9631&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#6C2C2A',
    borderColorSelected: '#6C2C2A',
    labelColor: '#CFCFCF',
    labelColorSelected: '#CFCFCF',
    glowRgb: '108 44 42'
  },
  {
    id: 'Fantasy',
    label: 'Fantasy',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F122fba98f46947d7b7c96148ef5336de?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F5999a21ef6df44229c6270aa4a69c349?alt=media&token=62264ada-ee30-4b3c-8370-61a6db8906e0&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#005AFF',
    borderColorSelected: '#005AFF',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF',
    glowRgb: '0 90 255'
  },
  {
    id: 'Fairy Tale',
    label: 'Fairy Tale',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F665ef22f220243dda0cd115009df4363?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F083550454ac24a68abc7760fb0ef4cfc?alt=media&token=6e6efc47-5b88-451d-846c-369aefcf1b90&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#9994F8',
    borderColorSelected: '#9994F8',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF',
    glowRgb: '153 148 248'
  },
  {
    id: 'Explorer',
    label: 'Explorer',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fd3159d17d9124bfca8fdaa7126943dc7?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F640f6f3009fb4f87a5c9c0ff53c1a985?alt=media&token=a4bd8cee-782d-4904-8469-24d5d5c78f2b&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#94F8B4',
    borderColorSelected: '#94F8B4',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF',
    glowRgb: '148 248 180'
  },
  {
    id: 'Superhero',
    label: 'Superhero',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Faa9a4f32bff54b18afb69b21e66290d9?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F2f709bfa39d3454a8cdea75ae79d5bf5?alt=media&token=c73c9e38-5b61-4b9f-84fe-bb08fdfd99a4&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#E62222',
    borderColorSelected: '#E62222',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF',
    glowRgb: '230 34 34'
  },
];

export default function CreateStep2() {
  const navigate = useNavigate();
  const { storyConfig, setStoryKind } = useStoryConfig();
  const [selectedKind, setSelectedKind] = useState<StoryKind | null>(storyConfig.storyKind);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('.choice-btn');
      if (!btn || !wrapper.contains(btn)) return;

      wrapper.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      wrapper.classList.add('dim-others', 'choices');

      btn.classList.remove('is-active');
      void (btn as HTMLElement).offsetWidth;
      btn.classList.add('is-active');

      wrapper.querySelectorAll('.choice-btn').forEach(b =>
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false')
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const btn = (e.target as HTMLElement).closest('.choice-btn');
      if (!btn || !wrapper.contains(btn)) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        (btn as HTMLElement).click();
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (kind: StoryKind, image: string) => {
    setSelectedKind(kind);
    setStoryKind(kind, image);
  };

  const handleKeyPress = (e: React.KeyboardEvent, kind: StoryKind, image: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(kind, image);
    }
  };

  const handleNextStep = () => {
    if (selectedKind) {
      navigate('/create/03');
    }
  };

  const handleProgressBarClick = (stepNumber: number) => {
    if (stepNumber === 1) {
      navigate('/create/01');
    } else if (stepNumber === 2) {
      navigate('/create/02');
    }
  };

  const handleBack = () => {
    navigate('/create/01');
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col relative">
      <div className="flex-1 flex flex-col px-4 md:px-8 lg:px-12 py-8">
        <div className="flex-1 flex items-center gap-8">
          <div className="w-full lg:w-auto flex flex-col flex-shrink-0">
            <h1 className="font-aoboshi text-lg md:text-xl lg:text-2xl text-white" style={{ marginBottom: '25px' }}>
              What kind of story?
            </h1>

            <div ref={wrapperRef} data-choices className="choices grid grid-cols-2 gap-4 lg:gap-6" style={{ width: '300px', maxWidth: '100%' }}>
            {STORY_KINDS.map((kind) => {
              const isSelected = selectedKind === kind.id;

              return (
                <button
                  key={kind.id}
                  onClick={() => handleSelect(kind.id, kind.image)}
                  onKeyPress={(e) => handleKeyPress(e, kind.id, kind.image)}
                  className={`choice-btn relative w-full aspect-square group focus:outline-none focus:ring-2 focus:ring-white/50 rounded-[19px] ${isSelected ? 'is-selected' : ''}`}
                  aria-pressed={isSelected}
                  style={{
                    filter: isSelected
                      ? 'none'
                      : 'brightness(0.7)',
                    transition: 'filter 0.3s ease',
                    '--fx': kind.glowRgb
                  } as React.CSSProperties}
                >
                  <div
                    className="w-full h-full rounded-[19px] overflow-hidden relative"
                    style={{
                      border: `5px solid ${isSelected ? kind.borderColorSelected : kind.borderColor}`,
                      boxShadow: isSelected
                        ? '4px 11px 4px 0 rgba(0, 0, 0, 0.25) inset, 0 4px 4px 0 rgba(0, 0, 0, 0.25)'
                        : 'none'
                    }}
                  >
                    <img
                      src={kind.image}
                      alt={kind.label}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute bottom-2 left-2 right-2">
                      <span
                        className="font-inter text-base lg:text-xl font-bold"
                        style={{
                          color: isSelected ? kind.labelColorSelected : kind.labelColor,
                          textShadow: kind.id === 'Fantasy' && isSelected
                            ? '0 0 1px #005AFF, 0 0 1px #005AFF'
                            : kind.id === 'Superhero' && isSelected
                            ? '0 0 1px rgba(0, 0, 0, 0.2)'
                            : '0 1px 2.3px rgba(0, 0, 0, 0.25)'
                        }}
                      >
                        {kind.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            </div>
          </div>

          <div className="hidden lg:flex flex-1 flex-col items-center justify-center gap-6">
          <div
            className="w-full aspect-square bg-gradient-to-br from-gray-900 to-black rounded-lg border border-white/10 flex items-center justify-center overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 400px)' }}
          >
            {selectedKind ? (
              <video
                key={selectedKind}
                src={STORY_KINDS.find(k => k.id === selectedKind)?.video}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <p className="text-white/60 text-lg font-inter">
                  Select a story kind to preview
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 w-full max-w-md">
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all"
              style={{
                border: '4px solid #AA00B0',
                background: 'rgba(9, 9, 9, 0.82)',
                minWidth: '180px',
                height: '80px',
              }}
              aria-label="Go back"
            >
              <svg
                width="43"
                height="43"
                viewBox="0 0 50 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M43.4347 35.5C39.6884 41.9762 32.6864 46.3333 24.6667 46.3333C12.7005 46.3333 3 36.6328 3 24.6667C3 12.7005 12.7005 3 24.6667 3C32.6864 3 39.6884 7.35715 43.4347 13.8333M24.6668 16L16.0001 24.6667M16.0001 24.6667L24.6668 33.3333M16.0001 24.6667H46.3335"
                  stroke="#EDEAEA"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className="font-inter text-4xl font-bold"
                style={{ color: '#F6F6F6' }}
              >
                Back
              </span>
            </button>

            <button
              onClick={handleNextStep}
              disabled={!selectedKind}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all"
              style={{
                border: selectedKind ? '4px solid #20B000' : '4px solid #3C3C3C',
                background: 'rgba(9, 9, 9, 0.82)',
                minWidth: '180px',
                height: '80px',
                opacity: selectedKind ? 1 : 0.5,
              }}
            >
              <span
                className="font-inter text-4xl font-bold"
                style={{
                  color: '#F6F6F6',
                  WebkitTextStroke: selectedKind ? '1px #20B000' : 'none',
                }}
              >
                Next
              </span>
              <svg
                width="37"
                height="28"
                viewBox="0 0 45 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M4 17.75H40.6667M40.6667 17.75L26.9167 4M40.6667 17.75L26.9167 31.5"
                  stroke="#FAFAFA"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden flex flex-col gap-4 px-4 pb-4">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all flex-1"
            style={{
              border: '4px solid #AA00B0',
              background: 'rgba(9, 9, 9, 0.82)',
              maxWidth: '180px',
              height: '70px',
            }}
            aria-label="Go back"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 50 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M43.4347 35.5C39.6884 41.9762 32.6864 46.3333 24.6667 46.3333C12.7005 46.3333 3 36.6328 3 24.6667C3 12.7005 12.7005 3 24.6667 3C32.6864 3 39.6884 7.35715 43.4347 13.8333M24.6668 16L16.0001 24.6667M16.0001 24.6667L24.6668 33.3333M16.0001 24.6667H46.3335"
                stroke="#EDEAEA"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="font-inter text-2xl font-bold"
              style={{ color: '#F6F6F6' }}
            >
              Back
            </span>
          </button>

          <button
            onClick={handleNextStep}
            disabled={!selectedKind}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all flex-1"
            style={{
              border: selectedKind ? '4px solid #20B000' : '4px solid #3C3C3C',
              background: 'rgba(9, 9, 9, 0.82)',
              maxWidth: '180px',
              height: '70px',
              opacity: selectedKind ? 1 : 0.5,
            }}
          >
            <span
              className="font-inter text-2xl font-bold"
              style={{
                color: '#F6F6F6',
                WebkitTextStroke: selectedKind ? '1px #20B000' : 'none',
              }}
            >
              Next
            </span>
            <svg
              width="28"
              height="21"
              viewBox="0 0 45 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M4 17.75H40.6667M40.6667 17.75L26.9167 4M40.6667 17.75L26.9167 31.5"
                stroke="#FAFAFA"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="pb-8">
        <CreateProgressBar currentStep={2} onStepClick={handleProgressBarClick} />
      </div>
    </div>
  );
}
