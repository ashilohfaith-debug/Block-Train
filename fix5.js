const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/map/DigitalTwinMap.tsx', 'utf8');
c = c.replace(/export const DigitalTwinMap = React\.memo\(\(\{ speedMultiplier = 1, hideTrains = false \}: \{ speedMultiplier\?: number, hideTrains\?: boolean \}\) => \{/, "export const DigitalTwinMap = React.memo(({ speedMultiplier = 1, hideTrains = false, interactive = false, onTrackClick }: { speedMultiplier?: number, hideTrains?: boolean, interactive?: boolean, onTrackClick?: (id: string) => void }) => {");
c = c.replace(/<StaticInfrastructure \/>/, '<StaticInfrastructure interactive={interactive} onTrackClick={onTrackClick} />');
fs.writeFileSync('frontend/src/components/map/DigitalTwinMap.tsx', c);
