import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, ArtStyle } from '@/contexts/StoryConfigContext';
import { CreateProgressBar } from '@/components/create/CreateProgressBar';


interface ArtStyleOption {
  id: ArtStyle;
  label: string;
  image: string;
  video: string;
  borderColor: string;
  borderColorSelected: string;
  labelColor: string;
  labelColorSelected: string;
  textStroke?: string;
  glowRgb: string;
}

const ART_STYLES: ArtStyleOption[] = [
  {
    id: '3d',
    label: '3D',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F16edfe3c6c73459b9ab5368fbb923c75?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fc953e5b4b29d40e88402e7c0ea60776a?alt=media&token=7dad06de-8362-493a-a602-57f638385e48&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#FFE500',
    borderColorSelected: '#FFE500',
    labelColor: '#CCB700',
    labelColorSelected: '#CCB700',
    glowRgb: '255 229 0'
  },
  {
    id: 'illustration',
    label: 'Illustration',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F5f2af9c10240431a8247ec89c5ee4ce7?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F3148101fb6554ec581f7ba4811ebd6d5?alt=media&token=d8ae7d21-6131-42ee-8a08-22d22b77c01f&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#C03B1A',
    borderColorSelected: '#C03B1A',
    labelColor: '#968F96',
    labelColorSelected: '#968F96',
    textStroke: '0.5px #000',
    glowRgb: '192 59 26'
  },
  {
    id: 'storybook',
    label: 'Storybook',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F757814de85294fdca888501150ff1f5c?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F4a42e0db7ad4411fba3d36f52abcd470?alt=media&token=2cb03442-e724-41e7-aa3e-caee9a89de3a&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#005AFF',
    borderColorSelected: '#005AFF',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF',
    textStroke: '1px #005AFF',
    glowRgb: '0 90 255'
  },
  {
    id: 'clay',
    label: 'Clay',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F25cfc0907f2440f19942447593a6bb76?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F10646c7670c04a568b31b5cdc6dab996?alt=media&token=5cd081ac-55a7-4641-a1be-7a8ca97e1dce&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#9994F8',
    borderColorSelected: '#9994F8',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF',
    textStroke: '1px #9994F8',
    glowRgb: '153 148 248'
  },
  {
    id: 'black-white',
    label: 'Black & White',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F175624b63f8f4a51877fa57f93ad3576?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F5cc564acfa2a4601b166f124e8a67e1f?alt=media&token=c914b815-46c9-4dd9-99dc-eea9c7e3d751&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#94F8B4',
    borderColorSelected: '#94F8B4',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF',
    glowRgb: '148 248 180'
  },
  {
    id: 'anime',
    label: 'Anime',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F7896f021f42d46359289cfebfc5eaab8?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F0de9291ad6f24028abd921b3ceed3f7c?alt=media&token=746f9b6f-fd40-4a01-ac18-65443a89deaf&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#E62222',
    borderColorSelected: '#E62222',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF',
    textStroke: '1px rgba(0, 0, 0, 0.2)',
    glowRgb: '230 34 34'
  },
];

