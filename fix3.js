const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/train/LiveTrains.tsx', 'utf8');

content = content.replace(/const grad = 'url\(#metal-passenger\)';\n\s*const isFreight = false;/, \
        const isFreight = train.type === 'freight';
        const grad = isFreight ? 'url(#freight-gradient)' : train.type === 'express' ? 'url(#express-gradient)' : 'url(#train-gradient)';
        const filterId = isFreight ? 'url(#glow-freight)' : train.type === 'express' ? 'url(#glow-express)' : 'url(#glow-passenger)';
\);

content = content.replace(/<g transform=\{\\\	ranslate\(\\\$\{train\.x\}\\\, \\\$\{y\}\\\) rotate\(\\\$\{angle\}\\\)\\\\}>/, \
        <g transform={\\\	ranslate(\\\$\{train.x\}, \\\$\{y\}) rotate(\\\$\{angle\})\\\} filter={filterId}>
\);

fs.writeFileSync('frontend/src/components/train/LiveTrains.tsx', content);
