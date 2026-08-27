const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/track/TrackLine.tsx', 'utf8');
c = c.replace(/\{ x1, y1, x2, y2, opacity, interactive, onClick \}: any/, "{ x1, y1, x2, y2, opacity, interactive, onClick }: { x1: number, y1: number, x2: number, y2: number, opacity?: number, interactive?: boolean, onClick?: () => void }");
fs.writeFileSync('frontend/src/components/track/TrackLine.tsx', c);

c = fs.readFileSync('frontend/src/components/ui/DashboardHUD.tsx', 'utf8');
c = c.replace(/\{ trains \}: any/, '{ trains }: { trains: import("../../lib/types").Train[] }');
fs.writeFileSync('frontend/src/components/ui/DashboardHUD.tsx', c);

c = fs.readFileSync('frontend/src/lib/stations.ts', 'utf8');
c = c.replace(/let yardEndOffset = p\.endOffset \+ 300;/, 'const yardEndOffset = p.endOffset + 300;');
fs.writeFileSync('frontend/src/lib/stations.ts', c);

c = fs.readFileSync('frontend/src/components/track/TrackCurve.tsx', 'utf8');
c = c.replace(/\{ d, opacity = 1, interactive, onClick \}: any/, '{ d, opacity = 1, interactive, onClick }: { d: string, opacity?: number, interactive?: boolean, onClick?: () => void }');
fs.writeFileSync('frontend/src/components/track/TrackCurve.tsx', c);

