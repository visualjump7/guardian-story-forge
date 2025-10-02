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
import { Loader2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function StoryEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    hero_name: '',
    story_universe: '',
    age_range: '',
    story_type: '',
    cover_image_url: '',
  });

  useEffect(() => {
    if (id) {
      loadStory();
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
    });

    if (data.cover_image_url) {
      setImagePreview(data.cover_image_url);
    }

    setLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!imageFile || !id) return null;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${id}-cover.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('featured-story-covers')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('featured-story-covers')
        .getPublicUrl(fileName);

      setUploading(false);
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      setUploading(false);
      return null;
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(formData.cover_image_url || null);
  };

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    try {
      let coverImageUrl = formData.cover_image_url;

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await handleImageUpload();
        if (uploadedUrl) {
          coverImageUrl = uploadedUrl;
        }
      }

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
          cover_image_url: coverImageUrl,
        })
        .eq('id', id);

      if (error) throw error;

      // Log admin activity
      await supabase.from('admin_activity_log').insert({
        admin_id: user?.id,
        action: 'update_story',
        target_type: 'story',
        target_id: id,
        details: { updated_fields: Object.keys(formData) }
      });

      toast.success('Story updated successfully');
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
            <h1 className="text-3xl font-bold">Edit Story</h1>
            <p className="text-muted-foreground">Update story content and images</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/stories')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
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

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="flex flex-col gap-4">
                {imagePreview && (
                  <div className="relative w-full max-w-md">
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    {imageFile && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="max-w-xs"
                  />
                  <span className="text-sm text-muted-foreground">Max 5MB</span>
                </div>
              </div>
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
    </AdminLayout>
  );
}
