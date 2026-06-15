import { db } from './index';
import {
  users,
  workspaces,
  workspaceMembers,
  tables,
  fields,
  fieldOptions,
  records,
  cellValues,
  views,
  comments,
  mentions,
  activityLog,
  attachments,
  templates,
} from './schema';

const TEAM = [
  { name: 'Sarah Chen', email: 'sarah@contentflow.app', clerkId: 'clerk_sarah' },
  { name: 'Marcus Rivera', email: 'marcus@contentflow.app', clerkId: 'clerk_marcus' },
  { name: 'Aisha Patel', email: 'aisha@contentflow.app', clerkId: 'clerk_aisha' },
  { name: "James O'Brien", email: 'james@contentflow.app', clerkId: 'clerk_james' },
  { name: 'Lena Kowalski', email: 'lena@contentflow.app', clerkId: 'clerk_lena' },
];

const STATUSES = ['Idea', 'Drafting', 'In Review', 'Published', 'Archived'];
const STATUS_COLORS: Record<string, string> = {
  Idea: '#8b8fa3',
  Drafting: '#1b61c9',
  'In Review': '#d97706',
  Published: '#16a34a',
  Archived: '#9ca3af',
};

const TYPES = ['Blog', 'Newsletter', 'Social', 'Video', 'Podcast'];
const TYPE_COLORS: Record<string, string> = {
  Blog: '#1b61c9',
  Newsletter: '#5b21b6',
  Social: '#d63381',
  Video: '#dc3545',
  Podcast: '#e8590c',
};

const SAMPLE_RECORDS = [
  { title: 'Q3 Product Launch Announcement', status: 'Drafting', type: 'Blog', assignee: 0, date: '2026-06-18', words: 1200, featured: true, notes: 'Coordinate with product team for screenshots and quotes.' },
  { title: 'Weekly Digest — June Week 3', status: 'In Review', type: 'Newsletter', assignee: 1, date: '2026-06-20', words: 850, featured: false, notes: 'Include roundup of new integrations.' },
  { title: 'Behind the Scenes: How We Built v4', status: 'Idea', type: 'Blog', assignee: 0, date: '2026-06-25', words: 2000, featured: true, notes: 'Long-form narrative. Interview engineering leads.' },
  { title: 'Instagram Reel: Feature Highlights', status: 'Drafting', type: 'Social', assignee: 2, date: '2026-06-16', words: 60, featured: false, notes: '15-second format. Focus on collaboration features.' },
  { title: 'Customer Story: Acme Corp Migration', status: 'Published', type: 'Blog', assignee: 3, date: '2026-06-10', words: 1500, featured: true, notes: 'Acme approved final draft. Photos cleared by legal.' },
  { title: 'Podcast Ep 47: Future of Work Tools', status: 'Drafting', type: 'Podcast', assignee: 1, date: '2026-06-22', words: 0, featured: false, notes: 'Guest: VP of Product at TechCo. Record Thursday.' },
  { title: 'LinkedIn Thought Leadership Post', status: 'Idea', type: 'Social', assignee: 4, date: '2026-07-01', words: 200, featured: false, notes: 'Topic: asynchronous collaboration in distributed teams.' },
  { title: 'Video Tutorial: Advanced Automations', status: 'In Review', type: 'Video', assignee: 2, date: '2026-06-19', words: 0, featured: true, notes: 'Screen recording done. Editing in progress.' },
  { title: 'SEO Guide: Content Planning at Scale', status: 'Published', type: 'Blog', assignee: 0, date: '2026-06-05', words: 3200, featured: true, notes: 'Ranking for 12 target keywords. 4.2K views first week.' },
  { title: 'Monthly Metrics Newsletter — June', status: 'Idea', type: 'Newsletter', assignee: 1, date: '2026-06-30', words: 600, featured: false, notes: 'Pull data from analytics dashboard. Add commentary.' },
  { title: 'Twitter Thread: 10 Productivity Tips', status: 'Published', type: 'Social', assignee: 4, date: '2026-06-08', words: 350, featured: false, notes: 'Engaged 12K impressions. 340 retweets.' },
  { title: 'Webinar Recap Blog Post', status: 'Drafting', type: 'Blog', assignee: 3, date: '2026-06-24', words: 1000, featured: false, notes: 'Summarize key takeaways from Tuesday webinar.' },
  { title: 'YouTube: Getting Started Guide', status: 'Archived', type: 'Video', assignee: 2, date: '2026-05-15', words: 0, featured: false, notes: 'Replaced by v4 onboarding series.' },
  { title: 'Partner Co-marketing Email Blast', status: 'In Review', type: 'Newsletter', assignee: 1, date: '2026-06-21', words: 400, featured: false, notes: 'Joint send with DataStack. A/B test subject lines.' },
  { title: 'TikTok Series: Day in the Life', status: 'Idea', type: 'Social', assignee: 2, date: '2026-07-05', words: 0, featured: false, notes: '3-part series featuring the design team.' },
  { title: 'Podcast Ep 48: Data-Driven Content', status: 'Idea', type: 'Podcast', assignee: 1, date: '2026-07-03', words: 0, featured: false, notes: 'Potential guest: Head of Analytics at MediaCo.' },
  { title: 'Case Study: Startup Scaling Playbook', status: 'Published', type: 'Blog', assignee: 3, date: '2026-06-03', words: 2400, featured: true, notes: 'Featured in partner newsletter. 890 downloads.' },
  { title: 'Year-in-Review Video Script', status: 'Archived', type: 'Video', assignee: 4, date: '2026-05-28', words: 1800, featured: false, notes: 'Shelved until Q4 planning. Keep outline.' },
];

