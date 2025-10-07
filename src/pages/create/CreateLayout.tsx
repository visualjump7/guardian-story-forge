import { Outlet } from 'react-router-dom';
import { StoryConfigProvider } from '@/contexts/StoryConfigContext';
import { AppHeader } from '@/components/AppHeader';

export const CreateLayout = () => {
  return (
    <StoryConfigProvider>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container max-w-4xl mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
    </StoryConfigProvider>
  );
};
