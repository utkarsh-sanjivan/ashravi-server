import axios from 'axios';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import readline from 'readline';
import { randomUUID } from 'crypto';

dotenv.config();

const API_URL = 'http://localhost:8000/api/v1/courses';
const AUTH_TOKEN = process.env.ADMIN_AUTH_TOKEN || '';
const NUM_COURSES = 100;
const DELAY_MS = 200;

const PARENTING_TOPICS = [
  'Mindful Parenting', 'Positive Discipline', 'Raising Confident Children',
  'Parenting Teens', 'Toddler Behavior Management', 'Newborn Care Basics',
  'Sleep Training Techniques', 'Nutrition for Growing Kids', 'Screen Time Balance',
  'Sibling Rivalry Solutions', 'Building Emotional Intelligence', 'Stress-Free Parenting',
  'Single Parenting Strategies', 'Co-Parenting After Divorce', 'Special Needs Parenting',
  'Technology and Kids', 'Bullying Prevention', 'Teaching Responsibility',
  'Preparing for School', 'Homework Help Strategies', 'Building Self-Esteem',
  'Managing Tantrums', 'Potty Training', 'Financial Literacy for Kids',
  'Teaching Kindness', 'Developing Social Skills', 'Fostering Creativity',
  'Sports and Physical Development', 'Reading with Your Child', 'Math Skills at Home',
  'Language Development', 'Cultural Awareness', 'Gender-Positive Parenting',
  'LGBTQ+ Inclusive Parenting', 'Adoption and Foster Care', 'Blended Family Dynamics',
  'Grandparenting Tips', 'Work-Life Balance for Parents', 'Self-Care for Parents',
  'Parenting Through Grief', 'Managing Parental Anxiety', 'Building Family Traditions'
];

const SECTION_TITLES = [
  'Getting Started', 'Core Concepts', 'Advanced Techniques', 'Practical Applications',
  'Real-Life Case Studies', 'Common Challenges', 'Expert Insights', 'Action Plans',
  'Resources and Tools', 'Community Support', 'Weekly Practice', 'Next Steps'
];

const VIDEO_TOPICS = [
  'Introduction and Overview', 'Key Principles Explained', 'Step-by-Step Guide',
  'Common Mistakes to Avoid', 'Success Stories', 'Q&A Session', 'Expert Interview',
  'Practical Demonstration', 'Weekly Check-In', 'Summary and Reflection'
];

const PDF_TOPICS = [
  'Printable Worksheet', 'Weekly Planner', 'Cheat Sheet', 'Resource Guide',
  'Template Collection', 'Activity Ideas', 'Reading List', 'Progress Tracker',
  'Quick Reference Guide', 'Action Items Checklist'
];

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR'];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const askConfirmation = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`Are you sure you want to add ${NUM_COURSES} Parenting courses? (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
};

