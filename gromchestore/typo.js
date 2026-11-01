// Переносы: короткие слова держатся со следующим, числа не разрываются и не отрываются от единиц
const NBSP = ' ';
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'OPTION']);

function fix(text) {
  let s = text
    .replace(/(\d)[ \t](?=\d)/g, `$1${NBSP}`)
    .replace(/(\d)[ \t](?=[а-яёА-ЯЁ₽%°])/g, `$1${NBSP}`);
  // Дважды, чтобы сработало на идущих подряд коротких словах: «и в доме»
  for (let i = 0; i < 2; i++) s = s.replace(/(?<![а-яёА-ЯЁa-zA-Z0-9-])([а-яёА-ЯЁ]{1,2}) (?=\S)/g, `$1${NBSP}`);
  return s;
}

function walk(root) {
  const nodes = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = nodes.nextNode(); n; n = nodes.nextNode()) {
    const parent = n.parentElement;
    if (!parent || SKIP.has(parent.tagName) || parent.closest('#marquee')) continue;
    const next = fix(n.nodeValue);
    if (next !== n.nodeValue) n.nodeValue = next;
  }
}

walk(document.body);
new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(n => {
  if (n.nodeType === 1) walk(n);
  else if (n.nodeType === 3 && n.parentElement) walk(n.parentElement);
}))).observe(document.body, { childList: true, subtree: true });
