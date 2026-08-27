const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/track/StaticInfrastructure.tsx', 'utf8');

c = c.replace(/<rect x=\{sX - 250\} y=\{station\.platforms\[0\]\.y - 45\} width=\{500\} height=\{\(station\.p \* TRACK_GAP\) \+ 70\} fill="rgba\(255, 255, 255, 0\.05\)" stroke="#374151" strokeWidth="1" rx="8" \/>/,
              '<rect x={sX - 250} y={station.platforms[0].y - 45} width={500} height={(station.p * TRACK_GAP) + 70} fill="rgba(255, 255, 255, 0.05)" stroke="#374151" strokeWidth="1" rx="8" pointerEvents="none" />');
c = c.replace(/<rect x=\{sX - 250\} y=\{station\.platforms\[0\]\.y - 100\} width=\{500\} height=\{50\} fill="#111827" stroke="#3b82f6" strokeWidth="2" rx="25" filter="drop-shadow\(0 4px 6px rgba\(0,0,0,0\.5\)\)" \/>/,
              '<rect x={sX - 250} y={station.platforms[0].y - 100} width={500} height={50} fill="#111827" stroke="#3b82f6" strokeWidth="2" rx="25" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))" pointerEvents="none" />');
c = c.replace(/<text x=\{sX\} y=\{station\.platforms\[0\]\.y - 66\} fill="#ffffff" fontSize="24" textAnchor="middle" fontWeight="900" className="font-mono tracking-widest">/g,
              '<text x={sX} y={station.platforms[0].y - 66} fill="#ffffff" fontSize="24" textAnchor="middle" fontWeight="900" className="font-mono tracking-widest" pointerEvents="none">');

c = c.replace(/<rect \n\s*x=\{pStartX\}\n\s*y=\{py \+ 8\}\n\s*width=\{pWidth\}\n\s*height=\{TRACK_GAP - 16\}\n\s*fill="#1f2937"\n\s*stroke="#374151"\n\s*strokeWidth="1"\n\s*rx="2"\n\s*\/>/g,
              '<rect x={pStartX} y={py + 8} width={pWidth} height={TRACK_GAP - 16} fill="#1f2937" stroke="#374151" strokeWidth="1" rx="2" pointerEvents="none" />');
              
c = c.replace(/<rect \n\s*x=\{pStartX \+ 4\}\n\s*y=\{py \+ 12\}\n\s*width=\{pWidth - 8\}\n\s*height=\{TRACK_GAP - 24\}\n\s*fill="rgba\(55, 65, 81, 0\.4\)"\n\s*rx="1"\n\s*\/>/g,
              '<rect x={pStartX + 4} y={py + 12} width={pWidth - 8} height={TRACK_GAP - 24} fill="rgba(55, 65, 81, 0.4)" rx="1" pointerEvents="none" />');

c = c.replace(/<text x=\{pStartX \+ pWidth\/2\} y=\{py \+ \(TRACK_GAP \/ 2\) \+ 2\} fill="#9ca3af" fontSize="9" textAnchor="middle" fontWeight="700" className="font-mono">/g,
              '<text x={pStartX + pWidth/2} y={py + (TRACK_GAP / 2) + 2} fill="#9ca3af" fontSize="9" textAnchor="middle" fontWeight="700" className="font-mono" pointerEvents="none">');

fs.writeFileSync('frontend/src/components/track/StaticInfrastructure.tsx', c);
