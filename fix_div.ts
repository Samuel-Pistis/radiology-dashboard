import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/pages/staff-activity/StaffActivity.tsx';
let content = readFileSync(filePath, 'utf-8');

// Replace all instances of `</div >` with `</div>`
content = content.replace(/<\/div\s+>/g, '</div>');

writeFileSync(filePath, content, 'utf-8');
console.log('Fixed div spacing syntax.');
