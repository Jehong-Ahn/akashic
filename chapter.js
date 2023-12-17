import { id, ce, debounce, log } from './lib.js';

const $types = id("types"),
    $tabContents = id("tab-contents"),
    $search_query = id("search_query"),
    $pagination = id("pagination");

function pushState(state) {
  window.history.pushState(state, "");
  window.dispatchEvent(Object.assign(new Event('popstate'), { state }));
}
function replaceState(state) {
  window.history.replaceState(state, "");
  window.dispatchEvent(Object.assign(new Event('popstate'), { state }));
}

String.prototype.prefixedEmoji = function() { return this.matchSafe(/^([\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+) ?.+/u); }; // emoji만 있는 경우는 falsy
String.prototype.removePrefixedEmoji = function() { return this.matchSafe(/^[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+ *(.+)$/u); };

let $currentCardList = null;

let chapterData;
const setChapterData = data => chapterData = data; // chapterData name이 render()에도 있어서 겹치기 때문에..


const CardList = {

  render(categoryData) {
    this.innerHTML = '';
    Object.entries(categoryData).reverse().forEach(([key, data]) => {
      const $card = this.ac('.card.mt-3');
      $card.ac('.card-header', { text: key })
      $card.subject = key;
      this.recursiveRenderContent($card.ac('.card-body'), data);
    });
  },

  renderValue(value) {
    if (!isNaN(value)) return value;
    
    // 탭 네임과 같은 경우 링크걸지 않음
    if (chapterData[value]) return value;

    // emoji 만 있는 경우는 링크걸지 않기 위해 regex에서 이모지 뒤쪽까지 검사해야
    const emoji = value.prefixedEmoji();

    if (emoji) return ce('a', {
      text: value,
      href: 'javascript:void(0)',
      class: 'link-primary link-offset-2',
      onclick: event => {
        pushState({
          tab: emoji,
          search_query: value.removePrefixedEmoji(),
        });
      },
    });
    else return value;
  },

  recursiveRenderContent($parent, data) {
    if (Array.isArray(data)) {
      const $ul = $parent.ac('ul');
      data.forEach(item => {
        const key = item.slice(0, 3).filter(Boolean).join('/');
        const val = item[3]
          ? `${item[4]} (${(item[3]>0 ? '+' : '') + item[3]})`
          : item[4];
        $ul.ac('li', `${key}: `).append(this.renderValue(val));
      });
    }
    else if (typeof data === 'object') {
      const $ul = $parent.ac('ul');
      Object.entries(data).forEach(([key, val]) => {

        const $li = $ul.ac('li');
        $li.append(this.renderValue(key));

        if (typeof val === 'object') this.recursiveRenderContent($li, val);
        else $li.append(': ', this.renderValue(val));
      });
    }
  },

  filter(query) {
    [...this.children].forEach($card => $card.hidden = ! $card.subject.includes(query));
  },
  
}


$search_query.oninput = debounce(event => $currentCardList.filter(event.target.value), 500);
$search_query.onkeyup = e => { if (e.code==="Enter") e.target.blur(); };




export function render({bookTitle, chapterTitle, chapterData, env}) {
  
  // 다른 로직에서도 챕터 데이터 접근해야
  setChapterData(chapterData);
  
  // top nav
  if (env!=='GAS') {
    $pagination.children[1].last().innerHTML = `<small class="text-secondary text-truncate">${bookTitle}</small><br>${chapterTitle}`;  
  }
  
  
  // 섹션별로 렌더
  for(const tabName in chapterData) {

    const type = tabName.prefixedEmoji();
    
    const $li = $types.ac('li', { 
      class: 'nav-item',
    });
    $li.ac('a', { 
      href: 'javascript:void(0)',
      onclick: event => pushState({ tab: type }),
      text: tabName, 
      class:"nav-link",
      type,
    });
    
    const $cardList = Object.assign($tabContents.ac({ id: type, style: "display: none;" }), CardList);
    $cardList.render(chapterData[tabName]);
    
  }
  
  // onpopstate에서 state에 따라서 탭 표시
  window.onpopstate = event => {
    console.log('popstate', JSON.stringify(event.state));
    if (!event.state) return;

    // 탭 컨텐츠 토글
    for (const $cardList of window["tab-contents"].children) {
      $cardList.style.display = $cardList.id === event.state.tab ? 'block' : 'none';
    }
    
    $currentCardList = window[event.state.tab];
    
    // 검색
    if (event.state.search_query) {
      $search_query.value = event.state.search_query;
      $currentCardList.filter(event.state.search_query);
    }
    else {
      $search_query.value = '';
    }
    
    
    // 탭 헤더 토글
    for(const $li of $types.children) {
      const $a = $li.first();
      $a.classList.toggle('active', $a.type===event.state.tab);
    }

  };
  
  // 초기 탭
  replaceState({ tab: Object.keys(chapterData)[0].prefixedEmoji() });

};