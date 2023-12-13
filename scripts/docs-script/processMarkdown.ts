import { readdirSync, readFileSync, statSync, writeFileSync, unlinkSync } from "fs";
import path from "path";

function removeListCharacters(markdown: string): string {
  // Match list items with bullets, numbered lists, or other list-type characters
  // const listRegex = /^(\s*[\*\-\+\•\▸]\s*|\s*\d+\.\s*|\s*\w\.\s*)/;
  const listRegex = /^(\s*[\*\-\+\•\▸]\s|^\s*\d+\.\s|^\s*\w\.\s)/;
  
  // Split the Markdown file into lines
  const lines = markdown.split('\n');

  // Track whether a list is currently in progress
  let inList = false;

  // Iterate through each line and remove list characters if necessary
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(listRegex);

    if (match) {
      // Check if the list is continuing or if it's a new list
      if (!inList && !lines[i+1].match(listRegex)) {
        // Remove list characters
        lines[i] = line.replace(listRegex, '');
      }
      inList = true;
    } else {
      inList = false;
    }
  }

  // Join the lines back into a single string
  const result = lines.join('\n');

  return result;
}

function processUrls(markdown: string, itemPath: string): string {
  // remove extension .md from urls
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const editedMarkdown = markdown.replace(linkRegex, (match, text, url) => {
    if(url.split('.').pop().startsWith('md'))
    {
      const hash = url.split('.').pop().replace('md', '')
      let editedUrl = (url.split('.').slice(0, -1)).join('.')+hash;
      if(editedUrl.startsWith('../') && editedUrl.split('/').length > 1)
      {
        editedUrl = `/sdks/skyflow-js/${editedUrl.split('/').slice(1).join('/')}`;
      }
      else
      {
        editedUrl = `/sdks/skyflow-js/${itemPath.split('/')[1]}/${editedUrl}`;
      }
      return `[${text}](${editedUrl})`;
    }
    return `[${text}](${url})`;
  });
  return editedMarkdown;
}

function createEnumerationTable(markdown) {
  const enumMembersRegex = /### (.+)[\s\S]*?\*\*(.+)\*\* = `(.+)`/g;
  const matches = [...markdown.matchAll(enumMembersRegex)];
  const lines = markdown.split('\n');

  if (matches.length === 0) {
    return ''; // No enumeration members found
  }

  const index = lines.indexOf('## Enumeration Members')

  let editedMarkdown = `${lines.slice(0, index+1). join('\n')}\n\n| Member | Value |\n| --- | --- |`;

  for (const match of matches) {
    const member = match[1];
    const value = match[3];
    editedMarkdown += `\n| ${member} | ${value} |`;
  }
  editedMarkdown += '\n';
  return editedMarkdown;
}


function processMarkdown(markdown: string, isEnum: boolean, itemPath: string): string {
  const processLists = removeListCharacters(markdown);

  const editUrls = processUrls(processLists, itemPath);

  let processedMarkdown = editUrls;
  
  if(isEnum)
  {
    const processEnums = createEnumerationTable(editUrls);
    processedMarkdown = processEnums;
  }
  
  return processedMarkdown;
}
  
// Example usage
// const markdown = `# Class: Skyflow
// ...
// ### init
// * \`Static\` **init**(\`config\`): [\`default\`](Skyflow.default.md)

// * \`Static\` **init**(\`config\`): [\`IGetByIdInput\`](../interfaces/utils_common.IGetByIdInput.md)

// * \`Static\` **init**(\`config\`): [\`IGetByIdInput\`](../interfaces/utils_common.IGetByIdInput.txt)
// * \`Static\` **init**(\`config\`): [\`IGetByIdInput\`](../interfaces/utils_common.IGetByIdInput)
// ...
// `;

function readFolderStructure(folderPath: string, isEnum: boolean) {
  const folderContents = readdirSync(folderPath);
  folderContents.forEach((item) => {
    const itemPath = path.join(folderPath, item);
    const isDirectory = statSync(itemPath).isDirectory();

    if (isDirectory) {
      if(item == 'enums') {
        readFolderStructure(itemPath, true);
      }
      else{
        readFolderStructure(itemPath, false);
      }
    } else {
      const markdown = readFileSync(itemPath, 'utf8');
      const transformedMarkdown = processMarkdown(markdown, isEnum, itemPath);
      const flaggedMarkdown = '{% env enable="jsSdkRef" %}\n\n' + transformedMarkdown + '\n{% /env %}'
      writeFileSync(itemPath, flaggedMarkdown, 'utf-8');
    }
  });
}

const folderPath = './docs/';
readFolderStructure(folderPath, false);
// const transformedMarkdown = processMarkdown(markdown, true);
// console.log(transformedMarkdown);
const readmePath = path.join(folderPath, 'README.md');
try {
    unlinkSync(readmePath);
} catch (error: any) {
    console.error(`Error updating file: ${error.message}`);
}