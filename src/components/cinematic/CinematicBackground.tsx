interface CinematicBackgroundProps {
  backgroundImage?: string | null;
}

export const CinematicBackground = ({ backgroundImage }: CinematicBackgroundProps = {}) => {
  return (
    <>
      {/* Pure black base */}
      <div className="fixed inset-0 z-[-3] bg-black" />
      
      {/* Story cover image - blurred and darkened */}
      {backgroundImage && (
        <div 
          className="fixed inset-0 z-[-2] opacity-50"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(40px)',
          }}
        />
      )}
      
      {/* Fallback gradient if no image */}
      {!backgroundImage && (
        <div className="fixed inset-0 z-[-2] bg-gradient-to-br from-warmth-100 via-warmth-200 to-warmth-300" />
      )}
      
      {/* Dark overlay for extra depth */}
      <div className="fixed inset-0 z-[-1] bg-black/30" />
      
      {/* Subtle noise texture */}
      <div 
        className="fixed inset-0 z-[-1] opacity-[0.03] mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      />
    </>
  );
};
