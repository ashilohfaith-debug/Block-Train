const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/track/StaticInfrastructure.tsx', 'utf8');
c = c.replace(/onClick=\{\(sId\) =>/g, "onClick={(sId: number) =>");
c = c.replace(/isBlocked=\{\(sId\) =>/g, "isBlocked={(sId: number) =>");
fs.writeFileSync('frontend/src/components/track/StaticInfrastructure.tsx', c);

let e = fs.readFileSync('frontend/src/components/track/EntryExitTracks.tsx', 'utf8');
e = e.replace(/onClick=\{\(sId\) =>/g, "onClick={(sId: number) =>");
e = e.replace(/isBlocked=\{\(sId\) =>/g, "isBlocked={(sId: number) =>");
fs.writeFileSync('frontend/src/components/track/EntryExitTracks.tsx', e);
