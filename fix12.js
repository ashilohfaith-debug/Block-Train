const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/track/StaticInfrastructure.tsx', 'utf8');

c = c.replace(/onClick=\{\(sId\) => onTrackClick\?\.\(\(.*?)\\)\}/g, "trackId={$1} onClick={(sId) => onTrackClick?.($1)}");
c = c.replace(/onClick=\{\(\) => onTrackClick\?\.\(\(.*?)\\)\}/g, "trackId={$1} onClick={() => onTrackClick?.($1)}");

fs.writeFileSync('frontend/src/components/track/StaticInfrastructure.tsx', c);

let e = fs.readFileSync('frontend/src/components/track/EntryExitTracks.tsx', 'utf8');
e = e.replace(/onClick=\{\(sId\) => onTrackClick\?\.\(\(.*?)\\)\}/g, "trackId={$1} onClick={(sId) => onTrackClick?.($1)}");
fs.writeFileSync('frontend/src/components/track/EntryExitTracks.tsx', e);
