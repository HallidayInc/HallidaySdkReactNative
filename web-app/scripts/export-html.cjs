const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../dist/index.html');
const outputPath = path.join(__dirname, '../../src/webAppHtml.ts');

const html = fs.readFileSync(htmlPath, 'utf-8');
const output = `// AUTO-GENERATED — do not edit manually.\n// Regenerate by running: cd web-app && npm run build\nexport const WEB_APP_HTML = ${JSON.stringify(html)};\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output, 'utf-8');

console.log(`Generated ${path.relative(process.cwd(), outputPath)} (${html.length} bytes)`);
