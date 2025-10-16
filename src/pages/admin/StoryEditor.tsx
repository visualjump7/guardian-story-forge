import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ImagePromptDialog } from '@/components/ImagePromptDialog';

interface ImageSlotProps {
  label: string;
  imageType: 'cover' | 'mid-scene' | 'ending';
  imageInfo: { preview: string | null; file: File | null; existingUrl: string | null };
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onGenerateClick: () => void;
  uploading: boolean;
}

const ImageSlot = ({ 
  label, 
  imageType, 
  imageInfo, 
  onImageSelect, 
  onRemoveImage, 
  onGenerateClick,
  uploading 
}: ImageSlotProps) => {
  const hasImage = imageInfo.preview || imageInfo.existingUrl;
  const displayImage = imageInfo.preview || imageInfo.existingUrl;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border-2 border-dashed border-gray-700 rounded-lg overflow-hidden">
        {/* Image Display or Placeholder */}
        <div className="relative w-full h-48">
          {displayImage ? (
            <img
              src={displayImage}
              alt={`${label} preview`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <span className="text-gray-600 text-lg font-medium">Story Image</span>
            </div>
          )}
          
          {/* Remove button if new file selected */}
          {imageInfo.file && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={onRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-gray-900 flex gap-2">
          <label className="flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={onImageSelect}
              className="hidden"
              id={`file-${imageType}`}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => document.getElementById(`file-${imageType}`)?.click()}
              disabled={uploading}
              type="button"
            >
              Upload
            </Button>
          </label>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={onGenerateClick}
            disabled={uploading}
            type="button"
          >
            <Sparkles className="h-3 w-3" />
            {hasImage ? 'Regenerate' : 'Generate'} AI
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
  const [uploading, setUploading] = useState(false);
  
  const [imageData, setImageData] = useState<{
    cover: { preview: string | null; file: File | null; existingUrl: string | null };
    'mid-scene': { preview: string | null; file: File | null; existingUrl: string | null };
    ending: { preview: string | null; file: File | null; existingUrl: string | null };
  }>({
    cover: { preview: null, file: null, existingUrl: null },
    'mid-scene': { preview: null, file: null, existingUrl: null },
    ending: { preview: null, file: null, existingUrl: null }
  });

  const [generatingImage, setGeneratingImage] = useState<{
    type: 'cover' | 'mid-scene' | 'ending' | null;
    isOpen: boolean;
  }>({ type: null, isOpen: false });

  const [isGenerating, setIsGenerating] = useState(false);
  
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
            preview: img.image_url,
            file: null,
            existingUrl: img.image_url
          };
        }
      });
      
      setImageData(newImageData);
    }

    setLoading(false);
  };

  const handleImageSelect = (imageType: 'cover' | 'mid-scene' | 'ending', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(prev => ({
        ...prev,
        [imageType]: {
          ...prev[imageType],
          file: file,
          preview: reader.result as string
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async (storyId: string, imageType: 'cover' | 'mid-scene' | 'ending') => {
    const imageInfo = imageData[imageType];
    if (!imageInfo.file) return imageInfo.existingUrl;

    setUploading(true);
    try {
      const fileExt = imageInfo.file.name.split('.').pop();
      const fileName = `${storyId}-${imageType}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('featured-story-covers')
        .upload(fileName, imageInfo.file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('featured-story-covers')
        .getPublicUrl(fileName);

      // Save to story_images table
      await supabase
        .from('story_images')
        .upsert({
          story_id: storyId,
          image_type: imageType,
          image_url: publicUrl,
          is_selected: true
        }, {
          onConflict: 'story_id,image_type'
        });

      setUploading(false);
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${imageType} image`);
      setUploading(false);
      return imageInfo.existingUrl;
    }
  };

  const handleRemoveImage = (imageType: 'cover' | 'mid-scene' | 'ending') => {
    setImageData(prev => ({
      ...prev,
      [imageType]: {
        ...prev[imageType],
        file: null,
        preview: prev[imageType].existingUrl
      }
    }));
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
            preview: data.imageUrl,
            file: null,
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

      // Upload all images if selected
      const uploadPromises = (['cover', 'mid-scene', 'ending'] as const).map(async (type) => {
        const uploadedUrl = await handleImageUpload(storyId!, type);
        return { type, url: uploadedUrl };
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Update cover_image_url specifically for the cover
      const coverResult = uploadResults.find(r => r.type === 'cover');
      if (coverResult?.url) {
        await supabase
          .from('stories')
          .update({ cover_image_url: coverResult.url })
          .eq('id', storyId);
      }
      
      navigate('/admin/stories');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save story');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-poppins font-bold">{id ? 'Edit Story' : 'Create New Story'}</h1>
            <p className="text-muted-foreground">
              {id ? 'Update story content and media' : 'Create a new featured story for the Guardian collection'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/stories')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
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

        <Card>
          <CardHeader>
            <CardTitle>Story Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  onImageSelect={(e) => handleImageSelect('cover', e)}
                  onRemoveImage={() => handleRemoveImage('cover')}
                  onGenerateClick={() => setGeneratingImage({ type: 'cover', isOpen: true })}
                  uploading={uploading}
                />
                
                <ImageSlot
                  label="Middle Scene"
                  imageType="mid-scene"
                  imageInfo={imageData['mid-scene']}
                  onImageSelect={(e) => handleImageSelect('mid-scene', e)}
                  onRemoveImage={() => handleRemoveImage('mid-scene')}
                  onGenerateClick={() => setGeneratingImage({ type: 'mid-scene', isOpen: true })}
                  uploading={uploading}
                />
                
                <ImageSlot
                  label="Ending Scene"
                  imageType="ending"
                  imageInfo={imageData.ending}
                  onImageSelect={(e) => handleImageSelect('ending', e)}
                  onRemoveImage={() => handleRemoveImage('ending')}
                  onGenerateClick={() => setGeneratingImage({ type: 'ending', isOpen: true })}
                  uploading={uploading}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Max 5MB per image. AI generation requires story to be saved first.
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
                className="min-h-[300px] font-serif"
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

            {/* Video Embedding */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="content_type">Content Type</Label>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="content_type"
                    value="text"
                    checked={formData.content_type === 'text'}
                    onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                  />
                  <span>Text Story</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="content_type"
                    value="video"
                    checked={formData.content_type === 'video'}
                    onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                  />
                  <span>Video Story</span>
                </label>
              </div>

              {formData.content_type === 'video' && (
                <div className="space-y-2">
                  <Label htmlFor="media_url">Vimeo Video ID</Label>
                  <Input
                    id="media_url"
                    value={formData.media_url}
                    onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                    placeholder="e.g., 123456789"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the Vimeo video ID (the numbers from the video URL)
                  </p>
                </div>
              )}
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="story_universe">Universe</Label>
                <Input
                  id="story_universe"
                  value={formData.story_universe}
                  onChange={(e) => setFormData({ ...formData, story_universe: e.target.value })}
                  placeholder="e.g., Forest Kingdom"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age_range">Age Range</Label>
                <Input
                  id="age_range"
                  value={formData.age_range}
                  onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                  placeholder="e.g., 6-8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="story_type">Story Type</Label>
                <Input
                  id="story_type"
                  value={formData.story_type}
                  onChange={(e) => setFormData({ ...formData, story_type: e.target.value })}
                  placeholder="e.g., Adventure"
                />
              </div>
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
        />
      )}
    </AdminLayout>
  );
}