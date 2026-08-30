const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/track/StaticInfrastructure.tsx', 'utf8');
c = c.replace(/\{!plat\.isMainline && \(\n\s*<>\n\s*<TrackCurve d=\{drawThroat\(divergeStart, mainLineY, sZoneStart, py\)\} \/>\n\s*<TrackLine x1=\{sZoneStart\} y1=\{py\} x2=\{sZoneEnd\} y2=\{py\} \/>\n\s*<TrackCurve d=\{drawThroat\(sZoneEnd, py, convergeEnd, mainLineY\)\} \/>\n\s*<\/>\n\s*\)\}/g, 
{!plat.isMainline && (
                    <>
                      <TrackCurve d={drawThroat(divergeStart, mainLineY, sZoneStart, py)} interactive={interactive} onClick={(sId) => onTrackClick?.(\\ - PF\ Diverge (Sec \)\)} />
                      <TrackLine x1={sZoneStart} y1={py} x2={sZoneEnd} y2={py} interactive={interactive} onClick={(sId) => onTrackClick?.(\\ - PF\ Loop (Sec \)\)} />
                      <TrackCurve d={drawThroat(sZoneEnd, py, convergeEnd, mainLineY)} interactive={interactive} onClick={(sId) => onTrackClick?.(\\ - PF\ Converge (Sec \)\)} />
                    </>
                  )});
fs.writeFileSync('frontend/src/components/track/StaticInfrastructure.tsx', c);
