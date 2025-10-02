import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function StoryEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    hero_name: '',
    story_universe: '',
    age_range: '8-10',
    story_type: '',
  });

  useEffect(() => {
    if (id) {
      loadStory();
    }
  }, [id]);

  const loadStory = async () => {
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
      age_range: data.age_range || '8-10',
      story_type: data.story_type || '',
    });

    if (data.cover_image_url) {
      setImagePreview(data.cover_image_url);
    }

    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, and GIF images are allowed');
      return;
    }

    setUploading(true);

    try {
      // Create filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-cover.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('featured-story-covers')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true, // Replace existing cover
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('featured-story-covers')
        .getPublicUrl(fileName);

      // Update story record
      const { error: updateError } = await supabase
        .from('stories')
        .update({ cover_image_url: publicUrl })
        .eq('id', id);

      if (updateError) throw updateError;

      setImagePreview(publicUrl);
      toast.success('Cover image uploaded successfully!');

      // Log admin activity
      await supabase.from('admin_activity_log').insert({
        admin_id: user?.id,
        action: 'upload_story_cover',
        target_type: 'story',
        target_id: id,
        details: { fileName, publicUrl },
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('stories')
        .update({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt || null,
          hero_name: formData.hero_name || null,
          story_universe: formData.story_universe || null,
          age_range: formData.age_range,
          story_type: formData.story_type || null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Story updated successfully!');

      // Log admin activity
      await supabase.from('admin_activity_log').insert({
        admin_id: user?.id,
        action: 'update_story',
        target_type: 'story',
        target_id: id,
        details: formData,
      });

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
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/stories')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stories
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Edit Story</h1>
          <p className="text-muted-foreground">Update story content and cover image</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Story Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Story title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_name">Hero Name</Label>
                <Input
                  id="hero_name"
                  value={formData.hero_name}
                  onChange={(e) => setFormData({ ...formData, hero_name: e.target.value })}
                  placeholder="Main character name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="story_universe">Story Universe</Label>
                <Input
                  id="story_universe"
                  value={formData.story_universe}
                  onChange={(e) => setFormData({ ...formData, story_universe: e.target.value })}
                  placeholder="e.g., Guardian Kids Universe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="story_type">Story Type</Label>
                <Input
                  id="story_type"
                  value={formData.story_type}
                  onChange={(e) => setFormData({ ...formData, story_type: e.target.value })}
                  placeholder="e.g., Adventure, Fantasy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age_range">Age Range</Label>
                <Input
                  id="age_range"
                  value={formData.age_range}
                  onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                  placeholder="e.g., 8-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Short description for preview..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Story Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write the full story here..."
                  rows={15}
                  className="font-serif"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {imagePreview && (
                <div className="aspect-[3/4] rounded-lg overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <Label
                  htmlFor="cover-upload"
                  className="cursor-pointer block w-full"
                >
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload cover image
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Max 5MB • JPEG, PNG, WebP, GIF
                        </p>
                      </>
                    )}
                  </div>
                </Label>
                <Input
                  id="cover-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Upload a custom cover image for this featured story. The image will be visible on the home page.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/stories')}>
            Cancel
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
