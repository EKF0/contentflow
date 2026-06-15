export const BUILT_IN_TEMPLATES = [
  {
    id: 'blog-post-pipeline',
    name: 'Blog Post Pipeline',
    description: 'End-to-end blog post workflow from drafting to publication',
    isBuiltIn: true,
    payload: {
      tableName: 'Blog Posts',
      statuses: ['Drafting', 'Editing', 'Review', 'Published'],
      fields: [
        { name: 'Title', type: 'text' },
        { name: 'Author', type: 'collaborator' },
        { name: 'Word Count', type: 'number' },
        { name: 'SEO Keywords', type: 'text' },
        { name: 'Featured Image', type: 'attachment' },
        { name: 'Publish Date', type: 'date' },
      ],
    },
  },
  {
    id: 'newsletter-workflow',
    name: 'Newsletter Workflow',
    description: 'Manage newsletter creation from planning to send',
    isBuiltIn: true,
    payload: {
      tableName: 'Newsletters',
      statuses: ['Planning', 'Writing', 'Design', 'Send'],
      fields: [
        { name: 'Subject', type: 'text' },
        { name: 'Audience', type: 'select', options: ['All Users', 'Free', 'Pro', 'Enterprise'] },
        { name: 'Open Rate Target', type: 'number' },
        { name: 'Send Date', type: 'date' },
      ],
    },
  },
  {
    id: 'social-campaign',
    name: 'Social Campaign',
    description: 'Coordinate social media campaigns across platforms',
    isBuiltIn: true,
    payload: {
      tableName: 'Social Posts',
      statuses: ['Concept', 'Create', 'Schedule', 'Live'],
      fields: [
        { name: 'Platform', type: 'select', options: ['Twitter/X', 'LinkedIn', 'Instagram', 'TikTok'] },
        { name: 'Hashtags', type: 'text' },
        { name: 'Media', type: 'attachment' },
        { name: 'Campaign', type: 'text' },
      ],
    },
  },
  {
    id: 'video-production',
    name: 'Video Production',
    description: 'Track video content from script to publish',
    isBuiltIn: true,
    payload: {
      tableName: 'Videos',
      statuses: ['Script', 'Record', 'Edit', 'Publish'],
      fields: [
        { name: 'Duration', type: 'text' },
        { name: 'Thumbnail', type: 'attachment' },
        { name: 'Platform', type: 'select', options: ['YouTube', 'Vimeo', 'TikTok', 'Instagram Reels'] },
        { name: 'Series', type: 'text' },
      ],
    },
  },
  {
    id: 'podcast-series',
    name: 'Podcast Series',
    description: 'Manage podcast episodes from topic to release',
    isBuiltIn: true,
    payload: {
      tableName: 'Episodes',
      statuses: ['Topic', 'Record', 'Edit', 'Release'],
      fields: [
        { name: 'Guest', type: 'text' },
        { name: 'Duration', type: 'text' },
        { name: 'Episode', type: 'number' },
        { name: 'Season', type: 'number' },
      ],
    },
  },
];
