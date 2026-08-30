const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const fileMap = {
  'controllers/activeBlockController.js': 'modules/blocks/block.controller.js',
  'services/activeBlockService.js': 'modules/blocks/block.service.js',
  'models/activeBlockModel.js': 'modules/blocks/block.model.js',
  'routes/active_blocks.js': 'modules/blocks/block.routes.js',

  'controllers/dispatchController.js': 'modules/dispatch/dispatch.controller.js',
  'services/dispatchService.js': 'modules/dispatch/dispatch.service.js',
  'services/cloudinaryService.js': 'modules/dispatch/cloudinary.service.js',
  'routes/dispatch.js': 'modules/dispatch/dispatch.routes.js',

  'controllers/workerController.js': 'modules/workers/worker.controller.js',
  'services/workerService.js': 'modules/workers/worker.service.js',
  'models/workerModel.js': 'modules/workers/worker.model.js',
  'routes/workers.js': 'modules/workers/worker.routes.js',

  'ai/aiService.js': 'modules/chatbot/chatbot.service.js',
  'ai/grokClient.js': 'modules/chatbot/grok.client.js',
  'ai/prompts.js': 'modules/chatbot/prompts.js',
  'routes/ai.js': 'modules/chatbot/chatbot.routes.js',

  'optimization/optimizerService.js': 'modules/optimization/optimizer.service.js',
  'optimization/baselineScheduler.js': 'modules/optimization/baseline.scheduler.js',
  'optimization/metricsService.js': 'modules/optimization/metrics.service.js',
  'optimization/priorityService.js': 'modules/optimization/priority.service.js',
  'optimization/explanationService.js': 'modules/optimization/explanation.service.js',
  'routes/optimization.js': 'modules/optimization/optimization.routes.js',

  'db.js': 'core/db.js',
  'middleware/auth.js': 'core/middleware/auth.js',
  'middleware/errorHandler.js': 'core/middleware/errorHandler.js',
  'middleware/rbac.js': 'core/middleware/rbac.js',
  'middleware/security.js': 'core/middleware/security.js',
  'services/auditService.js': 'core/services/auditService.js'
};

const allFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js')) {
      allFiles.push(fullPath);
    }
  });
}
walk(srcDir);

const oldToNew = new Map();
for (const [oldRel, newRel] of Object.entries(fileMap)) {
  oldToNew.set(path.join(srcDir, path.normalize(oldRel)), path.join(srcDir, path.normalize(newRel)));
}

for (const file of allFiles) {
  if (!oldToNew.has(file)) {
    oldToNew.set(file, file);
  }
}

const fileContents = new Map();
for (const [oldPath] of oldToNew) {
  if (fs.existsSync(oldPath)) {
    fileContents.set(oldPath, fs.readFileSync(oldPath, 'utf8'));
  }
}

for (const [oldPath, content] of fileContents) {
  const newPath = oldToNew.get(oldPath);
  const newDir = path.dirname(newPath);
  
  const newContent = content.replace(/require\(['"]([^'"]+)['"]\)/g, (match, reqPath) => {
    if (!reqPath.startsWith('.')) return match;
    
    let targetOldAbs = path.resolve(path.dirname(oldPath), reqPath);
    
    if (!targetOldAbs.endsWith('.js') && !fs.existsSync(targetOldAbs) && fs.existsSync(targetOldAbs + '.js')) {
      targetOldAbs += '.js';
    }

    const targetNewAbs = oldToNew.get(targetOldAbs);
    if (targetNewAbs) {
      let newRelPath = path.relative(newDir, targetNewAbs).replace(/\\/g, '/');
      if (!newRelPath.startsWith('.')) {
        newRelPath = './' + newRelPath;
      }
      if (newRelPath.endsWith('.js')) {
         newRelPath = newRelPath.slice(0, -3);
      }
      return `require('${newRelPath}')`;
    }
    
    return match;
  });
  
  fileContents.set(oldPath, newContent);
}

// Write everything to new paths
for (const [oldPath, content] of fileContents) {
  const newPath = oldToNew.get(oldPath);
  fs.mkdirSync(path.dirname(newPath), { recursive: true });
  fs.writeFileSync(newPath, content, 'utf8');
}

// Delete old files that were moved
for (const [oldPath, newPath] of oldToNew) {
  if (oldPath !== newPath && fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath);
  }
}

console.log('Refactoring complete!');
