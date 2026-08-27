const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/map/DigitalTwinMap.tsx', 'utf8');

c = c.replace(/import \{ LiveTrains \} from '\.\.\/train\/LiveTrains';/, "import { LiveTrains } from '../train/LiveTrains';\nimport { useMaintenanceStore } from '../../lib/store';");

c = c.replace(/export const DigitalTwinMap = React\.memo\(\(\{ speedMultiplier = 1, hideTrains = false, interactive = false, onTrackClick \}: \{ speedMultiplier\?: number, hideTrains\?: boolean, interactive\?: boolean, onTrackClick\?: \(id: string\) => void \}\) => \{/,
"export const DigitalTwinMap = React.memo(({ speedMultiplier = 1, hideTrains = false, interactive = false, onTrackClick }: { speedMultiplier?: number, hideTrains?: boolean, interactive?: boolean, onTrackClick?: (id: string) => void }) => {\n  const activeBlocks = useMaintenanceStore((state) => state.activeBlocks.map(b => b.id));");

c = c.replace(/<StaticInfrastructure interactive=\{interactive\} onTrackClick=\{onTrackClick\} \/>/, "<StaticInfrastructure interactive={interactive} onTrackClick={onTrackClick} blockedBlocks={activeBlocks} />");

fs.writeFileSync('frontend/src/components/map/DigitalTwinMap.tsx', c);
