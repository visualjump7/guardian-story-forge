export const CinematicBackground = () => {
  return (
    <>
      <div className="fixed inset-0 z-[-2] bg-gradient-to-br from-warmth-100 via-warmth-200 to-warmth-300" />
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_50%_50%,transparent_40%,rgba(0,0,0,0.4)_100%)]" />
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
