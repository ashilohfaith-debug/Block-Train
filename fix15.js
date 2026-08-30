const fs = require('fs');

function processFile(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    
    // Replace TrackLines with Sec parameter
    content = content.replace(/onClick=\{\(sId\) => onTrackClick\?\.\(\(.*?)\\)\}/g, (match, p1) => {
        return onClick={(sId) => onTrackClick?.(\${p1}\)} isBlocked={(sId) => blockedBlocks.includes(\${p1}\)};
    });
    
    // Replace TrackCurves without Sec parameter
    content = content.replace(/onClick=\{\(\) => onTrackClick\?\.\(\(.*?)\\)\}/g, (match, p1) => {
        return onClick={() => onTrackClick?.(\${p1}\)} isBlocked={blockedBlocks.includes(\${p1}\)};
    });

    fs.writeFileSync(filename, content);
}

processFile('frontend/src/components/track/StaticInfrastructure.tsx');
processFile('frontend/src/components/track/EntryExitTracks.tsx');
