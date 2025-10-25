/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const { Faker, en } = require('@faker-js/faker');

const Instructor = require('../src/models/Instructor');
const Course = require('../src/models/Course');
const Question = require('../src/models/Questions');
const Parent = require('../src/models/Parent');

const faker = new Faker({ locale: en });

faker.seed(2025);

const INSTRUCTOR_TARGET = 35;
const COURSE_TARGET = 200;

const COURSE_THEMES = [
  {
    category: 'Parenting & Child Development',
    subCategories: [
      'Early Childhood Development',
      'Positive Parenting',
      'Teen Guidance',
      'Health & Nutrition',
      'Special Needs Support',
      'Family Dynamics'
    ],
    topics: [
      'Mindful Parenting Foundations',
      'Raising Emotionally Intelligent Kids',
      'Teen Communication Strategies',
      'Nutrition for Growing Children',
      'Screen Time & Digital Wellness',
      'Building Resilient Families',
      'Parent-Child Bonding Activities',
      'Inclusive Parenting Practices',
      'Sibling Harmony Masterclass',
      'Parenting Neurodiverse Children',
      'Holistic Toddler Development',
      'Positive Discipline Playbook'
    ]
  }
];

const SECTION_TITLES = [
  'Foundation Concepts',
  'Core Principles',
  'Deep Dive',
  'Hands-on Workshop',
  'Industry Insights',
  'Real-world Application',
  'Expert Techniques',
  'Project Lab',
  'Optimization Strategies',
  'Assessment & Reflection',
  'Scaling Up',
  'Best Practices',
  'Troubleshooting Guide',
  'Future Trends',
  'Capstone Review',
  'Action Plan'
];

const VIDEO_LIBRARY = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
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

const PDF_LIBRARY = [
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'https://www.africau.edu/images/default/sample.pdf',
  'https://www.orimi.com/pdf-test.pdf',
  'https://unec.edu.az/application/uploads/2014/12/pdf-sample.pdf',
  'https://gahp.net/wp-content/uploads/2017/09/sample.pdf',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'https://www.africau.edu/images/default/sample.pdf',
  'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf',
  'https://pdfobject.com/pdf/sample.pdf',
  'https://www.axmag.com/download/pdfurl-guide.pdf',
  'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample.pdf',
  'https://file-examples.com/storage/fe783c69df66ed87dc49c18/2017/10/file-sample_150kB.pdf',
  'https://file-examples.com/storage/fe783c69df66ed87dc49c18/2017/10/file-example_PDF_500_kB.pdf'
];

const LANGUAGES = ['English', 'Hindi'];
const TEXT_SEARCH_LANGUAGE = 'english';

const TARGET_AUDIENCES = [
  'Ambitious working professionals',
  'Final-year university students',
  'Career switchers',
  'Startup founders and operators',
  'Team leads and managers',
  'Independent consultants',
  'Freelance practitioners',
  'Business analysts',
  'Product enthusiasts'
];

const PREREQUISITE_SNIPPETS = [
  'Basic understanding of core concepts',
  'Comfortable navigating digital tools',
  'Interest in real-world project work',
  'Willingness to learn collaboratively',
  'Ability to dedicate 6-8 hours weekly',
  'Prior exposure to foundational terminology'
];

const OUTCOME_SNIPPETS = [
  'Build confidence to solve real business challenges',
  'Create portfolio-ready project artefacts',
  'Apply frameworks used by leading organisations',
  'Collaborate effectively with cross-functional teams',
  'Design measurable implementation roadmaps',
  'Communicate insights with stakeholder impact',
  'Automate repeatable workflows for efficiency',
  'Adopt industry best practices sustainably'
];

const COURSE_BADGES = ['Masterclass', 'Bootcamp', 'Professional Certificate', 'Immersive Program', 'Job-ready Track'];

const INDIAN_FIRST_NAMES = [
  'Aarav', 'Vihaan', 'Aditya', 'Vivaan', 'Reyansh', 'Ishaan', 'Kabir', 'Arjun', 'Ayaan', 'Shaurya',
  'Ananya', 'Diya', 'Ira', 'Aadhya', 'Kiara', 'Myra', 'Anika', 'Navya', 'Sara', 'Aarohi'
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Iyer', 'Menon', 'Patel', 'Kapoor', 'Bose', 'Rao', 'Ghosh', 'Gupta',
  'Shetty', 'Desai', 'Chawla', 'Kulkarni', 'Singh', 'Banerjee', 'Nair', 'Mehta', 'Jain', 'Joshi'
];

