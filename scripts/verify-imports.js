const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const errors = [];

const shouldIncludeFile = (filePath) => {
  const relative = path.relative(projectRoot, filePath);
  if (!relative.endsWith('.js')) {
    return false;
  }

  // Skip files inside tests directories to speed things up
  if (relative.startsWith(path.join('tests', path.sep))) {
    return false;
  }

  return true;
};

const requireFile = (filePath) => {
  try {
    require(filePath);
  } catch (error) {
    errors.push({ filePath, error });
  }
};

const walkDirectory = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkDirectory(fullPath);
    } else if (entry.isFile() && shouldIncludeFile(fullPath)) {
      requireFile(fullPath);
    }
  });
};

console.log(`Verifying module imports under src (NODE_ENV=${process.env.NODE_ENV || 'development'})...`);
walkDirectory(srcDir);

if (errors.length > 0) {
  console.error('Module verification failed. The following files could not be imported:');
  errors.forEach(({ filePath, error }) => {
    console.error(`- ${path.relative(projectRoot, filePath)}: ${error.message}`);
  });
  process.exit(1);
}

console.log('All modules loaded successfully.');
