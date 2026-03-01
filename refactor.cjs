const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(dir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Replace standalone `uppercase` class within className
    // Handle both double quotes and curly braces with template literals
    content = content.replace(/className=(["'])(.*?)\buppercase\b(.*?)\1/g, (match, quote, before, after) => {
        return `className=${quote}${(before + after).replace(/\s+/g, ' ').trim()}${quote}`;
    });

    // Handle template literals inside curly braces: className={`... uppercase ...`}
    content = content.replace(/className=\{`([^`]*?)\buppercase\b([^`]*?)`\}/g, (match, before, after) => {
        return `className={\`${(before + after).replace(/\s+/g, ' ').trim()}\`}`;
    });

    // Replace color classes
    content = content.replace(/\btext-black\/60\b/g, 'text-text-secondary');
    content = content.replace(/\btext-black\/70\b/g, 'text-text-secondary');
    content = content.replace(/\btext-black\/50\b/g, 'text-text-muted');
    content = content.replace(/\btext-black\/40\b/g, 'text-text-muted');
    content = content.replace(/\btext-black\/30\b/g, 'text-text-muted');
    content = content.replace(/\btext-black\b(?!\/)/g, 'text-text-primary');

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Processed ${file}`);
});