const INDIAN_CITIES = [
  'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Delhi', 'Gurgaon', 'Noida', 'Kolkata', 'Ahmedabad',
  'Jaipur', 'Chandigarh', 'Lucknow', 'Indore', 'Nagpur', 'Coimbatore', 'Kochi', 'Surat', 'Visakhapatnam', 'Bhopal'
];

const appendMode = process.argv.includes('--append');

const randomInt = (min, max) => faker.number.int({ min, max });
const randomFloat = (min, max, step = 0.1) =>
  Number(
    faker
      .number.float({ min, max, multipleOf: step })
      .toFixed(String(step).split('.')[1]?.length ?? 1)
  );
const pickRandom = (array) => faker.helpers.arrayElement(array);
const pickSample = (array, count) => faker.helpers.arrayElements(array, count);
const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const createPicsumUrl = (seed, width, height) => {
  const normalizedSeed = slugify(String(seed));
  return `https://picsum.photos/seed/${normalizedSeed}/${width}/${height}`;
};

const ensureContentCurator = async () => {
  let curator = await Parent.findOne({ email: 'content.curator@ashravi.org' });

  if (!curator) {
    curator = await Parent.create({
      name: 'Content Curator',
      email: 'content.curator@ashravi.org',
      password: 'CuratorPass#2024',
      phoneNumber: faker.phone.number('+91##########'),
      city: pickRandom(INDIAN_CITIES),
      occupation: 'Learning Experience Designer'
    });
    console.log('🆕 Created content curator parent account for asset uploads');
  }

  return curator;
};

const generateInstructorData = (index, expertisePool) => {
  const firstName = pickRandom(INDIAN_FIRST_NAMES);
  const lastName = pickRandom(INDIAN_LAST_NAMES);
  const domain = pickRandom(['skillforge.in', 'mentorhub.in', 'learncraft.in']);
  const expertiseAreas = pickSample(expertisePool, randomInt(3, 5));

  return {
    firstName,
    lastName,
    email: `${firstName}.${lastName}.${faker.string.alphanumeric({ length: 4, casing: 'lower' })}${index}@${domain}`.toLowerCase(),
    phoneNumber: faker.phone.number('+91##########'),
    bio: faker.lorem.paragraphs(2),
    profileImage: `https://i.pravatar.cc/300?img=${(index % 70) + 1}`,
    expertiseAreas,
    yearsOfExperience: randomInt(4, 22),
    socialLinks: {
      website: `https://www.${slugify(`${firstName}${lastName}`)}.academy`,
      linkedin: `https://www.linkedin.com/in/${slugify(`${firstName}-${lastName}`)}`,
      twitter: Math.random() > 0.5 ? `https://twitter.com/${slugify(`${firstName}${lastName}`)}` : undefined,
      youtube: Math.random() > 0.6 ? `https://www.youtube.com/@${slugify(`${firstName}${lastName}`)}-learning` : undefined
    },
    isActive: true
  };
};

const createInstructors = async (targetCount, expertisePool) => {
  const existingCount = await Instructor.countDocuments();

  if (!appendMode && existingCount > 0) {
    throw new Error('Instructors already exist. Use --append to allow adding more data.');
  }

  const instructors = appendMode ? await Instructor.find({ isActive: true }) : [];
  const required = Math.max(targetCount - instructors.length, appendMode ? 0 : targetCount);

  if (required <= 0) {
    console.log(`ℹ️  Using ${instructors.length} existing instructors`);
    return instructors;
  }

  console.log(`👨‍🏫 Creating ${required} instructors`);
  for (let i = 0; i < required; i += 1) {
    const data = generateInstructorData(existingCount + i, expertisePool);
    const instructor = await Instructor.create(data);
    instructors.push(instructor);
  }

  console.log(`✅ Total instructors available: ${instructors.length}`);
  return instructors;
};

