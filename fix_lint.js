const fs = require('fs');
let content;

// TrackLine
content = fs.readFileSync('frontend/src/components/track/TrackLine.tsx', 'utf8');
content = content.replace(/\{ x1, y1, x2, y2, opacity = 1, isBlocked, interactive, onClick \}: any/, "{ x1, y1, x2, y2, opacity = 1, isBlocked, interactive, onClick }: { x1: number, y1: number, x2: number, y2: number, opacity?: number, isBlocked?: boolean, interactive?: boolean, onClick?: () => void }");
content = content + "\nTrackLine.displayName = 'TrackLine';\n";
fs.writeFileSync('frontend/src/components/track/TrackLine.tsx', content);

// TrackCurve
content = fs.readFileSync('frontend/src/components/track/TrackCurve.tsx', 'utf8');
content = content.replace(/\{ d, opacity = 1, isBlocked, interactive, onClick \}: any/, "{ d, opacity = 1, isBlocked, interactive, onClick }: { d: string, opacity?: number, isBlocked?: boolean, interactive?: boolean, onClick?: () => void }");
content = content + "\nTrackCurve.displayName = 'TrackCurve';\n";
fs.writeFileSync('frontend/src/components/track/TrackCurve.tsx', content);

// Coach
content = fs.readFileSync('frontend/src/components/train/Coach.tsx', 'utf8');
content = content.replace(/\{ x, length, width, gradient, isFreight, gap \}: any/, "{ x, length, width, gradient, isFreight, gap }: { x: number, length: number, width: number, gradient: string, isFreight: boolean, gap: number }");
fs.writeFileSync('frontend/src/components/train/Coach.tsx', content);

// EntryExitTracks
content = fs.readFileSync('frontend/src/components/track/EntryExitTracks.tsx', 'utf8');
content = content + "\nEntryExitTracks.displayName = 'EntryExitTracks';\n";
fs.writeFileSync('frontend/src/components/track/EntryExitTracks.tsx', content);

// StaticInfrastructure
content = fs.readFileSync('frontend/src/components/track/StaticInfrastructure.tsx', 'utf8');
content = content.replace(/\{ interactive, blockedBlocks = \[\], toggleBlock \}: any/, "{ interactive, blockedBlocks = [], toggleBlock }: { interactive?: boolean, blockedBlocks?: string[], toggleBlock?: (id: string) => void }");
content = content + "\nStaticInfrastructure.displayName = 'StaticInfrastructure';\n";
fs.writeFileSync('frontend/src/components/track/StaticInfrastructure.tsx', content);

// DigitalTwinMap
content = fs.readFileSync('frontend/src/components/map/DigitalTwinMap.tsx', 'utf8');
content = content.replace(/import \{ Train \} from '\.\.\/\.\.\/lib\/types';\n/, "");
content = content + "\nDigitalTwinMap.displayName = 'DigitalTwinMap';\n";
fs.writeFileSync('frontend/src/components/map/DigitalTwinMap.tsx', content);

// DashboardHUD
content = fs.readFileSync('frontend/src/components/ui/DashboardHUD.tsx', 'utf8');
content = content.replace(/\{ trains \}: any/, "{ trains }: { trains: any[] }");
fs.writeFileSync('frontend/src/components/ui/DashboardHUD.tsx', content);

// stations.ts
content = fs.readFileSync('frontend/src/lib/stations.ts', 'utf8');
content = content.replace(/const TESTING_MODE = false;\n/, "");
content = content.replace(/let yardEndOffset = p\.endOffset \+ 300;/, "const yardEndOffset = p.endOffset + 300;");
fs.writeFileSync('frontend/src/lib/stations.ts', content);

// trackGeometry.ts
content = fs.readFileSync('frontend/src/lib/utils/trackGeometry.ts', 'utf8');
content = content.replace(/import \{ Station \} from '\.\.\/types';\n/, "");
content = content.replace(/station: any/, "station: { p: number, yOffset: number }");
fs.writeFileSync('frontend/src/lib/utils/trackGeometry.ts', content);

