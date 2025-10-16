interface StoryImage {
  id: string;
  image_url: string;
  is_selected: boolean;
}

export interface FlipbookPage {
  type: 'cover' | 'content' | 'illustration' | 'end';
  imageUrl?: string;
  text?: string;
  title?: string;
  subtitle?: string;
}

export function generateFlipbookPages(
  story: {
    title: string;
    content: string;
    cover_image_url: string | null;
    hero_name: string | null;
  },
  images: StoryImage[],
  creatorName: string
): FlipbookPage[] {
  const pages: FlipbookPage[] = [];
  
  // 1. Cover page
  pages.push({
    type: 'cover',
    imageUrl: story.cover_image_url || undefined,
    title: story.title,
    subtitle: `By ${creatorName}`
  });
  
  // 2. Split content into pages (approximately 300-350 words per page)
  const contentPages = paginateContent(story.content, 300);
  
  // 3. Calculate strategic image positions (25%, 50%, 75% of content)
  const totalContentPages = contentPages.length;
  const imagePositions = [
    Math.floor(totalContentPages * 0.25),
    Math.floor(totalContentPages * 0.50),
    Math.floor(totalContentPages * 0.75)
  ];
  
  // Filter out cover image and get story images
  const storyImages = images.filter(img => img.image_url !== story.cover_image_url);
  
  // 4. Interleave content and images
  contentPages.forEach((content, index) => {
    pages.push({ 
      type: 'content', 
      text: content 
    });
    
    // Insert image if at strategic position and image available
    const imageIndex = imagePositions.indexOf(index);
    if (imageIndex >= 0 && storyImages[imageIndex]) {
      pages.push({
        type: 'illustration',
        imageUrl: storyImages[imageIndex].image_url
      });
    }
  });
  
  // 5. "The End" page
  pages.push({
    type: 'end',
    text: '~ The End ~'
  });
  
  return pages;
}

function paginateContent(content: string, wordsPerPage: number): string[] {
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const pages: string[] = [];
  let currentPage: string[] = [];
  let currentWordCount = 0;
  
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    const paragraphWordCount = words.length;
    
    // If adding this paragraph would exceed word limit, start new page
    if (currentWordCount > 0 && currentWordCount + paragraphWordCount > wordsPerPage) {
      pages.push(currentPage.join('\n\n'));
      currentPage = [paragraph];
      currentWordCount = paragraphWordCount;
    } else {
      currentPage.push(paragraph);
      currentWordCount += paragraphWordCount;
    }
  }
  
  // Add remaining content
  if (currentPage.length > 0) {
    pages.push(currentPage.join('\n\n'));
  }
  
  return pages;
}
