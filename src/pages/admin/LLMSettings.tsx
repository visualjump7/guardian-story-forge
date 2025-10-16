import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Brain, Save, Plus, Trash2 } from 'lucide-react';

interface PromptTemplate {
  id: string;
  template_type: string;
  name: string;
  version: number;
  content: string;
  parameters: any; // Use any for jsonb to avoid type conflicts
  is_active: boolean;
}

export default function LLMSettings() {
  const [storyTemplates, setStoryTemplates] = useState<PromptTemplate[]>([]);
  const [imageTemplates, setImageTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('story');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const story = data?.filter(t => t.template_type === 'story_system') || [];
      const image = data?.filter(t => t.template_type === 'image_generation') || [];

      setStoryTemplates(story);
      setImageTemplates(image);
    } catch (error: any) {
      toast.error('Failed to load templates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (template: PromptTemplate) => {
    try {
      const { error } = await supabase
        .from('prompt_templates')
        .update({
          content: template.content,
          parameters: template.parameters,
          is_active: template.is_active,
        })
        .eq('id', template.id);

      if (error) throw error;

      toast.success('Template updated successfully');
      fetchTemplates();
    } catch (error: any) {
      toast.error('Failed to update template: ' + error.message);
    }
  };

  const setActiveTemplate = async (id: string, templateType: string) => {
    try {
      // Deactivate all templates of this type
      await supabase
        .from('prompt_templates')
        .update({ is_active: false })
        .eq('template_type', templateType);

      // Activate the selected template
      const { error } = await supabase
        .from('prompt_templates')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Active template updated');
      fetchTemplates();
    } catch (error: any) {
      toast.error('Failed to set active template: ' + error.message);
    }
  };

  const TemplateEditor = ({ template, onUpdate }: { template: PromptTemplate; onUpdate: (t: PromptTemplate) => void }) => {
    const [editedTemplate, setEditedTemplate] = useState(template);

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {editedTemplate.name}
                {editedTemplate.is_active && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Active</span>
                )}
              </CardTitle>
              <CardDescription>Version {editedTemplate.version}</CardDescription>
            </div>
            <div className="flex gap-2">
              {!editedTemplate.is_active && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTemplate(editedTemplate.id, editedTemplate.template_type)}
                >
                  Set as Active
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={() => onUpdate(editedTemplate)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Prompt Content</Label>
            <Textarea
              value={editedTemplate.content}
              onChange={(e) => setEditedTemplate({ ...editedTemplate, content: e.target.value })}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Model</Label>
              <Input
                value={editedTemplate.parameters.model || ''}
                onChange={(e) => setEditedTemplate({
                  ...editedTemplate,
                  parameters: { ...editedTemplate.parameters, model: e.target.value }
                })}
                placeholder="google/gemini-2.5-flash"
              />
            </div>

            {editedTemplate.template_type === 'story_system' && (
              <>
                <div>
                  <Label>Temperature (0-1)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={editedTemplate.parameters.temperature || 0.7}
                    onChange={(e) => setEditedTemplate({
                      ...editedTemplate,
                      parameters: { ...editedTemplate.parameters, temperature: parseFloat(e.target.value) }
                    })}
                  />
                </div>

                <div>
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={editedTemplate.parameters.max_tokens || 2000}
                    onChange={(e) => setEditedTemplate({
                      ...editedTemplate,
                      parameters: { ...editedTemplate.parameters, max_tokens: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-chewy">LLM Settings</h1>
          <p className="text-muted-foreground">Manage AI prompts and parameters</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="story">
              <Brain className="h-4 w-4 mr-2" />
              Story Generation
            </TabsTrigger>
            <TabsTrigger value="image">
              <Brain className="h-4 w-4 mr-2" />
              Image Generation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="story" className="mt-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Story Generation Prompts</CardTitle>
                <CardDescription>
                  Configure the system prompts and parameters for story generation. 
                  The active template will be used for all new stories.
                </CardDescription>
              </CardHeader>
            </Card>

            {storyTemplates.map(template => (
              <TemplateEditor
                key={template.id}
                template={template}
                onUpdate={updateTemplate}
              />
            ))}
          </TabsContent>

          <TabsContent value="image" className="mt-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Image Generation Prompts</CardTitle>
                <CardDescription>
                  Configure the prompts for AI-generated story images. 
                  Use placeholders like {'{art_style}'}, {'{scene_description}'}, {'{characters}'}, {'{mood}'}.
                </CardDescription>
              </CardHeader>
            </Card>

            {imageTemplates.map(template => (
              <TemplateEditor
                key={template.id}
                template={template}
                onUpdate={updateTemplate}
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