export const CreateStep3 = () => {
  const navigate = useNavigate();
  const { storyConfig, setArtStyle } = useStoryConfig();
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle | null>(storyConfig.artStyle);
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

  const handleSelect = (style: ArtStyle, image: string) => {
    setSelectedStyle(style);
    setArtStyle(style, image);
  };

  const handleKeyPress = (e: React.KeyboardEvent, style: ArtStyle, image: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(style, image);
    }
  };

  const handleNextStep = () => {
    if (selectedStyle) {
      navigate('/create/04');
    }
  };

  const handleProgressBarClick = (stepNumber: number) => {
    if (stepNumber === 1) {
      navigate('/create/01');
    } else if (stepNumber === 2) {
      navigate('/create/02');
    } else if (stepNumber === 3) {
      navigate('/create/03');
    } else if (stepNumber === 4 && selectedStyle) {
      handleNextStep();
    }
  };

  const handleBack = () => {
    navigate('/create/02');
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col relative">
      <div className="flex-1 flex flex-col px-4 md:px-8 lg:px-12 py-8">
        <div className="flex-1 flex items-center gap-8">
          <div className="w-full lg:w-auto flex flex-col flex-shrink-0">
            <h1 className="font-aoboshi text-lg md:text-xl lg:text-2xl text-white" style={{ marginBottom: '25px' }}>
              Choose your art style.
            </h1>

            <div ref={wrapperRef} data-choices className="choices grid grid-cols-2 gap-4 lg:gap-6" style={{ width: '300px', maxWidth: '100%' }}>
            {ART_STYLES.map((artStyle) => {
              const isSelected = selectedStyle === artStyle.id;

              return (
                <button
                  key={artStyle.id}
                  onClick={() => handleSelect(artStyle.id, artStyle.image)}
                  onKeyPress={(e) => handleKeyPress(e, artStyle.id, artStyle.image)}
                  className={`choice-btn relative w-full aspect-square group focus:outline-none focus:ring-2 focus:ring-white/50 rounded-[19px] ${isSelected ? 'is-selected' : ''}`}
                  aria-pressed={isSelected}
                  style={{
                    filter: isSelected
                      ? 'none'
                      : 'brightness(0.7)',
                    transition: 'filter 0.3s ease',
                    '--fx': artStyle.glowRgb
                  } as React.CSSProperties}
                >
                  <div
                    className="w-full h-full rounded-[19px] overflow-hidden relative"
                    style={{
                      border: `5px solid ${isSelected ? artStyle.borderColorSelected : artStyle.borderColor}`,
                      boxShadow: isSelected
                        ? '4px 11px 4px 0 rgba(0, 0, 0, 0.25) inset, 0 4px 4px 0 rgba(0, 0, 0, 0.25)'
                        : 'none'
                    }}
                  >
                    <img
                      src={artStyle.image}
                      alt={artStyle.label}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute bottom-2 left-2 right-2">
                      <span
                        className="font-inter text-base lg:text-xl font-bold"
                        style={{
                          color: isSelected ? artStyle.labelColorSelected : artStyle.labelColor,
                          textShadow: artStyle.id === 'illustration' && isSelected
                            ? '0 1px 2.3px rgba(0, 0, 0, 0.25)'
                            : undefined,
                          WebkitTextStroke: artStyle.textStroke && isSelected ? artStyle.textStroke : undefined
                        }}
                      >
                        {artStyle.label}
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
            {selectedStyle ? (
              <video
                key={selectedStyle}
                src={ART_STYLES.find(s => s.id === selectedStyle)?.video}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                onError={(e) => console.error('Video failed to load:', ART_STYLES.find(s => s.id === selectedStyle)?.video, e)}
              />
            ) : (
              <div className="text-center">
                <p className="text-white/60 text-lg font-inter">
                  Select an art style to preview
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
              disabled={!selectedStyle}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all"
              style={{
                border: selectedStyle ? '4px solid #20B000' : '4px solid #3C3C3C',
                background: 'rgba(9, 9, 9, 0.82)',
                minWidth: '180px',
                height: '80px',
                opacity: selectedStyle ? 1 : 0.5,
              }}
            >
              <span
                className="font-inter text-4xl font-bold"
                style={{
                  color: '#F6F6F6',
                  WebkitTextStroke: selectedStyle ? '1px #20B000' : 'none',
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
            disabled={!selectedStyle}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all flex-1"
            style={{
              border: selectedStyle ? '4px solid #20B000' : '4px solid #3C3C3C',
              background: 'rgba(9, 9, 9, 0.82)',
              maxWidth: '180px',
              height: '70px',
              opacity: selectedStyle ? 1 : 0.5,
            }}
          >
            <span
              className="font-inter text-2xl font-bold"
              style={{
                color: '#F6F6F6',
                WebkitTextStroke: selectedStyle ? '1px #20B000' : 'none',
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
        <CreateProgressBar currentStep={3} onStepClick={handleProgressBarClick} />
      </div>
    </div>
  );
};
