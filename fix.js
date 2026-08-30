const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/track/StaticInfrastructure.tsx', 'utf8');

// Replace corrupted literals with backticks and template variables
content = content.replace(/\\block-yard-\\\--1\\/g, "\lock-yard-\--1\");
content = content.replace(/\\block-yard-\\-0\\/g, "\lock-yard-\-0\");
content = content.replace(/\\block-yard-\\-1\\/g, "\lock-yard-\-1\");

content = content.replace(/\\block-curve-\\\--1\\/g, "\lock-curve-\--1\");
content = content.replace(/\\block-curve-\\-0\\/g, "\lock-curve-\-0\");
content = content.replace(/\\block-curve-\\-1\\/g, "\lock-curve-\-1\");

content = content.replace(/\\block-cross-\\-R1\\/g, "\lock-cross-\-R1\");
content = content.replace(/\\block-cross-\\-R2\\/g, "\lock-cross-\-R2\");
content = content.replace(/\\block-cross-\\-L1\\/g, "\lock-cross-\-L1\");
content = content.replace(/\\block-cross-\\-L2\\/g, "\lock-cross-\-L2\");

content = content.replace(/\\block-plat-div-\\\-\\\\/g, "\lock-plat-div-\-\\");
content = content.replace(/\\block-plat-line-\\\-\\\\/g, "\lock-plat-line-\-\\");
content = content.replace(/\\block-plat-con-\\\-\\\\/g, "\lock-plat-con-\-\\");

fs.writeFileSync('frontend/src/components/track/StaticInfrastructure.tsx', content);
