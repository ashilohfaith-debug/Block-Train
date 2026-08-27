const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/ui/DashboardHUD.tsx', 'utf8');
c = c.replace(/\{ trains \}: \{ trains: any\[\] \}/, '{ trains }: { trains: import("../../lib/types").Train[] }');
fs.writeFileSync('frontend/src/components/ui/DashboardHUD.tsx', c);

let c2 = fs.readFileSync('frontend/src/lib/stations.ts', 'utf8');
c2 = c2.replace(/let yardEndOffset = p\.endOffset \+ 300;/, 'const yardEndOffset = p.endOffset + 300;');
fs.writeFileSync('frontend/src/lib/stations.ts', c2);

