import { z } from 'zod';

// Zod schema for runtime validation
const StyleSchema = z.object({
  name: z.string(),
  voice: z.string(),
  rhythm: z.object({
    sentence_len_range: z.tuple([z.number(), z.number()]),
    dialog_ratio_target: z.number(),
    pacing: z.string().optional(),
    patterning: z.string().optional()
  }),
  devices: z.array(z.string()),
  lexicon: z.object({
    prefer: z.array(z.string()),
    avoid: z.array(z.string()).optional()
  }).optional(),
  page_rules: z.object({
    max_words_per_page: z.number()
  }).optional(),
  structural_rules: z.record(z.any()).optional(),
  learning_support: z.record(z.any()).optional(),
  coping_toolkit: z.array(z.string()).optional(),
  safety: z.record(z.boolean()).optional(),
  do: z.array(z.string()),
  dont: z.array(z.string())
});

const ConfigSchema = z.object({
  version: z.string(),
  app: z.object({
    name: z.string(),
    band: z.enum(['A', 'B']),
    age_range: z.string(),
    canvas: z.record(z.any()),
    typography: z.record(z.any()),
    export: z.record(z.any())
  }),
  model: z.object({
    name: z.string(),
    generationConfig: z.object({
      temperature: z.number(),
      topP: z.number(),
      topK: z.number(),
      candidateCount: z.number(),
      maxOutputTokens: z.number(),
      stopSequences: z.array(z.string())
    }),
    response: z.object({
      response_mime_type: z.string(),
      response_schema: z.record(z.any())
    })
  }),
  bands: z.record(z.object({
    words_total: z.tuple([z.number(), z.number()]),
    sentence_len: z.tuple([z.number(), z.number()]),
    pages: z.number(),
    words_per_page: z.tuple([z.number(), z.number()]),
    dialog_ratio_target: z.number(),
    vocab: z.record(z.any()),
    subplot: z.record(z.any()).optional(),
    safety: z.record(z.any())
  })),
  selectors: z.object({
    story_kind: z.array(z.string()),
    character_archetype: z.array(z.string()),
    mission: z.array(z.string()),
    image_style: z.array(z.string()),
    style_picker_visible: z.boolean(),
    style_picker_default_behavior_if_skipped: z.string(),
    style_picker_visible_chips: z.array(z.string())
  }),
  styles: z.array(StyleSchema),
  auto_mapping: z.record(z.array(z.object({
    style: z.string(),
    weight: z.number()
  }))),
  image_styles: z.record(z.record(z.string())),
  randomization: z.record(z.any()),
  output_contract: z.record(z.any()),
  prompt_templates: z.object({
    system: z.string(),
    style_addon: z.string(),
    user_seed: z.string()
  }),
  validators: z.record(z.any()),
  safety: z.record(z.any()),
  art_policy: z.object({
    strategy: z.string(),
    image_model: z.string(),
    lazy_render: z.boolean(),
    triggers: z.array(z.string()),
    continuity: z.record(z.boolean()),
    band_defaults: z.record(z.object({
      upfront_images: z.array(z.string()),
      suggest_pages: z.array(z.string()),
      max_images_per_story: z.number()
    })),
    beats_to_page_windows: z.record(z.tuple([z.number(), z.number()])),
    image_sizes: z.object({
      default: z.number(),
      allowed_custom: z.array(z.number()),
      thumbnail: z.number(),
      snap_to_multiple: z.number()
    }),
    safety: z.record(z.boolean()),
    performance: z.record(z.any())
  }).optional()
});

export type AgeBandConfig = z.infer<typeof ConfigSchema>;
export type WritingStyle = z.infer<typeof StyleSchema>;

