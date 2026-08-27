const fs = require('fs');

let s = fs.readFileSync('frontend/src/components/ui/CustomSelect.tsx', 'utf8');
s = s.replace(/className=\{\\p-3 hover:bg-zinc-800 cursor-pointer transition-colors \\\\\}/, "className={p-3 hover:bg-zinc-800 cursor-pointer transition-colors }");
fs.writeFileSync('frontend/src/components/ui/CustomSelect.tsx', s);

let c = fs.readFileSync('frontend/src/components/ui/CustomCalendar.tsx', 'utf8');
c = c.replace(/return \\\\-\\\\-\\\\\;/, "return ${d.getFullYear()}--;");
c = c.replace(/key=\{\\empty-\\\}/, "key={empty-}");
c = c.replace(/className=\{\\p-1 text-center text-xs rounded-full cursor-pointer transition-colors \\\\\}/, "className={p-1 text-center text-xs rounded-full cursor-pointer transition-colors }");
fs.writeFileSync('frontend/src/components/ui/CustomCalendar.tsx', c);