const randomElement = (array) => array[Math.floor(Math.random() * array.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateVideo = (sectionIndex, videoIndex) => {
  const uniqueId = randomUUID().slice(0, 8);
  return {
    title: `${randomElement(VIDEO_TOPICS)} - Part ${videoIndex + 1}`,
    description: faker.lorem.sentences(2),
    videoUrl: `https://example.com/videos/parenting-${sectionIndex}-${videoIndex}-${uniqueId}.mp4`,
    duration: randomInt(5, 45),
    order: videoIndex,
    isFree: videoIndex === 0,
    thumbnail: `https://picsum.photos/seed/${uniqueId}/640/360`
  };
};

const generatePdf = (sectionIndex, pdfIndex) => {
  const uniqueId = randomUUID().slice(0, 8);
  return {
    filename: `${randomElement(PDF_TOPICS).replace(/\s+/g, '_')}_${uniqueId}.pdf`,
    url: `https://example.com/pdfs/parenting-section-${sectionIndex}-resource-${pdfIndex}-${uniqueId}.pdf`,
    size: randomInt(100000, 5000000)
  };
};

const generateSection = (sectionIndex) => {
  const numVideos = randomInt(1, 3);
  const numPdfs = randomInt(0, 3);

  const videos = Array.from({ length: numVideos }, (_, i) => generateVideo(sectionIndex, i));
  const pdfs = Array.from({ length: numPdfs }, (_, i) => generatePdf(sectionIndex, i));

  return {
    title: `${randomElement(SECTION_TITLES)} ${sectionIndex + 1}`,
    description: faker.lorem.paragraph(),
    order: sectionIndex,
    videos,
    isLocked: sectionIndex > 0 && Math.random() > 0.7
  };
};

const generateCourse = (index) => {
  const topic = randomElement(PARENTING_TOPICS);
  const level = randomElement(LEVELS);
  const numSections = randomInt(3, 6);
  const uniqueId = randomUUID().slice(0, 8);
  
  const basePrice = randomInt(29, 299);
  const hasDiscount = Math.random() > 0.6;
  const discountedPrice = hasDiscount ? Math.floor(basePrice * 0.7) : null;

  const sections = Array.from({ length: numSections }, (_, i) => generateSection(i));

  const tags = [
    'parenting',
    topic.toLowerCase().replace(/\s+/g, '-'),
    level,
    faker.helpers.arrayElement(['family', 'child-development', 'education', 'wellness'])
  ];

  return {
    title: `${topic}: ${faker.company.catchPhrase()} (Course ${index + 1})`,
    headline: faker.lorem.sentence(),
    description: faker.lorem.paragraphs(3),
    shortDescription: faker.lorem.sentence(),
    thumbnail: `https://picsum.photos/seed/${uniqueId}/800/600`,
    coverImage: `https://picsum.photos/seed/${uniqueId}-cover/1200/400`,
    category: 'Parenting',
    subCategory: topic,
    level,
    language: 'English',
    price: {
      amount: basePrice,
      currency: randomElement(CURRENCIES),
      ...(discountedPrice && { discountedPrice })
    },
    sections,
    tags,
    prerequisites: Math.random() > 0.5 ? [faker.lorem.sentence()] : [],
    learningOutcomes: Array.from({ length: randomInt(3, 6) }, () => faker.lorem.sentence()),
    targetAudience: [
      'New parents',
      'Experienced parents seeking new strategies',
      'Caregivers and educators'
    ],
    isPublished: Math.random() > 0.2
  };
};

const main = async () => {
  console.log('\n🌱 Parenting Course Seeder');
  console.log('━'.repeat(50));
  console.log(`API Endpoint: ${API_URL}`);
  console.log(`Number of Courses: ${NUM_COURSES}`);
  console.log(`Delay Between Requests: ${DELAY_MS}ms\n`);

  // const confirmed = await askConfirmation();
  
  // if (!confirmed) {
  //   console.log('\n❌ Seeding cancelled by user.\n');
  //   process.exit(0);
  // }

  console.log('\n🚀 Starting to seed courses...\n');

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  const headers = AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};

  for (let i = 0; i < NUM_COURSES; i++) {
    const course = generateCourse(i);
    
    try {
      await axios.post(API_URL, course, { headers });
      successCount++;
      console.log(`✅ Added (${i + 1}/${NUM_COURSES}): ${course.title}`);
    } catch (err) {
      failCount++;
      const errorMsg = err.response?.data?.message || err.message;
      const errorDetils = err.response?.data?.details || err.details;
      console.error(`❌ Failed (${i + 1}/${NUM_COURSES}): ${course.title}`);
      console.error(`   Error Message: ${errorMsg}`);
      console.error(err);
      errors.push({ course: course.title, error: errorMsg });
    }

    await sleep(DELAY_MS);
  }

  console.log('\n' + '━'.repeat(50));
  console.log('📊 Seeding Summary');
  console.log('━'.repeat(50));
  console.log(`✅ Successfully added: ${successCount}/${NUM_COURSES}`);
  console.log(`❌ Failed: ${failCount}/${NUM_COURSES}`);
  
  if (errors.length > 0 && errors.length <= 10) {
    console.log('\n⚠️  Failed Courses:');
    errors.forEach(({ course, error }) => {
      console.log(`   - ${course}`);
      console.log(`     ${error}`);
    });
  } else if (errors.length > 10) {
    console.log(`\n⚠️  ${errors.length} courses failed. Too many to display.`);
  }

  console.log('\n✨ Seeding complete!\n');
  process.exit(0);
};

main().catch((error) => {
  console.error('\n💥 Fatal error during seeding:', error.message);
  process.exit(1);
});