const buildQuestion = (courseContext, sectionTitle) => {
  const correctOptionIndex = randomInt(0, 3);
  const options = Array.from({ length: 4 }).map((_, idx) => ({
    optionText: faker.lorem.sentence(8),
    optionValue: idx + 1,
    isCorrect: idx === correctOptionIndex
  }));

  return {
    _id: new mongoose.Types.ObjectId(),
    questionText: `${courseContext.topic} scenario: ${faker.lorem.sentence(12)}`,
    questionType: 'mcq',
    category: `${courseContext.category} assessment`,
    subCategory: sectionTitle,
    options,
    issueWeightages: [
      {
        issueId: 'knowledge',
        issueName: 'Knowledge & Recall',
        weightage: 60
      },
      {
        issueId: 'application',
        issueName: 'Practical Application',
        weightage: 40
      }
    ],
    ageGroup: {
      min: 18,
      max: 60
    },
    difficultyLevel: pickRandom(['easy', 'medium', 'medium', 'hard']),
    tags: [
      slugify(courseContext.topic),
      slugify(courseContext.subCategory),
      'assessment',
      'mcq'
    ],
    isActive: true
  };
};

const generateSections = (courseContext, uploaderId, pendingQuestions) => {
  const sectionCount = randomInt(10, 14);
  const sectionIndices = Array.from({ length: sectionCount }, (_, idx) => idx);
  const testCount = Math.max(1, Math.round(sectionCount * 0.6));
  const testSectionIndices = faker.helpers
    .shuffle([...sectionIndices])
    .slice(0, testCount);

  return sectionIndices.map((sectionIndex) => {
    const sectionTitle = `${pickRandom(SECTION_TITLES)} ${sectionIndex + 1}`;
    const videoCount = randomInt(1, 4);
    const videos = Array.from({ length: videoCount }, (_, videoIndex) => ({
      title: `${courseContext.topic} - ${faker.company.buzzPhrase()}`,
      description: faker.lorem.sentences(3),
      videoUrl: pickRandom(VIDEO_LIBRARY),
      duration: randomInt(6, 18) * 60,
      order: videoIndex,
      isFree: sectionIndex === 0 && videoIndex === 0,
      thumbnail: createPicsumUrl(`${courseContext.topic}-${sectionIndex}-${videoIndex}`, 640, 360)
    }));

    const pdfResource = {
      filename: `${slugify(sectionTitle)}-resources.pdf`,
      url: pickRandom(PDF_LIBRARY),
      size: randomInt(280000, 2400000),
      uploadedBy: uploaderId,
      uploadedAt: faker.date.recent({ days: 120 })
    };

    let test;
    if (testSectionIndices.includes(sectionIndex)) {
      const questionsRequired = randomInt(2, 5);
      const questionDocs = Array.from({ length: questionsRequired }, () =>
        buildQuestion(courseContext, sectionTitle)
      );
      const questionIds = questionDocs.map((doc) => doc._id);
      pendingQuestions.push(...questionDocs);

      test = {
        title: `${sectionTitle} Knowledge Check`,
        description: faker.lorem.sentences(2),
        questions: questionIds,
        passingScore: randomInt(60, 80),
        duration: randomInt(20, 45),
        order: sectionIndex
      };
    }

    return {
      title: sectionTitle,
      description: faker.lorem.paragraph(),
      order: sectionIndex,
      videos,
      pdfs: [pdfResource],
      test,
      isLocked: sectionIndex > 0 ? Math.random() > 0.65 : false
    };
  });
};

