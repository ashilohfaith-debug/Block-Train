const fs = require('fs');

let c = fs.readFileSync('frontend/src/app/maintenance/page.tsx', 'utf8');

c = c.replace(/import \{ DigitalTwinMap \} from '\.\.\/\.\.\/components\/map\/DigitalTwinMap';/, 
"import { DigitalTwinMap } from '../../components/map/DigitalTwinMap';\nimport { useMaintenanceStore } from '../../lib/store';");

c = c.replace(/export default function MaintenancePage\(\) \{/, 
"export default function MaintenancePage() {\n  const addBlock = useMaintenanceStore((state) => state.addBlock);\n  const activeBlocks = useMaintenanceStore((state) => state.activeBlocks);\n  const removeBlock = useMaintenanceStore((state) => state.removeBlock);");

c = c.replace(/<form className=\"space-y-4\" onSubmit=\{\(e\) => \{ e\.preventDefault\(\); alert\('Block requested!'\); setSelectedTrack\(null\); \}\}>/g,
<form className="space-y-4" onSubmit={(e) => { 
              e.preventDefault(); 
              const formData = new FormData(e.currentTarget);
              addBlock({
                id: selectedTrack,
                department: formData.get('dept') as string,
                date: formData.get('date') as string,
                fromTime: formData.get('fromTime') as string,
                toTime: formData.get('toTime') as string
              });
              setSelectedTrack(null); 
            }}>);

c = c.replace(/<select className=\"w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors\">/,
<select name="dept" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors">);

c = c.replace(/<input type=\"date\" className=\"w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors\" required \/>/,
<input name="date" type="date" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors" required />);

c = c.replace(/<input type=\"time\" className=\"w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors\" required \/>/,
<input name="fromTime" type="time" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors" required />);

c = c.replace(/<input type=\"time\" className=\"w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors\" required \/>/, // replace the second one
<input name="toTime" type="time" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors" required />);

// Add Active Blocks Dashboard
c = c.replace(/\{\/\* Map \(Trains Hidden, Interactive enabled\) \*\/\}/,
{/* Active Blocks Dashboard */}
      <div className="absolute right-8 top-24 bottom-8 w-80 z-40 pointer-events-none flex flex-col gap-4">
        {activeBlocks.length > 0 && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md pointer-events-auto flex flex-col max-h-full">
            <h2 className="text-sm font-medium text-white mb-4 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Active Blocks ({activeBlocks.length})
            </h2>
            <div className="overflow-y-auto pr-2 space-y-3">
              {activeBlocks.map((b) => (
                <div key={b.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 relative group">
                  <button onClick={() => removeBlock(b.id)} className="absolute top-2 right-2 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all text-xs">
                    ✕
                  </button>
                  <p className="font-mono text-amber-500 text-[10px] mb-1">{b.department}</p>
                  <p className="text-zinc-200 text-xs mb-2 leading-tight">{b.id}</p>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded">
                    <span>{b.date}</span>
                    <span>{b.fromTime} - {b.toTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map (Trains Hidden, Interactive enabled) */});

fs.writeFileSync('frontend/src/app/maintenance/page.tsx', c);
