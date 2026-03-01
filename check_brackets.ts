import { readFileSync } from 'fs';

const filePath = 'src/pages/staff-activity/StaffActivity.tsx';
const content = readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

let stack: { char: string, line: number, col: number }[] = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '(' || char === '{' || char === '[') {
            stack.push({ char, line: i + 1, col: j + 1 });
        } else if (char === ')' || char === '}' || char === ']') {
            if (stack.length === 0) {
                console.log(`Unmatched closing ${char} at line ${i + 1}, col ${j + 1}`);
                continue;
            }
            const last = stack.pop()!;
            const expectedMap: Record<string, string> = { '(': ')', '{': '}', '[': ']' };
            if (expectedMap[last.char] !== char) {
                console.log(`Mismatched bracket at line ${i + 1}, col ${j + 1}. Expected ${expectedMap[last.char]}, found ${char}. Opening was at line ${last.line}`);
            }
        }
    }
}

if (stack.length > 0) {
    console.log('Unclosed brackets found:');
    stack.forEach(s => console.log(`Unclosed ${s.char} starting at line ${s.line}, col ${s.col}`));
} else {
    console.log('All basic brackets matched cleanly.');
}
