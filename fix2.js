const fs = require('fs');

function rep(file, search, replace) {
  let c = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, c.replace(search, replace));
}

rep('frontend/src/components/track/TrackLine.tsx', /\{ x1, y1, x2, y2, opacity = 1 \}: any/, '{ x1, y1, x2, y2, opacity = 1 }: { x1: number, y1: number, x2: number, y2: number, opacity?: number }');
rep('frontend/src/components/track/TrackCurve.tsx', /\{ d, opacity = 1 \}: any/, '{ d, opacity = 1 }: { d: string, opacity?: number }');
rep('frontend/src/components/ui/DashboardHUD.tsx', /\{ trains \}: any/, '{ trains }: { trains: any[] }');
rep('frontend/src/lib/stations.ts', /const TESTING_MODE = false;\n/, '');
rep('frontend/src/lib/stations.ts', /let yardEndOffset = p\.endOffset \+ 300;/, 'const yardEndOffset = p.endOffset + 300;');
rep('frontend/src/lib/utils/trackGeometry.ts', /import \{ Station \} from '\.\.\/types';\n/, '');
