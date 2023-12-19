const fs = require('fs');
const path = require('path');

function getModuleName(filePath) {
  const parsedPath = path.parse(filePath);
  let moduleName = parsedPath.name;

  if (moduleName.endsWith('.default')) {
    moduleName = moduleName.slice(0, -8);
  }

  return moduleName;
}

const directoryPath = path.join(__dirname, '../../docs/classes');

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.error(`Error reading directory: ${err}`);
    return;
  }
  files.forEach(file => {
    if (path.extname(file) === '.md') {
      const filePath = path.join(directoryPath, file);
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Error reading file: ${err}`);
          return;
        }
        const lines = data.split('\n');
        lines[0] = `# Class: ${getModuleName(path.parse(file).name)}`;
        const updatedContent = lines.join('\n');
        fs.writeFile(filePath, updatedContent, err => {
          if (err) {
            console.error(`Error writing file: ${err}`);
          } else {
            console.log(`Updated file: ${filePath}`);
          }
        });
      });
    }
  });
});