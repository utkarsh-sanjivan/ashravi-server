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
  'Getting Started', 'Core Concepts', 'Understanding the Basics', 'Advanced Techniques',
  'Practical Applications', 'Real-Life Case Studies', 'Common Challenges', 'Expert Insights',
  'Action Plans', 'Building Your Strategy', 'Implementation Guide', 'Troubleshooting',
  'Long-term Success', 'Community Support', 'Weekly Practice', 'Next Steps',
  'Deep Dive', 'Mastering the Skills', 'Putting It All Together', 'Final Reflections'
];

const VIDEO_TOPICS = [
  'Introduction and Overview', 'Key Principles Explained', 'Step-by-Step Guide',
  'Common Mistakes to Avoid', 'Success Stories', 'Q&A Session', 'Expert Interview',
  'Practical Demonstration', 'Weekly Check-In', 'Summary and Reflection',
  'Case Study Analysis', 'Interactive Exercise', 'Best Practices', 'Tips and Tricks'
];

const PDF_TOPICS = [
  'Printable Worksheet', 'Weekly Planner', 'Cheat Sheet', 'Resource Guide',
  'Template Collection', 'Activity Ideas', 'Reading List', 'Progress Tracker',
  'Quick Reference Guide', 'Action Items Checklist'
];

const REAL_VIDEO_URLS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
  'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
  'https://download.blender.org/demo/movies/BBB/bbb_sunflower_1080p_30fps_normal.mp4',
  'https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_480p_surround-fix.avi',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
  'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
  'https://file-examples.com/storage/fe783c69df66ed87dc49c18/2017/04/file_example_MP4_480_1_5MG.mp4',
  'https://file-examples.com/storage/fe783c69df66ed87dc49c18/2017/04/file_example_MP4_640_3MG.mp4',
  'https://file-examples.com/storage/fe783c69df66ed87dc49c18/2017/04/file_example_MP4_1280_10MG.mp4',
  'https://file-examples.com/storage/fe783c69df66ed87dc49c18/2017/04/file_example_MP4_1920_18MG.mp4',
  'https://download.samplelib.com/mp4/sample-5s.mp4',
  'https://download.samplelib.com/mp4/sample-10s.mp4',
  'https://download.samplelib.com/mp4/sample-15s.mp4',
  'https://download.samplelib.com/mp4/sample-20s.mp4',
  'https://download.samplelib.com/mp4/sample-30s.mp4',
  'https://www.appsloveworld.com/wp-content/uploads/2018/10/640.mp4',
  'https://joy.videvo.net/videvo_files/video/free/2019-11/small_watermarked/190301_1_25_11_preview.webm',
  'https://player.vimeo.com/external/194837908.sd.mp4?s=c350076905b78c67f74d7ee39fdb4fef01d12420',
  'https://player.vimeo.com/external/291648067.hd.mp4?s=94998971682c6a3267e4cbd19d16a7b6c720f345',
  'https://player.vimeo.com/external/370467553.sd.mp4?s=5036b7bfc7c7e5f0c5f4b5c2e9c31f1f1b7db0a0',
  'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-daytime-city-traffic-aerial-view-56-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4'
];

const REAL_PDF_URLS = [
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'https://www.africau.edu/images/default/sample.pdf',
  'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf',
  'https://pdfobject.com/pdf/sample.pdf',
  'https://www.axmag.com/download/pdfurl-guide.pdf',
  'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample.pdf',
  'https://file-examples.com/storage/fe783c69df66ed87dc49c18/2017/10/file-sample_150kB.pdf',
  'https://file-examples.com/storage/fe783c69df66ed87dc49c18/2017/10/file-example_PDF_500_kB.pdf'
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
  const duration = randomInt(5, 45);
  
  return {
    title: `${randomElement(VIDEO_TOPICS)} - Part ${videoIndex + 1}`,
    description: faker.lorem.sentences(2),
    videoUrl: randomElement(REAL_VIDEO_URLS),
    duration: duration * 60,
    order: videoIndex,
    isFree: videoIndex === 0,
    thumbnail: `https://picsum.photos/seed/${uniqueId}/640/360`
  };
};

const generateSection = (sectionIndex) => {
  const numVideos = randomInt(3, 5);
  const numPdfs = randomInt(0, 2);
  
  const videos = Array.from({ length: numVideos }, (_, i) => generateVideo(sectionIndex, i));
  const pdfs = Array.from({ length: numPdfs }, (_, i) => {
    const uniqueId = randomUUID().slice(0, 8);
    const pdfUrl = randomElement(REAL_PDF_URLS);
    
    return {
      filename: `${randomElement(PDF_TOPICS).replace(/\s+/g, '_')}_${uniqueId}.pdf`,
      url: pdfUrl,
      size: randomInt(100000, 5000000),
      uploadedBy: '507f1f77bcf86cd799439011',
    };
  });
  
  return {
    title: `${randomElement(SECTION_TITLES)} ${sectionIndex + 1}`,
    description: faker.lorem.paragraph(),
    order: sectionIndex,
    videos,
    pdfs,
    isLocked: sectionIndex > 0 && Math.random() > 0.7
  };
};

const generateCourse = (index) => {
  const topic = randomElement(PARENTING_TOPICS);
  const level = randomElement(LEVELS);
  const numSections = 10;
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
    title: `${topic}: ${faker.company.catchPhrase()}`,
    headline: `Master ${topic.toLowerCase()} with proven strategies and expert guidance`,
    description: `${faker.lorem.paragraphs(3)}\n\nThis comprehensive course covers everything you need to know about ${topic.toLowerCase()}. Learn from experienced educators and apply practical techniques immediately.`,
    shortDescription: `Learn essential ${topic.toLowerCase()} techniques with hands-on guidance and real-world examples.`,
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
    learningOutcomes: [
      `Understand the core principles of ${topic.toLowerCase()}`,
      `Apply practical strategies in daily parenting situations`,
      `Build stronger relationships with your children`,
      `Develop confidence in your parenting skills`,
      `Connect with a community of like-minded parents`
    ],
    targetAudience: [
      'New parents',
      'Experienced parents seeking new strategies',
      'Caregivers and educators',
      'Anyone interested in child development'
    ],
    isPublished: Math.random() > 0.2
  };
};

const main = async () => {
  console.log('\n🌱 Parenting Course Seeder');
  console.log('━'.repeat(50));
  console.log(`API Endpoint: ${API_URL}`);
  console.log(`Number of Courses: ${NUM_COURSES}`);
  console.log(`Sections per Course: 10`);
  console.log(`Delay Between Requests: ${DELAY_MS}ms\n`);
  
  const confirmed = await askConfirmation();
  if (!confirmed) {
    console.log('\n❌ Seeding cancelled by user.\n');
    process.exit(0);
  }
  
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
      const errorDetails = err.response?.data?.details || '';
      console.error(`❌ Failed (${i + 1}/${NUM_COURSES}): ${course.title}`);
      console.error(`   Error Message: ${errorMsg}`);
      if (errorDetails) {
        console.error(`   Details: ${JSON.stringify(errorDetails)}`);
      }
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
    console.log('\n⚠️ Failed Courses:');
    errors.forEach(({ course, error }) => {
      console.log(`  - ${course}`);
      console.log(`    ${error}`);
    });
  } else if (errors.length > 10) {
    console.log(`\n⚠️ ${errors.length} courses failed. Too many to display.`);
  }
  
  console.log('\n✨ Seeding complete!\n');
  process.exit(0);
};

main().catch((error) => {
  console.error('\n💥 Fatal error during seeding:', error.message);
  process.exit(1);
});
