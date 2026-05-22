const fs = require('fs');

const requiredFiles = [
  'app/_layout.tsx',
  'app/auth.tsx',
  'app/post/create.tsx',
  'app/post/[id].tsx',
  'app/admin/questions.tsx',
  'app/admin/reports.tsx',
  'src/features/feed/FeedScreen.tsx',
  'src/features/post/PostDetailScreen.tsx',
  'src/features/profile/ProfileScreen.tsx',
  'src/features/admin/QuestionsAdminScreen.tsx',
  'src/features/admin/ReportsAdminScreen.tsx',
  'supabase/schema.sql',
  'supabase/functions/send-push/index.ts',
  'assets/icon.png',
  'assets/splash.png',
  'assets/store-screenshot.png',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

JSON.parse(fs.readFileSync('package.json', 'utf8'));
JSON.parse(fs.readFileSync('app.json', 'utf8'));
JSON.parse(fs.readFileSync('eas.json', 'utf8'));

console.log('smoke check ok');
