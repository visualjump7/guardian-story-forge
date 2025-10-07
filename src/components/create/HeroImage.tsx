import heroImage from '@/assets/hero-cauldron.jpg';

export const HeroImage = () => {
  return (
    <div className="w-full overflow-hidden rounded-2xl mb-8">
      <img
        src={heroImage}
        alt="Magic cauldron with swirling colors"
        className="w-full h-48 md:h-64 object-cover"
      />
    </div>
  );
};