export class ConfigManager {
  private static instance: ConfigManager;
  private configs: Map<string, AgeBandConfig> = new Map();
  private currentConfig: AgeBandConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async loadConfig(ageBand: 'A' | 'B'): Promise<AgeBandConfig> {
    if (this.configs.has(ageBand)) {
      this.currentConfig = this.configs.get(ageBand)!;
      return this.currentConfig;
    }

    try {
      const response = await fetch(`/config/age-band-${ageBand.toLowerCase()}.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawConfig = await response.json();
      const validationResult = ConfigSchema.safeParse(rawConfig);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }));
        
        throw new Error(JSON.stringify({
          error: 'INVALID_CONFIGURATION',
          message: 'Configuration file validation failed',
          details: errors,
          ageBand
        }));
      }

      const config = validationResult.data;
      this.configs.set(ageBand, config);
      this.currentConfig = config;
      
      return config;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('{')) {
        throw error;
      }
      throw new Error(JSON.stringify({
        error: 'CONFIG_LOAD_FAILED',
        message: `Failed to load configuration for age band ${ageBand}`,
        originalError: error instanceof Error ? error.message : String(error)
      }));
    }
  }

  getConfig(): AgeBandConfig {
    if (!this.currentConfig) {
      throw new Error(JSON.stringify({
        error: 'NO_CONFIG_LOADED',
        message: 'Configuration must be loaded before use'
      }));
    }
    return this.currentConfig;
  }

  getBandConfig(band: 'A' | 'B') {
    const config = this.getConfig();
    return config.bands[band];
  }

  getStyles(): WritingStyle[] {
    return this.getConfig().styles;
  }

  getStyleByName(styleName: string): WritingStyle | undefined {
    return this.getStyles().find(s => s.name === styleName);
  }

  getAutoMappingForStoryKind(storyKind: string): Array<{style: string, weight: number}> {
    const config = this.getConfig();
    const mapping = config.auto_mapping[storyKind];
    if (!mapping || !Array.isArray(mapping)) return [];
    return mapping.filter((m): m is {style: string, weight: number} => 
      typeof m.style === 'string' && typeof m.weight === 'number'
    );
  }

  selectStyleByWeight(storyKind: string): string {
    const mappings = this.getAutoMappingForStoryKind(storyKind);
    if (mappings.length === 0) return this.getStyles()[0].name;

    const totalWeight = mappings.reduce((sum, m) => sum + m.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const mapping of mappings) {
      random -= mapping.weight;
      if (random <= 0) return mapping.style;
    }
    
    return mappings[0].style;
  }

  validateCharacterName(name: string, band: 'A' | 'B'): { valid: boolean; error?: string } {
    const minLen = band === 'A' ? 2 : 2;
    const maxLen = band === 'A' ? 15 : 24;
    const pattern = /^[a-zA-Z\s'-]+$/;
    
    if (name.length < minLen) {
      return { valid: false, error: `Name must be at least ${minLen} characters` };
    }
    if (name.length > maxLen) {
      return { valid: false, error: `Name must be less than ${maxLen} characters` };
    }
    if (!pattern.test(name)) {
      return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }
    
    return { valid: true };
  }

  validateCustomDescription(description: string, band: 'A' | 'B'): { valid: boolean; error?: string } {
    const maxLength = band === 'A' ? 50 : 80;
    
    if (description.length > maxLength) {
      return { 
        valid: false, 
        error: `Description must be ${maxLength} characters or less (currently ${description.length})` 
      };
    }

    // Check safety words
    const config = this.getConfig();
    const safetyTopics = config.safety.deny_if_topics || [];
    
    const lowerDesc = description.toLowerCase();
    for (const topic of safetyTopics) {
      if (lowerDesc.includes(topic)) {
        return { 
          valid: false, 
          error: 'Please use kid-friendly language for your description' 
        };
      }
    }
    
    return { valid: true };
  }

  getImageStyleConfig(styleName: string) {
    const config = this.getConfig();
    return config.image_styles[styleName];
  }

  buildSystemPrompt(band: 'A' | 'B', styleName: string): string {
    const config = this.getConfig();
    const bandConfig = this.getBandConfig(band);
    const style = this.getStyleByName(styleName);
    
    if (!style) {
      throw new Error(`Style "${styleName}" not found in configuration`);
    }

    // Replace placeholders in system template
    let systemPrompt = config.prompt_templates.system
      .replace('{band}', config.app.age_range)
      .replace('{pages}', String(bandConfig.pages))
      .replace('{words_min}', String(bandConfig.words_total[0]))
      .replace('{words_max}', String(bandConfig.words_total[1]))
      .replace('{sent_min}', String(bandConfig.sentence_len[0]))
      .replace('{sent_max}', String(bandConfig.sentence_len[1]))
      .replace('{dialog_ratio_target}', String(Math.round(bandConfig.dialog_ratio_target * 100)))
      .replace('{wpp_min}', String(bandConfig.words_per_page[0]))
      .replace('{wpp_max}', String(bandConfig.words_per_page[1]))
      .replace('{resolve_fear_within_pages}', String(bandConfig.safety.resolve_fear_within_pages));

    // Add subplot instructions for Band B
    if (band === 'B' && bandConfig.subplot) {
      systemPrompt = systemPrompt
        .replace('{subplot_start}', String(bandConfig.subplot.window_pages[0]))
        .replace('{subplot_end}', String(bandConfig.subplot.window_pages[1]))
        .replace('{subplot_resolve_by}', String(bandConfig.subplot.must_resolve_by));
    }

    // Add style-specific instructions
    const styleAddon = config.prompt_templates.style_addon
      .replace('{style_name}', style.name)
      .replace('{voice}', style.voice)
      .replace('{style_sentence_min}', String(style.rhythm.sentence_len_range[0]))
      .replace('{style_sentence_max}', String(style.rhythm.sentence_len_range[1]))
      .replace('{style_dialog_ratio_target}', String(style.rhythm.dialog_ratio_target))
      .replace('{devices}', style.devices.join(', '))
      .replace('{prefer}', style.lexicon?.prefer?.join(', ') || 'N/A')
      .replace('{avoid}', style.lexicon?.avoid?.join(', ') || 'N/A')
      .replace('{style_rules_json}', JSON.stringify(style.do.concat(style.dont.map(d => `DON'T: ${d}`))));

    return `${systemPrompt}\n\n${styleAddon}`;
  }

  buildUserPrompt(params: {
    characterName: string;
    storyKind: string;
    characterArchetype: string;
    mission: string;
    imageStyle: string;
    band: 'A' | 'B';
  }): string {
    const config = this.getConfig();
    const bandConfig = this.getBandConfig(params.band);
    
    return config.prompt_templates.user_seed
      .replace('{main_character_name}', params.characterName)
      .replace('{story_kind}', params.storyKind)
      .replace('{character_archetype}', params.characterArchetype)
      .replace('{mission}', params.mission)
      .replace('{image_style}', params.imageStyle)
      .replace('{band}', params.band)
      .replace('{pages}', String(bandConfig.pages));
  }

  getResponseSchema() {
    return this.getConfig().model.response.response_schema;
  }

  // Art Policy methods
  getArtPolicy() {
    const config = this.getConfig();
    return config.art_policy || null;
  }

  getUpfrontImageBeats(band: 'A' | 'B'): string[] {
    const policy = this.getArtPolicy();
    if (!policy) return [];
    return policy.band_defaults[band]?.upfront_images || [];
  }

  getSuggestedImageBeats(band: 'A' | 'B'): string[] {
    const policy = this.getArtPolicy();
    if (!policy) return [];
    return policy.band_defaults[band]?.suggest_pages || [];
  }

  getMaxImagesPerStory(band: 'A' | 'B'): number {
    const policy = this.getArtPolicy();
    if (!policy) return 10;
    return policy.band_defaults[band]?.max_images_per_story || 10;
  }

  getPageWindowForBeat(beat: string): [number, number] | null {
    const policy = this.getArtPolicy();
    if (!policy) return null;
    const window = policy.beats_to_page_windows[beat];
    if (!window || !Array.isArray(window) || window.length !== 2) return null;
    return [window[0], window[1]];
  }

  snapImageSize(requestedSize: number): number {
    const policy = this.getArtPolicy();
    if (!policy) return requestedSize;
    const multiple = policy.image_sizes.snap_to_multiple;
    return Math.round(requestedSize / multiple) * multiple;
  }

  getDefaultImageSize(): number {
    const policy = this.getArtPolicy();
    return policy?.image_sizes.default || 896;
  }
}

export const configManager = ConfigManager.getInstance();