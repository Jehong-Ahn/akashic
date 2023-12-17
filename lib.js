HTMLElement.prototype.ac = function() { return this.appendChild(ce(...arguments)); };
HTMLElement.prototype.first = function() { return this.firstElementChild; };
HTMLElement.prototype.last = function() { return this.lastElementChild; };

HTMLElement.prototype.dispatch = function(eventName, detail) {
  if (!detail) this.dispatchEvent(new Event(eventName));
  else this.dispatchEvent(new CustomEvent(eventName, { detail }));
};
HTMLElement.prototype.once = function(eventName, handler) {
  this.addEventListener(eventName, handler, {once: true});
}


String.prototype.matchSafe = function(regex) {
  const match = this.match(regex);
  return match ? ( match[1] || match[0] ) : '';
}

for(const ref of [ Document, Element, DocumentFragment ]) {
  ref.prototype.qs = ref.prototype.querySelector;
  ref.prototype.qsa = ref.prototype.querySelectorAll;
}

export const qs = selector => document.qs(selector);
export const qsa = selector => document.qsa(selector);



if (! window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.setAttribute('data-bs-theme', 'light')
}


export function ce(tag='div', data={}) {

  // css, fonts 주소를 바로 입력받았을 때
  if (typeof tag==='string' && tag.slice(0,4)==='http') return ce('link', { href: tag, rel: 'stylesheet' });

  const tagMatch = typeof tag==='string' ? tag.match(/^\w+/) : '';
  const tagName = tagMatch ? tagMatch[0] : 'div';
  const el = document.createElement(tagName);
  
  if (typeof tag==='object') { data = tag; tag = 'div'; }
  else if (typeof data==='function') { data(el); data = {}; }
  else if (typeof data==='string') { 
    const temp = data;
    data = {};
    if (temp[0]==='<') data.html = temp;
    else data.text = temp;
  }

  let match;
  if (match = tag.match(/(?<=#)\w+/)) data.id = match[0];
  if (match = tag.match(/(?<=\.)[\w-]+/g)) {
    if (!data.class) data.class = '';
    data.class += (data.class ? ' ' : '') + match.join(' ');
  }

  Object.entries(data).forEach(([k,v]) => {
    // aliases
    if (k==='class') el.classList = v;
    else if (k==='text') el.textContent = v;
    else if (k==='html') el.innerHTML = v;
    // 단순 할당이 불가한 built-in attrs
    else if (['for'].includes(k)) el.setAttribute(k, v);
    // 이외에는 단순 할당
    // onchange, onclick 등의 콜백도 단순 할당한다.
    else el[k] = v;
  });

  return el;
}

export const log = console.log;

export function debounce(handler, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => handler(...args), wait);
  };
}


export const atGas = location.pathname === "/userCodeAppPanel";

export function id(id) { return document.querySelector('#'+id); }



export const $spinner = qs('spinner');