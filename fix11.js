const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/track/StaticInfrastructure.tsx', 'utf8');

c = c.replace(/fill="none" stroke="#4b5563" strokeWidth="2" opacity="0\.8" \/>/g, 'fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.8" pointerEvents="none" />');
c = c.replace(/stroke="#facc15" strokeWidth="1" strokeDasharray="4 4" opacity="0\.8" \/>/g, 'stroke="#facc15" strokeWidth="1" strokeDasharray="4 4" opacity="0.8" pointerEvents="none" />');

fs.writeFileSync('frontend/src/components/track/StaticInfrastructure.tsx', c);