const BLOG_TEMPLATE = {
  name: 'Blog Post Pipeline',
  description: 'Standard blog post workflow from idea to published',
  icon: '📝',
  category: 'blog' as const,
  isSystem: true,
  fieldDefinitions: [
    { name: 'Status', type: 'select', options: ['Idea', 'Drafting', 'In Review', 'Published'] },
    { name: 'Author', type: 'collaborator' },
    { name: 'Publish Date', type: 'date' },
    { name: 'Word Count', type: 'number' },
    { name: 'SEO Keywords', type: 'text' },
    { name: 'Featured', type: 'checkbox' },
  ],
  statusDefinitions: STATUSES.map((label, i) => ({
    label,
    color: STATUS_COLORS[label],
    sortOrder: i,
  })),
};

const NEWSLETTER_TEMPLATE = {
  name: 'Newsletter Workflow',
  description: 'Weekly or monthly newsletter production',
  icon: '📧',
  category: 'newsletter' as const,
  isSystem: true,
  fieldDefinitions: [
    { name: 'Status', type: 'select', options: ['Drafting', 'In Review', 'Scheduled', 'Sent'] },
    { name: 'Editor', type: 'collaborator' },
    { name: 'Send Date', type: 'date' },
    { name: 'Open Rate', type: 'number' },
    { name: 'Subject Line', type: 'text' },
  ],
  statusDefinitions: [
    { label: 'Drafting', color: '#1b61c9', sortOrder: 0 },
    { label: 'In Review', color: '#d97706', sortOrder: 1 },
    { label: 'Scheduled', color: '#5b21b6', sortOrder: 2 },
    { label: 'Sent', color: '#16a34a', sortOrder: 3 },
  ],
};

const SOCIAL_TEMPLATE = {
  name: 'Social Media Campaign',
  description: 'Multi-platform social content planning',
  icon: '📱',
  category: 'social' as const,
  isSystem: true,
  fieldDefinitions: [
    { name: 'Status', type: 'select', options: ['Idea', 'Drafting', 'Scheduled', 'Published'] },
    { name: 'Platform', type: 'select', options: ['Twitter', 'LinkedIn', 'Instagram', 'TikTok'] },
    { name: 'Scheduled Date', type: 'date' },
    { name: 'Engagement', type: 'number' },
    { name: 'Hashtags', type: 'text' },
  ],
  statusDefinitions: [
    { label: 'Idea', color: '#8b8fa3', sortOrder: 0 },
    { label: 'Drafting', color: '#1b61c9', sortOrder: 1 },
    { label: 'Scheduled', color: '#d63381', sortOrder: 2 },
    { label: 'Published', color: '#16a34a', sortOrder: 3 },
  ],
};

