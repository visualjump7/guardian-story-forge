import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Star, Eye, EyeOff, Trash2, Pencil, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Story {
  id: string;
  title: string;
  created_at: string;
  is_public: boolean;
  is_featured: boolean;
  story_universe: string | null;
  created_by: string;
  profiles: {
    display_name: string;
  };
}

export default function AdminStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setLoading(true);
    const { data: storiesData, error } = await supabase
      .from('stories')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load stories');
      setLoading(false);
      return;
    }

    // Load profiles for each story
    const storiesWithProfiles = await Promise.all(
      (storiesData || []).map(async (story) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', story.created_by)
          .single();

        return {
          ...story,
          profiles: {
            display_name: profileData?.display_name || 'Unknown',
          },
        };
      })
    );

    setStories(storiesWithProfiles);
    setLoading(false);
  };

  const handleToggleFeatured = async (storyId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('stories')
      .update({ is_featured: !currentState })
      .eq('id', storyId);

    if (error) {
      toast.error('Failed to update story');
    } else {
      toast.success(currentState ? 'Story unfeatured' : 'Story featured');
      loadStories();
    }
  };

  const handleTogglePublic = async (storyId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('stories')
      .update({ is_public: !currentState })
      .eq('id', storyId);

    if (error) {
      toast.error('Failed to update story');
    } else {
      toast.success(currentState ? 'Story made private' : 'Story made public');
      loadStories();
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    const { error } = await supabase.from('stories').delete().eq('id', storyId);

    if (error) {
      toast.error('Failed to delete story');
    } else {
      toast.success('Story deleted');
      loadStories();
    }
  };

  const filteredStories = stories.filter((story) =>
    story.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Featured Stories Management</h1>
            <p className="text-muted-foreground">Create and manage Guardian team stories</p>
          </div>
          <Button onClick={() => navigate('/admin/stories/new')}>
            <PlusCircle className="w-4 h-4" />
            Create New Story
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Stories</span>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading stories...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Universe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStories.map((story) => (
                    <TableRow key={story.id}>
                      <TableCell 
                        className="font-medium cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/story/${story.id}`)}
                      >
                        {story.title}
                      </TableCell>
                      <TableCell>{story.profiles?.display_name}</TableCell>
                      <TableCell>
                        {story.story_universe ? (
                          <Badge variant="outline">{story.story_universe}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {story.is_featured && <Badge variant="default">Featured</Badge>}
                          {story.is_public && <Badge variant="secondary">Public</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(story.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/stories/${story.id}/edit`)}
                            title="Edit story"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleFeatured(story.id, story.is_featured)}
                            title="Toggle featured"
                          >
                            <Star className={`h-4 w-4 ${story.is_featured ? 'fill-yellow-500' : ''}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePublic(story.id, story.is_public)}
                            title="Toggle public"
                          >
                            {story.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStory(story.id)}
                            title="Delete story"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
