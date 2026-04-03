const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const js = content.split('<script>')[1].split('</script>')[0];
let out = `
const document = {
  getElementById: id => ({
    value: id === 'time-view' ? '120' : (id === 'username' ? 'demo' : ''),
    classList: { add:()=>0, remove:()=>0, toggle:()=>0 },
    innerText: '',
    innerHTML: '',
    getContext: () => ({}),
    getAttribute: () => 'test',
    checkValidity: () => true,
    querySelector: () => ({ innerHTML: '' })
  }),
  querySelectorAll: () => []
};
const window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  }
};
const localStorage = window.localStorage;
const prompt = () => {};
const alert = () => {};
class Chart { destroy() {} }
const Intl = { NumberFormat: class { format(x) { return x; } } };
${js.replace(/const fmt = .*/, 'const fmt = new Intl.NumberFormat()')}
login();
console.log("calcCashFlow completed, flow length: " + calcCashFlow(scenarios[0], 120).length);
render();
console.log("render completed!");
`;
fs.writeFileSync('test.js', out);
