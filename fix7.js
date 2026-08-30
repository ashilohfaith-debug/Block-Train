const fs = require('fs');

let staticInf = fs.readFileSync('frontend/src/components/track/StaticInfrastructure.tsx', 'utf8');
staticInf = staticInf.replace(/onClick=\{\(\) => onTrackClick\?\.\(\\$\{station\.name\} - Loop Line 1\\)\}/g, "onClick={(sId) => onTrackClick?.(${station.name} - Loop Line 1 (Sec ))}");
staticInf = staticInf.replace(/onClick=\{\(\) => onTrackClick\?\.\(\\$\{station\.name\} - Mainline\\)\}/g, "onClick={(sId) => onTrackClick?.(${station.name} - Mainline (Sec ))}");
staticInf = staticInf.replace(/onClick=\{\(\) => onTrackClick\?\.\(\\$\{station\.name\} - Loop Line 2\\)\}/g, "onClick={(sId) => onTrackClick?.(${station.name} - Loop Line 2 (Sec ))}");
fs.writeFileSync('frontend/src/components/track/StaticInfrastructure.tsx', staticInf);

let entryExit = fs.readFileSync('frontend/src/components/track/EntryExitTracks.tsx', 'utf8');
entryExit = entryExit.replace(/export const EntryExitTracks = React\.memo\(\(\) => \{/, "export const EntryExitTracks = React.memo(({ interactive, onTrackClick }: { interactive?: boolean, onTrackClick?: (id: string) => void }) => {");
entryExit = entryExit.replace(/<TrackLine x1=\{0\} y1=\{getStationMainY\(firstSt, -1\)\} x2=\{firstYardStart\} y2=\{getStationMainY\(firstSt, -1\)\} \/>/, "<TrackLine x1={0} y1={getStationMainY(firstSt, -1)} x2={firstYardStart} y2={getStationMainY(firstSt, -1)} interactive={interactive} onClick={(sId) => onTrackClick?.(Void to  - Down (Sec ))} />");
entryExit = entryExit.replace(/<TrackLine x1=\{0\} y1=\{getStationMainY\(firstSt, 0\)\} x2=\{firstYardStart\} y2=\{getStationMainY\(firstSt, 0\)\} \/>/, "<TrackLine x1={0} y1={getStationMainY(firstSt, 0)} x2={firstYardStart} y2={getStationMainY(firstSt, 0)} interactive={interactive} onClick={(sId) => onTrackClick?.(Void to  - Main (Sec ))} />");
entryExit = entryExit.replace(/<TrackLine x1=\{0\} y1=\{getStationMainY\(firstSt, 1\)\} x2=\{firstYardStart\} y2=\{getStationMainY\(firstSt, 1\)\} \/>/, "<TrackLine x1={0} y1={getStationMainY(firstSt, 1)} x2={firstYardStart} y2={getStationMainY(firstSt, 1)} interactive={interactive} onClick={(sId) => onTrackClick?.(Void to  - Up (Sec ))} />");

entryExit = entryExit.replace(/<TrackLine x1=\{lastYardEnd\} y1=\{getStationMainY\(lastSt, -1\)\} x2=\{CANVAS_WIDTH\} y2=\{getStationMainY\(lastSt, -1\)\} \/>/, "<TrackLine x1={lastYardEnd} y1={getStationMainY(lastSt, -1)} x2={CANVAS_WIDTH} y2={getStationMainY(lastSt, -1)} interactive={interactive} onClick={(sId) => onTrackClick?.(${lastSt.name} to Void - Down (Sec ))} />");
entryExit = entryExit.replace(/<TrackLine x1=\{lastYardEnd\} y1=\{getStationMainY\(lastSt, 0\)\} x2=\{CANVAS_WIDTH\} y2=\{getStationMainY\(lastSt, 0\)\} \/>/, "<TrackLine x1={lastYardEnd} y1={getStationMainY(lastSt, 0)} x2={CANVAS_WIDTH} y2={getStationMainY(lastSt, 0)} interactive={interactive} onClick={(sId) => onTrackClick?.(${lastSt.name} to Void - Main (Sec ))} />");
entryExit = entryExit.replace(/<TrackLine x1=\{lastYardEnd\} y1=\{getStationMainY\(lastSt, 1\)\} x2=\{CANVAS_WIDTH\} y2=\{getStationMainY\(lastSt, 1\)\} \/>/, "<TrackLine x1={lastYardEnd} y1={getStationMainY(lastSt, 1)} x2={CANVAS_WIDTH} y2={getStationMainY(lastSt, 1)} interactive={interactive} onClick={(sId) => onTrackClick?.(${lastSt.name} to Void - Up (Sec ))} />");
fs.writeFileSync('frontend/src/components/track/EntryExitTracks.tsx', entryExit);
