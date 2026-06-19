const fs = require('fs/promises');
const path = require('path');

function toAbsolutePath(relativePath) {
  return path.join(process.cwd(), relativePath);
}

async function readJsonFile(relativePath, fallbackValue) {
  const absolutePath = toAbsolutePath(relativePath);

  try {
    const content = await fs.readFile(absolutePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeJsonFile(relativePath, fallbackValue);
      return fallbackValue;
    }

    throw error;
  }
}

async function writeJsonFile(relativePath, value) {
  const absolutePath = toAbsolutePath(relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

module.exports = {
  readJsonFile,
  writeJsonFile
};
