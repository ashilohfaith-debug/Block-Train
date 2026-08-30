const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/track/StaticInfrastructure.tsx', 'utf8');

// Fix TrackCurve sId errors
c = c.replace(/<TrackCurve (.*?) onClick=\{\(sId:? any\?\) => onTrackClick\?\.\(\(.*?)\\)\} isBlocked=\{\(sId:? any\?\) => blockedBlocks\?\.includes\(\(.*?)\\)\} \/>/g, 
"<TrackCurve  onClick={() => onTrackClick?.($2)} isBlocked={blockedBlocks?.includes($3)} />");

c = c.replace(/<TrackCurve (.*?) onClick=\{\(sId:? any\?\) => onTrackClick\?\.\(\(.*?)\\)\} \/>/g, 
"<TrackCurve  onClick={() => onTrackClick?.($2)} />");

// Make sure (sId: number) is added to TrackLine
c = c.replace(/onClick=\{\(sId\) =>/g, "onClick={(sId: number)");
c = c.replace(/isBlocked=\{\(sId\) =>/g, "isBlocked={(sId: number)");

// Because of my double replace, there might be multiple. I will just fix it broadly.
c = c.replace(/isBlocked=\{\(sId: number =>/g, "isBlocked={(sId: number) =>");
c = c.replace(/onClick=\{\(sId: number =>/g, "onClick={(sId: number) =>");

fs.writeFileSync('frontend/src/components/track/StaticInfrastructure.tsx', c);

let e = fs.readFileSync('frontend/src/components/track/EntryExitTracks.tsx', 'utf8');
e = e.replace(/onClick=\{\(sId\) =>/g, "onClick={(sId: number) =>");
e = e.replace(/isBlocked=\{\(sId\) =>/g, "isBlocked={(sId: number) =>");
fs.writeFileSync('frontend/src/components/track/EntryExitTracks.tsx', e);