async function seed() {
  console.log('Seeding database...');

  // 1. Users
  const insertedUsers = await db
    .insert(users)
    .values(TEAM)
    .returning();
  console.log(`  ✓ ${insertedUsers.length} users`);

  // 2. Workspace
  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: 'ContentFlow Demo',
      slug: 'contentflow-demo',
      description: 'Main editorial workspace',
    })
    .returning();
  console.log(`  ✓ workspace: ${workspace.name}`);

  // 3. Workspace members
  const memberships = insertedUsers.map((u, i) => ({
    workspaceId: workspace.id,
    userId: u.id,
    role: i === 0 ? ('owner' as const) : ('editor' as const),
  }));
  await db.insert(workspaceMembers).values(memberships);
  console.log(`  ✓ ${memberships.length} workspace members`);

  // 4. Table
  const [editorialTable] = await db
    .insert(tables)
    .values({
      workspaceId: workspace.id,
      name: 'Editorial Planner',
      icon: '📋',
      description: 'Track all content from idea to publication',
    })
    .returning();
  console.log(`  ✓ table: ${editorialTable.name}`);

  // 5. Fields (8 total, matching prototype)
  const fieldDefs = await db
    .insert(fields)
    .values([
      { tableId: editorialTable.id, name: 'Title', type: 'text', sortOrder: 0, width: 260, config: {} },
      { tableId: editorialTable.id, name: 'Status', type: 'select', sortOrder: 1, width: 120, config: {} },
      { tableId: editorialTable.id, name: 'Type', type: 'select', sortOrder: 2, width: 110, config: {} },
      { tableId: editorialTable.id, name: 'Assignee', type: 'collaborator', sortOrder: 3, width: 150, config: { allowMultiple: false } },
      { tableId: editorialTable.id, name: 'Publish Date', type: 'date', sortOrder: 4, width: 120, config: {} },
      { tableId: editorialTable.id, name: 'Word Count', type: 'number', sortOrder: 5, width: 100, config: {} },
      { tableId: editorialTable.id, name: 'Featured', type: 'checkbox', sortOrder: 6, width: 80, config: {} },
      { tableId: editorialTable.id, name: 'Notes', type: 'long_text', sortOrder: 7, width: 220, config: {} },
    ])
    .returning();

  const [titleField, statusField, typeField] = fieldDefs;

  // 6. Field options for Status
  await db.insert(fieldOptions).values(
    STATUSES.map((label, i) => ({
      fieldId: statusField.id,
      label,
      color: STATUS_COLORS[label],
      sortOrder: i,
    })),
  );

  // 7. Field options for Type
  await db.insert(fieldOptions).values(
    TYPES.map((label, i) => ({
      fieldId: typeField.id,
      label,
      color: TYPE_COLORS[label],
      sortOrder: i,
    })),
  );
  console.log(`  ✓ ${fieldDefs.length} fields + options`);

  // 8. Records + cell values
  const insertedRecords = [];
  for (const [i, rec] of SAMPLE_RECORDS.entries()) {
    const [inserted] = await db
      .insert(records)
      .values({
        tableId: editorialTable.id,
        workspaceId: workspace.id,
        title: rec.title,
        sortOrder: i,
        wordCount: rec.words,
        createdBy: insertedUsers[rec.assignee].id,
      })
      .returning();
    insertedRecords.push(inserted);

    await db.insert(cellValues).values([
      { recordId: inserted.id, fieldId: titleField.id, value: rec.title },
      { recordId: inserted.id, fieldId: statusField.id, value: rec.status },
      { recordId: inserted.id, fieldId: typeField.id, value: rec.type },
      { recordId: inserted.id, fieldId: fieldDefs[3].id, value: insertedUsers[rec.assignee].id },
      { recordId: inserted.id, fieldId: fieldDefs[4].id, value: rec.date },
      { recordId: inserted.id, fieldId: fieldDefs[5].id, value: rec.words },
      { recordId: inserted.id, fieldId: fieldDefs[6].id, value: rec.featured },
      { recordId: inserted.id, fieldId: fieldDefs[7].id, value: rec.notes },
    ]);
  }
  console.log(`  ✓ ${SAMPLE_RECORDS.length} records with cell values`);

  // 9. Default views
  await db.insert(views).values([
    {
      tableId: editorialTable.id,
      name: 'Grid',
      type: 'grid',
      isDefault: true,
      isShared: true,
      filters: [],
      sorts: [],
      groupBy: null,
      columns: fieldDefs.map((f, i) => ({
        fieldId: f.id,
        width: f.width ?? 150,
        visible: true,
        order: i,
      })),
    },
    {
      tableId: editorialTable.id,
      name: 'Kanban by Status',
      type: 'kanban',
      isDefault: false,
      isShared: true,
      filters: [],
      sorts: [],
      groupBy: { fieldId: statusField.id },
    },
    {
      tableId: editorialTable.id,
      name: 'Publish Calendar',
      type: 'calendar',
      isDefault: false,
      isShared: true,
      filters: [],
      sorts: [],
      groupBy: null,
    },
  ]);
  console.log(`  ✓ 3 views`);

  // 10. Comments (sample on first few records)
  const sampleComments = await db
    .insert(comments)
    .values([
      {
        recordId: insertedRecords[0].id,
        workspaceId: workspace.id,
        userId: insertedUsers[1].id,
        content: 'Great outline! Can we add a section about pricing tiers?',
      },
      {
        recordId: insertedRecords[0].id,
        workspaceId: workspace.id,
        userId: insertedUsers[0].id,
        content: 'Good idea. I\'ll add it to the draft.',
      },
      {
        recordId: insertedRecords[4].id,
        workspaceId: workspace.id,
        userId: insertedUsers[3].id,
        content: 'Final version approved by Acme. Ready to publish.',
      },
    ])
    .returning();
  console.log(`  ✓ ${sampleComments.length} comments`);

  // 11. Mentions
  await db.insert(mentions).values([
    { commentId: sampleComments[0].id, mentionedUserId: insertedUsers[0].id },
    { commentId: sampleComments[2].id, mentionedUserId: insertedUsers[1].id },
  ]);
  console.log(`  ✓ 2 mentions`);

  // 12. Activity log
  await db.insert(activityLog).values([
    {
      workspaceId: workspace.id,
      recordId: insertedRecords[0].id,
      userId: insertedUsers[0].id,
      action: 'create',
      entityType: 'record',
      entityId: insertedRecords[0].id,
      changes: { title: 'Q3 Product Launch Announcement' },
    },
    {
      workspaceId: workspace.id,
      recordId: insertedRecords[0].id,
      userId: insertedUsers[0].id,
      action: 'status_change',
      entityType: 'record',
      entityId: insertedRecords[0].id,
      changes: { field: 'Status', from: 'Idea', to: 'Drafting' },
    },
    {
      workspaceId: workspace.id,
      recordId: insertedRecords[4].id,
      userId: insertedUsers[3].id,
      action: 'status_change',
      entityType: 'record',
      entityId: insertedRecords[4].id,
      changes: { field: 'Status', from: 'Drafting', to: 'Published' },
    },
  ]);
  console.log(`  ✓ 3 activity log entries`);

  // 13. Attachments (sample)
  await db.insert(attachments).values([
    {
      recordId: insertedRecords[0].id,
      workspaceId: workspace.id,
      userId: insertedUsers[0].id,
      filename: 'product-screenshots.zip',
      url: 'https://storage.contentflow.app/attachments/product-screenshots.zip',
      mimeType: 'application/zip',
      size: 2457600,
    },
    {
      recordId: insertedRecords[8].id,
      workspaceId: workspace.id,
      userId: insertedUsers[0].id,
      filename: 'seo-report-june.pdf',
      url: 'https://storage.contentflow.app/attachments/seo-report-june.pdf',
      mimeType: 'application/pdf',
      size: 512000,
    },
  ]);
  console.log(`  ✓ 2 attachments`);

  // 14. Templates
  await db.insert(templates).values([
    BLOG_TEMPLATE,
    NEWSLETTER_TEMPLATE,
    SOCIAL_TEMPLATE,
  ]);
  console.log(`  ✓ 3 templates`);

  console.log('Seed complete!');
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
