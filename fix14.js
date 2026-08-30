const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/track/StaticInfrastructure.tsx', 'utf8');

c = c.replace(/export const StaticInfrastructure = React\.memo\(\(\{ interactive, onTrackClick \}: \{ interactive\?: boolean, onTrackClick\?: \(trackId: string\) => void \}\) => \{/,
"export const StaticInfrastructure = React.memo(({ interactive, onTrackClick, blockedBlocks = [] }: { interactive?: boolean, onTrackClick?: (trackId: string) => void, blockedBlocks?: string[] }) => {");

c = c.replace(/<EntryExitTracks interactive=\{interactive\} onTrackClick=\{onTrackClick\} \/>/,
"<EntryExitTracks interactive={interactive} onTrackClick={onTrackClick} blockedBlocks={blockedBlocks} />");

c = c.replace(/<TrackLine x1=\{yardStart\} y1=\{mTop\} x2=\{yardEnd\} y2=\{mTop\} interactive=\{interactive\} onClick=\{\(sId\) => onTrackClick\?\.\(\\$\{station\.name\} - Loop Line 1 \(Sec \$\{sId\}\)\\)\} \/>/g,
<TrackLine x1={yardStart} y1={mTop} x2={yardEnd} y2={mTop} interactive={interactive} onClick={(sId) => onTrackClick?.(\\ - Loop Line 1 (Sec \)\)} isBlocked={(sId) => blockedBlocks.includes(\\ - Loop Line 1 (Sec \)\)} />);

c = c.replace(/<TrackLine x1=\{yardStart\} y1=\{mMid\} x2=\{yardEnd\} y2=\{mMid\} interactive=\{interactive\} onClick=\{\(sId\) => onTrackClick\?\.\(\\$\{station\.name\} - Mainline \(Sec \$\{sId\}\)\\)\} \/>/g,
<TrackLine x1={yardStart} y1={mMid} x2={yardEnd} y2={mMid} interactive={interactive} onClick={(sId) => onTrackClick?.(\\ - Mainline (Sec \)\)} isBlocked={(sId) => blockedBlocks.includes(\\ - Mainline (Sec \)\)} />);

c = c.replace(/<TrackLine x1=\{yardStart\} y1=\{mBot\} x2=\{yardEnd\} y2=\{mBot\} interactive=\{interactive\} onClick=\{\(sId\) => onTrackClick\?\.\(\\$\{station\.name\} - Loop Line 2 \(Sec \$\{sId\}\)\\)\} \/>/g,
<TrackLine x1={yardStart} y1={mBot} x2={yardEnd} y2={mBot} interactive={interactive} onClick={(sId) => onTrackClick?.(\\ - Loop Line 2 (Sec \)\)} isBlocked={(sId) => blockedBlocks.includes(\\ - Loop Line 2 (Sec \)\)} />);

c = c.replace(/<TrackCurve d=\{drawThroat\(yardEnd, mTop, nextYardStart, nTop\)\} interactive=\{interactive\} onClick=\{\(\) => onTrackClick\?\.\(\\$\{blockName\} Down Line\\)\} \/>/g,
<TrackCurve d={drawThroat(yardEnd, mTop, nextYardStart, nTop)} interactive={interactive} onClick={() => onTrackClick?.(\\ Down Line\)} isBlocked={blockedBlocks.includes(\\ Down Line\)} />);

c = c.replace(/<TrackCurve d=\{drawThroat\(yardEnd, mMid, nextYardStart, nMid\)\} interactive=\{interactive\} onClick=\{\(\) => onTrackClick\?\.\(\\$\{blockName\} Main Line\\)\} \/>/g,
<TrackCurve d={drawThroat(yardEnd, mMid, nextYardStart, nMid)} interactive={interactive} onClick={() => onTrackClick?.(\\ Main Line\)} isBlocked={blockedBlocks.includes(\\ Main Line\)} />);

c = c.replace(/<TrackCurve d=\{drawThroat\(yardEnd, mBot, nextYardStart, nBot\)\} interactive=\{interactive\} onClick=\{\(\) => onTrackClick\?\.\(\\$\{blockName\} Up Line\\)\} \/>/g,
<TrackCurve d={drawThroat(yardEnd, mBot, nextYardStart, nBot)} interactive={interactive} onClick={() => onTrackClick?.(\\ Up Line\)} isBlocked={blockedBlocks.includes(\\ Up Line\)} />);

c = c.replace(/<TrackCurve d=\{drawThroat\(dStart, mTop, dEnd, mMid\)\} interactive=\{interactive\} onClick=\{\(\) => onTrackClick\?\.\(\\$\{station\.name\} East Crossover\\)\} \/>/g,
<TrackCurve d={drawThroat(dStart, mTop, dEnd, mMid)} interactive={interactive} onClick={() => onTrackClick?.(\\ East Crossover\)} isBlocked={blockedBlocks.includes(\\ East Crossover\)} />);

c = c.replace(/<TrackCurve d=\{drawThroat\(dStart, mMid, dEnd, mBot\)\} interactive=\{interactive\} onClick=\{\(\) => onTrackClick\?\.\(\\$\{station\.name\} East Main Crossover\\)\} \/>/g,
<TrackCurve d={drawThroat(dStart, mMid, dEnd, mBot)} interactive={interactive} onClick={() => onTrackClick?.(\\ East Main Crossover\)} isBlocked={blockedBlocks.includes(\\ East Main Crossover\)} />);

c = c.replace(/<TrackCurve d=\{drawThroat\(dStart \+ 120, mBot, dEnd \+ 120, mMid\)\} interactive=\{interactive\} onClick=\{\(\) => onTrackClick\?\.\(\\$\{station\.name\} East Outer Crossover\\)\} \/>/g,
<TrackCurve d={drawThroat(dStart + 120, mBot, dEnd + 120, mMid)} interactive={interactive} onClick={() => onTrackClick?.(\\ East Outer Crossover\)} isBlocked={blockedBlocks.includes(\\ East Outer Crossover\)} />);

c = c.replace(/<TrackCurve d=\{drawThroat\(aStart, mMid, aEnd, mTop\)\} interactive=\{interactive\} onClick=\{\(\) => onTrackClick\?\.\(\\$\{station\.name\} West Crossover\\)\} \/>/g,
<TrackCurve d={drawThroat(aStart, mMid, aEnd, mTop)} interactive={interactive} onClick={() => onTrackClick?.(\\ West Crossover\)} isBlocked={blockedBlocks.includes(\\ West Crossover\)} />);

c = c.replace(/<TrackCurve d=\{drawThroat\(aStart, mBot, aEnd, mMid\)\} interactive=\{interactive\} onClick=\{\(\) => onTrackClick\?\.\(\\$\{station\.name\} West Main Crossover\\)\} \/>/g,
<TrackCurve d={drawThroat(aStart, mBot, aEnd, mMid)} interactive={interactive} onClick={() => onTrackClick?.(\\ West Main Crossover\)} isBlocked={blockedBlocks.includes(\\ West Main Crossover\)} />);

c = c.replace(/<TrackCurve d=\{drawThroat\(aStart - 120, mMid, aEnd - 120, mBot\)\} interactive=\{interactive\} onClick=\{\(\) => onTrackClick\?\.\(\\$\{station\.name\} West Outer Crossover\\)\} \/>/g,
<TrackCurve d={drawThroat(aStart - 120, mMid, aEnd - 120, mBot)} interactive={interactive} onClick={() => onTrackClick?.(\\ West Outer Crossover\)} isBlocked={blockedBlocks.includes(\\ West Outer Crossover\)} />);

c = c.replace(/<TrackCurve d=\{drawThroat\(divergeStart, mainLineY, sZoneStart, py\)\} interactive=\{interactive\} onClick=\{\(sId\) => onTrackClick\?\.\(\\$\{station\.name\} - PF\$\{pIndex \+ 1\} Diverge\\)\} \/>/g,
<TrackCurve d={drawThroat(divergeStart, mainLineY, sZoneStart, py)} interactive={interactive} onClick={() => onTrackClick?.(\\ - PF\ Diverge\)} isBlocked={blockedBlocks.includes(\\ - PF\ Diverge\)} />);

c = c.replace(/<TrackLine x1=\{sZoneStart\} y1=\{py\} x2=\{sZoneEnd\} y2=\{py\} interactive=\{interactive\} onClick=\{\(sId\) => onTrackClick\?\.\(\\$\{station\.name\} - PF\$\{pIndex \+ 1\} Loop \(Sec \$\{sId\}\)\\)\} \/>/g,
<TrackLine x1={sZoneStart} y1={py} x2={sZoneEnd} y2={py} interactive={interactive} onClick={(sId) => onTrackClick?.(\\ - PF\ Loop (Sec \)\)} isBlocked={(sId) => blockedBlocks.includes(\\ - PF\ Loop (Sec \)\)} />);

c = c.replace(/<TrackCurve d=\{drawThroat\(sZoneEnd, py, convergeEnd, mainLineY\)\} interactive=\{interactive\} onClick=\{\(sId\) => onTrackClick\?\.\(\\$\{station\.name\} - PF\$\{pIndex \+ 1\} Converge\\)\} \/>/g,
<TrackCurve d={drawThroat(sZoneEnd, py, convergeEnd, mainLineY)} interactive={interactive} onClick={() => onTrackClick?.(\\ - PF\ Converge\)} isBlocked={blockedBlocks.includes(\\ - PF\ Converge\)} />);

fs.writeFileSync('frontend/src/components/track/StaticInfrastructure.tsx', c);
