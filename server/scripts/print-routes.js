/**
 * 临时脚本：打印已挂载的所有 API 路由（验证用，可随时删除）
 */
const app = require('../src/app');

console.log('=== Server app loaded OK ===');

function mountPath(layer) {
  // Express router 挂载路径编码在 regexp 中，例如 ^\/api\/auth\/?(?=\/|$)
  const src = layer.regexp.source;
  const m = src.match(/\^\\\/(.+?)\\\/\?/);
  return m ? `/${m[1].replace(/\\\//g, '/')}` : '/';
}

function collect(stack, base, out) {
  stack.forEach((layer) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
      out.push(`${methods.padEnd(7)} ${base}${layer.route.path === '/' ? '' : layer.route.path}`);
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      collect(layer.handle.stack, base, out);
    }
  });
}

const out = [];
app._router.stack.forEach((layer) => {
  if (layer.name === 'router' && layer.handle && layer.handle.stack) {
    collect(layer.handle.stack, mountPath(layer), out);
  }
});

console.log('Route tree:');
out.forEach((line) => console.log(`  ${line}`));
console.log(`Total endpoints: ${out.length}`);
