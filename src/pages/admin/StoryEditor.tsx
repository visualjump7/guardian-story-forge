import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ImagePromptDialog } from '@/components/ImagePromptDialog';

interface ImageSlotProps {
  label: string;
  imageType: 'cover' | 'mid-scene' | 'ending';
  imageInfo: { existingUrl: string | null };
  onGenerateClick: () => void;
  isGenerating: boolean;
}

const ImageSlot = ({ 
  label, 
  imageType, 
  imageInfo, 
  onGenerateClick,
  isGenerating
}: ImageSlotProps) => {
  const hasImage = imageInfo.existingUrl;
  const displayImage = imageInfo.existingUrl;

  return (
    <div className="space-y-2">
      <Label className="text-sm sm:text-base">{label}</Label>
      <div className="border-2 border-dashed border-gray-700 rounded-lg overflow-hidden">
        {/* Image Display */}
        <div className="relative w-full h-56 sm:h-48">
          {displayImage ? (
            <img
              src={displayImage}
              alt={`${label} preview`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <span className="text-gray-600 text-base sm:text-lg font-medium">Story Image</span>
            </div>
          )}
        </div>

        {/* AI Generation Button Only */}
        <div className="p-3 bg-gray-900">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 h-10 sm:h-9"
            onClick={onGenerateClick}
            disabled={isGenerating}
            type="button"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {hasImage ? 'Regenerate' : 'Generate'} Image
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function StoryEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [imageData, setImageData] = useState<{
    cover: { existingUrl: string | null };
    'mid-scene': { existingUrl: string | null };
    ending: { existingUrl: string | null };
  }>({
    cover: { existingUrl: null },
    'mid-scene': { existingUrl: null },
    ending: { existingUrl: null }
  });

  const [generatingImage, setGeneratingImage] = useState<{
    type: 'cover' | 'mid-scene' | 'ending' | null;
    isOpen: boolean;
  }>({ type: null, isOpen: false });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState<'express' | 'studio'>('express');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    hero_name: '',
    story_universe: '',
    age_range: '',
    story_type: '',
    cover_image_url: '',
    media_url: '',
    content_type: 'text',
    art_style: 'pixar-3d',
  });

  useEffect(() => {
    if (id) {
      loadStory();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadStory = async () => {
    if (!id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Failed to load story');
      navigate('/admin/stories');
      return;
    }

    setFormData({
      title: data.title || '',
      content: data.content || '',
      excerpt: data.excerpt || '',
      hero_name: data.hero_name || '',
      story_universe: data.story_universe || '',
      age_range: data.age_range || '',
      story_type: data.story_type || '',
      cover_image_url: data.cover_image_url || '',
      media_url: data.media_url || '',
      content_type: data.content_type || 'text',
      art_style: data.art_style || 'pixar-3d',
    });

    // Load existing story images
    const { data: imagesData } = await supabase
      .from('story_images')
      .select('*')
      .eq('story_id', id)
      .order('created_at', { ascending: true });

    if (imagesData) {
      const newImageData = { ...imageData };
      
      imagesData.forEach(img => {
        if (img.image_type === 'cover' || img.image_type === 'mid-scene' || img.image_type === 'ending') {
          newImageData[img.image_type] = {
            existingUrl: img.image_url
          };
        }
      });
      
      setImageData(newImageData);
    }

    setLoading(false);
  };


  const handleGenerateImage = async (imageType: 'cover' | 'mid-scene' | 'ending', customizations: string) => {
    if (!id) {
      toast.error('Please save the story first before generating images');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-story-image', {
        body: {
          storyId: id,
          imageType: imageType,
          customizations: customizations
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setImageData(prev => ({
          ...prev,
          [imageType]: {
            existingUrl: data.imageUrl
          }
        }));
        
        toast.success(`${imageType} image generated successfully`);
      }
    } catch (error) {
      console.error('Generate error:', error);
      toast.error(`Failed to generate ${imageType} image`);
    } finally {
      setIsGenerating(false);
      setGeneratingImage({ type: null, isOpen: false });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let storyId = id;

      // Create mode: insert new story
      if (!id) {
        const { data: newStory, error: insertError } = await supabase
          .from('stories')
          .insert({
            title: formData.title,
            content: formData.content,
            excerpt: formData.excerpt,
            hero_name: formData.hero_name,
            story_universe: formData.story_universe,
            age_range: formData.age_range,
            story_type: formData.story_type,
            media_url: formData.media_url,
            content_type: formData.content_type,
            art_style: formData.art_style,
            is_featured: true,
            created_by: null,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        storyId = newStory.id;

        // Log admin activity
        await supabase.from('admin_activity_log').insert({
          admin_id: user?.id,
          action: 'create_story',
          target_type: 'story',
          target_id: storyId,
          details: { created_featured_story: true }
        });

        toast.success('Story created successfully');
      } else {
        // Edit mode: update existing story
        const { error } = await supabase
          .from('stories')
          .update({
            title: formData.title,
            content: formData.content,
            excerpt: formData.excerpt,
            hero_name: formData.hero_name,
            story_universe: formData.story_universe,
            age_range: formData.age_range,
            story_type: formData.story_type,
            media_url: formData.media_url,
            content_type: formData.content_type,
            art_style: formData.art_style,
          })
          .eq('id', storyId);

        if (error) throw error;

        // Log admin activity
        await supabase.from('admin_activity_log').insert({
          admin_id: user?.id,
          action: 'update_story',
          target_type: 'story',
          target_id: storyId,
          details: { updated_fields: Object.keys(formData) }
        });

        toast.success('Story updated successfully');
      }

      // Update cover_image_url if cover image exists
      if (imageData.cover.existingUrl) {
        await supabase
          .from('stories')
          .update({ cover_image_url: imageData.cover.existingUrl })
          .eq('id', storyId);
      }
      
      navigate('/library');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save story');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader 
          showBackButton={true}
          backPath="/library"
          title="Edit Story"
        />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        showBackButton={true}
        backPath="/library"
        title={id ? 'Edit Story' : 'Create Story'}
      />
      
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header - Stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-chewy">
              {id ? 'Edit Story' : 'Create New Story'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {id ? 'Update your story content and images' : 'Create a new story for your collection'}
            </p>
          </div>
          
          {/* Action Buttons - Full width on mobile */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => navigate('/library')}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {id ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                id ? 'Save Changes' : 'Create Story'
              )}
            </Button>
          </div>
        </div>

        <Card className="border-border/50">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Story Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-4 sm:px-6 pb-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Story title"
              />
            </div>

            {/* Hero Name */}
            <div className="space-y-2">
              <Label htmlFor="hero_name">Hero Name</Label>
              <Input
                id="hero_name"
                value={formData.hero_name}
                onChange={(e) => setFormData({ ...formData, hero_name: e.target.value })}
                placeholder="Main character name"
              />
            </div>

            {/* Image Slots Section */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Story Images</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ImageSlot
                  label="Cover Image"
                  imageType="cover"
                  imageInfo={imageData.cover}
                  onGenerateClick={() => setGeneratingImage({ type: 'cover', isOpen: true })}
                  isGenerating={isGenerating && generatingImage.type === 'cover'}
                />
                
                <ImageSlot
                  label="Middle Scene"
                  imageType="mid-scene"
                  imageInfo={imageData['mid-scene']}
                  onGenerateClick={() => setGeneratingImage({ type: 'mid-scene', isOpen: true })}
                  isGenerating={isGenerating && generatingImage.type === 'mid-scene'}
                />
                
                <ImageSlot
                  label="Ending Scene"
                  imageType="ending"
                  imageInfo={imageData.ending}
                  onGenerateClick={() => setGeneratingImage({ type: 'ending', isOpen: true })}
                  isGenerating={isGenerating && generatingImage.type === 'ending'}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                AI generation requires story to be saved first. Generate unique images tailored to your story.
              </p>
            </div>

            {/* Story Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Story Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write the full story here..."
                className="min-h-[300px] sm:min-h-[400px] font-serif text-sm"
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (Preview Text)</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Short preview of the story..."
                className="min-h-[100px]"
              />
            </div>

            {/* Bottom Save Button */}
            <div className="flex justify-center sm:justify-end pt-4 border-t border-border/50">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full sm:w-auto sm:min-w-[200px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {id ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  id ? 'Save Changes' : 'Create Story'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Image Generation Dialog */}
      {generatingImage.type && (
        <ImagePromptDialog
          open={generatingImage.isOpen}
          onOpenChange={(open) => setGeneratingImage({ ...generatingImage, isOpen: open })}
          onGenerate={(customizations) => handleGenerateImage(generatingImage.type!, customizations)}
          storyTitle={formData.title}
          heroName={formData.hero_name}
          artStyle={formData.art_style}
          imageType={generatingImage.type}
          storyExcerpt={formData.excerpt}
          imageCount={0}
          isGenerating={isGenerating}
          generationMode={generationMode}
          onGenerationModeChange={setGenerationMode}
        />
      )}
    </div>
  );
}