import fs from 'fs';

const markdown = fs.readFileSync('debug-firecrawl.md', 'utf8');

function extractSection(markdown: string, startHeader: string, endHeader: string): string {
  const startIdx = markdown.indexOf(startHeader);
  if (startIdx === -1) return "";

  const afterStart = startIdx + startHeader.length;
  let endIdx = markdown.indexOf(endHeader, afterStart);
  if (endIdx === -1) endIdx = markdown.length;

  return markdown.substring(startIdx, endIdx);
}

const subsSection = extractSection(markdown, "## Cambios", "## Amonestaciones");
console.log("SUBS SECTION EXTRACTED LENGTH:", subsSection.length);

const subPattern = /(?:(?:^|\n|\||\*\*)\s*(\d{1,3})['′]?[^\w\[\]]*)?\[([^\]]+)\]\([^)]*profil\/spieler[^)]*\)\s*\[([^\]]+)\]\([^)]*profil\/spieler[^)]*\)/gi;
let match;
let subsCount = 0;

while ((match = subPattern.exec(subsSection)) !== null) {
    console.log("MATCH:", match[1], match[2], match[3]);
    subsCount++;
}

console.log("TOTAL SUBS:", subsCount);
