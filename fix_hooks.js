const fs = require('fs');
let content = fs.readFileSync('frontend/src/lib/hooks/useTrainPhysics.ts', 'utf8');

// Fix setState in useEffect by initializing state lazily
content = content.replace(/const \[trains, setTrains\] = useState<Train\[\]>\(\[\]\);/, 'const [trains, setTrains] = useState<Train[]>(() => generateTrains(DEFAULT_SPEED_MULTIPLIER));');
content = content.replace(/\s*\/\/ Initialize trains once\s*useEffect\(\(\) => \{\s*setTrains\(generateTrains\(DEFAULT_SPEED_MULTIPLIER\)\);\s*\}, \[\]\);/, '');

// Remove unused variables
content = content.replace(/import \{ Train, TrainType \} from '\.\.\/types';/, "import { Train } from '../types';");
content = content.replace(/import \{ STATION_SPACING, NUM_TRAINS, DEFAULT_SPEED_MULTIPLIER \} from '\.\.\/constants';/, "import { STATION_SPACING, DEFAULT_SPEED_MULTIPLIER } from '../constants';");
content = content.replace(/export const useTrainPhysics = \(speedMultiplier: number\) => \{/, "export const useTrainPhysics = (/* speedMultiplier: number */) => {");

fs.writeFileSync('frontend/src/lib/hooks/useTrainPhysics.ts', content);