const generateCoursePayload = (index, instructor, uploaderId, pendingQuestions) => {
  const theme = pickRandom(COURSE_THEMES);
  const subCategory = pickRandom(theme.subCategories);
  const topic = pickRandom(theme.topics);
  const level = pickRandom(['beginner', 'intermediate', 'advanced']);
  const badge = pickRandom(COURSE_BADGES);
  const courseTitle = `${topic} ${badge}`;
  const slugSuffix = faker.string.alphanumeric({ length: 6, casing: 'lower' });

  const description = faker.lorem
    .paragraphs(4, '\n\n')
    .concat(
      `\n\nThroughout this ${badge.toLowerCase()}, you will collaborate with experienced mentors and build a portfolio aligned with ${theme.category.toLowerCase()} hiring requirements.`
    );

  const shortDescription = faker.lorem.sentences(2).slice(0, 280);

  const priceAmount = randomInt(1499, 18999);
  const hasDiscount = Math.random() > 0.55;
  const discountFactor = faker.number.float({ min: 0.65, max: 0.9, multipleOf: 0.01 });

  const ratingAverage = randomFloat(3.6, 4.9, 0.1);
  const ratingCount = randomInt(45, 5200);

  const sections = generateSections(
    {
      category: theme.category,
      subCategory,
      topic
    },
    uploaderId,
    pendingQuestions
  );

  const tags = [
    slugify(theme.category),
    slugify(subCategory),
    slugify(topic),
    `${level}-level`,
    'industry-projects'
  ];

  const prerequisites = pickSample(PREREQUISITE_SNIPPETS, 3).map(
    (item) => `${item} related to ${topic.toLowerCase()}`
  );

  const learningOutcomes = pickSample(OUTCOME_SNIPPETS, 4).map(
    (outcome) => `${outcome} within the context of ${topic.toLowerCase()}`
  );

  const targetAudience = pickSample(TARGET_AUDIENCES, 3);

  const published = Math.random() > 0.25;
  const languageChoice = pickRandom(LANGUAGES);

  const payload = {
    title: courseTitle,
    slug: `${slugify(courseTitle)}-${slugSuffix}`,
    headline: `Become a ${level} ${topic} professional with mentor-led guidance`,
    description,
    shortDescription,
    thumbnail: createPicsumUrl(`${courseTitle}-${index}`, 800, 600),
    coverImage: createPicsumUrl(`${courseTitle}-${slugSuffix}-cover`, 1280, 720),
    category: theme.category,
    subCategory,
    level,
    language: languageChoice,
    textLanguage: TEXT_SEARCH_LANGUAGE,
    price: {
      amount: priceAmount,
      currency: 'INR',
      ...(hasDiscount
        ? { discountedPrice: Math.round(priceAmount * discountFactor) }
        : {})
    },
    sections,
    instructor: instructor._id,
    tags,
    prerequisites,
    learningOutcomes,
    targetAudience,
    isPublished: published,
    publishedAt: published ? faker.date.past({ years: 2 }) : undefined,
    rating: {
      average: ratingAverage,
      count: ratingCount
    },
    enrollmentCount: randomInt(ratingCount, ratingCount + 6500)
  };

  return payload;
};

const createCourses = async (targetCount, instructors, uploaderId) => {
  const existingCount = await Course.countDocuments();

  if (!appendMode && existingCount > 0) {
    throw new Error('Courses already exist. Use --append to allow adding more data.');
  }

  const pendingQuestions = [];
  const coursesToCreate = [];

  console.log(`📚 Preparing ${targetCount} course payloads`);
  for (let i = 0; i < targetCount; i += 1) {
    const instructor = pickRandom(instructors);
    const coursePayload = generateCoursePayload(i, instructor, uploaderId, pendingQuestions);
    coursesToCreate.push(coursePayload);
  }

  console.log(`📝 Generating ${pendingQuestions.length} linked assessment questions`);
  if (pendingQuestions.length > 0) {
    await Question.insertMany(pendingQuestions, { ordered: false });
  }

  console.log('🚀 Creating courses with sections, videos, tests, and PDFs');
  for (const coursePayload of coursesToCreate) {
    // eslint-disable-next-line no-await-in-loop
    await Course.create(coursePayload);
  }
};

const connectToDatabase = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables.');
  }

  await mongoose.connect(mongoUri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 5000
  });
};

const run = async () => {
  const start = Date.now();
  console.log('🔄 Initialising instructor & course dataset seeding...');

  await connectToDatabase();
  console.log('✅ Connected to MongoDB');

  try {
    const curator = await ensureContentCurator();

    const expertisePool = COURSE_THEMES.flatMap((theme) => theme.topics);
    const instructors = await createInstructors(INSTRUCTOR_TARGET, expertisePool);

    await createCourses(COURSE_TARGET, instructors, curator._id);

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`🎉 Dataset seeding complete in ${duration}s`);
    console.log(`   ▸ Instructors in collection: ${await Instructor.countDocuments()}`);
    console.log(`   ▸ Courses in collection: ${await Course.countDocuments()}`);
    console.log(`   ▸ Questions in collection: ${await Question.countDocuments()}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
};

module.exports = {
  run,
  generateCoursePayload,
  generateSections,
  buildQuestion,
  createCourses,
  createInstructors,
  ensureContentCurator
};

if (require.main === module) {
  run()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
