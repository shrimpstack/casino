const 控制_俄羅斯輪盤桌 = (() => {
  /* ================================ */
  /*  有哪些階段                      */
  /* ================================ */
  /*
    回合間休息：可入座、不可下注、荷官於準備中、轉盤停止、轉盤無數字
    下注時間：不可入座、可下注、荷官為請下注動作、轉盤轉動中、轉盤無數字
    停止下注：不可入座、不可下注、荷官為停止下注動作、轉盤轉動中、轉盤可能有數字
    開獎：不可入座、不可下注、荷官為準備中動作、轉盤停止、轉盤有數字
    從停止下注到開獎的那一刻：撥放放置玻璃柱、掃籌碼、發籌碼
    開獎中停止每刻更新，直到撥放完畢後再更新
  */

  /* ================================ */
  /*  資料處理                        */
  /* ================================ */
  const type = "俄羅斯輪盤桌";
  const row_1 = new Array(11).fill().map((v, i) => i * 3 + 1);
  const row_2 = new Array(11).fill().map((v, i) => i * 3 + 2);
  const row_3 = new Array(11).fill().map((v, i) => i * 3 + 3);
  const 注ID們 = [
    "直0",
    ...[...row_1, 34, ...row_2, 35, ...row_3, 36].map(v => "直" + v),
    "分01", "分02", "分03",
    ...[...row_1, ...row_2, ...row_3].map(v => "分H" + v),
    ...[...row_1, 34, ...row_2, 35].map(v => "分V" + v),
    "路2", "路3",
    ...[...row_1, 34].map(v => "路" + v),
    "角0",
    ...[...row_1, ...row_2].map(v => "角" + v),
    ...row_1.map(v => "線" + v),
    "區1", "區2", "區3", "列1", "列2", "列3",
    "小", "奇", "紅", "黑", "偶", "大",
  ];

  /* ================================ */
  /*  EL處理                          */
  /* ================================ */
  const EL = (() => {
    let EL = {};
    EL.頁首資料 = new_el('div.頁首資料', {type}, [
      new_el('div', [
        new_el('span', "桌名："),
        EL.頁首桌名 = new_el('output'),
      ]),
      new_el('div', [
        new_el('span', "下注單位："),
        EL.下注單位按鈕 = new_el('button', 下注單位),
      ]),
    ]);
    EL.下注單位按鈕.addEventListener('click', () => {
      if(下注單位 == 1) 下注單位 = 10;
      else 下注單位 = 1;
      EL.下注單位按鈕.innerText = 下注單位;
    });
    
    EL.下注觸控們 = {};
    EL.下注顯示們 = {};
    EL.顯示區 = new_el('div.顯示區', {type}, [
      EL.座位區 = new_el('div.座位區'),
      new_el('div.桌子', [
        EL.持有區 = new_el('div.持有區'),
        EL.下注區 = new_el('div.下注區', [
          new_el('div.下注觸控',
            注ID們.map(bid => {
              let btn = new_el('div', {bid, style: `grid-area: ${bid}`});
              btn.addEventListener('click', () => 下注(bid));
              btn.addEventListener('contextmenu', () => 減注(bid));
              EL.下注觸控們[bid] = btn;
              return btn;
            })
          ),
          new_el('div.下注顯示',
            注ID們.map(bid => EL.下注顯示們[bid] = new_el('div', {bid}))
          ),
          EL.玻璃標記 = new_el('img.玻璃標記', {src: `./${type}/玻璃.png`}),
        ]),
        EL.輪盤 = new_el('div.輪盤.停止', [
          EL.輪盤數字 = new_el('div.數字'),
          new_el('div.鐵珠'),
        ]),
      ]),
      EL.荷官 = new_el('div.荷官'),
    ]);
    find(EL.顯示區, '.下注區').addEventListener('contextmenu', event => event.preventDefault());

    EL.座位們 = {};
    EL.持有們 = {};
    ["L1", "L2", "L3", "L4", "L5", "R1", "R2"].map(座位編號 => {
      let btn = new_el('button', '入座');
      btn.addEventListener('click', () => 入座(座位編號));
      EL.座位們[座位編號] = new_el_to_el(EL.座位區, 'div.座位', {number: 座位編號}, btn);
      EL.持有們[座位編號] = new_el_to_el(EL.持有區, 'div.持有', {number: 座位編號});
    });

    return EL;
  })();

  /* ================================ */
  /*  EL位置處理                      */
  /* ================================ */
  function 更新籌碼顯示的位置() {
    let p_rect = EL.下注區.getBoundingClientRect();
    注ID們.forEach(bid => {
      let 顯示塊 = EL.下注顯示們[bid];
      let 觸控塊 = EL.下注觸控們[bid];
      let rect = 觸控塊.getBoundingClientRect();
      let x = rect.x - p_rect.x + rect.width / 2;
      let y = rect.y - p_rect.y + rect.height / 2;
      顯示塊.style.left = x + "px";
      顯示塊.style.bottom = -y + "px";
      顯示塊.y = y;
    });
    let 照順序顯示們 = Object.values(EL.下注顯示們).sort((a, b) => a.y - b.y);
    find(EL.下注區, '.下注顯示').append(...照順序顯示們);
  }

  /* ================================ */
  /*  開獎                            */
  /* ================================ */
  async function 開獎() {
    停止每刻();
    重新顯示桌狀態();
    let 中獎號碼 = 查看中的桌資料.狀態.轉盤_數字;
    EL.玻璃標記.style.left = EL.下注顯示們["直" + 中獎號碼].offsetLeft + "px";
    EL.玻璃標記.style.bottom = EL.下注顯示們["直" + 中獎號碼].offsetTop * -1 + "px";
    let 中獎顯示塊們 = 取得中獎的顯示塊(中獎號碼);
    let 未中獎顯示塊們 = Object.values(EL.下注顯示們).filter(el => !中獎顯示塊們.includes(el));
    await 等(3000);
    await 掃籌碼(未中獎顯示塊們);
    繼續每刻();
  }
  async function 掃籌碼(未中獎顯示塊們) {
    let 需清走 = 未中獎顯示塊們.filter(el => el.matches(':not(:empty)'));
    for(let 顯示塊 of 需清走) {
      await 等(100);
      顯示塊移動到左下(顯示塊);
    }
    await 等(500);
    需清走.sort((a, b) => parseInt(b.style.bottom) - parseInt(a.style.bottom));
    find(EL.下注區, '.下注顯示').append(...需清走);
  }
  function 顯示塊移動到左下(顯示塊) {
    let 最大x = 100, 最大y = 60, 起點x = 10, 起點y = -180;
    let x偏移 = Math.floor(Math.random() * 最大x * 2 + 1) - 最大x;
    let 離最大差 = 最大x - Math.abs(x偏移);
    if(Math.floor(Math.random() * 最大x) > 離最大差) x偏移 -= (x偏移 < 0 ? -1 : 1) * Math.floor(Math.random() * 離最大差);
    最大y *= (最大x - Math.abs(x偏移)) / 最大x;
    let y偏移 = Math.floor(Math.random() * 最大y * 2 + 1) - 最大y;
    顯示塊.style.left = 起點x + x偏移 + "px";
    顯示塊.style.bottom = 起點y + y偏移 + "px";
  }
  function 取得中獎的顯示塊(中獎號碼) {
    if(中獎號碼 == 0) return [
      EL.下注顯示們.角0,
      EL.下注顯示們.路2,
      EL.下注顯示們.路3,
      EL.下注顯示們.分01,
      EL.下注顯示們.分02,
      EL.下注顯示們.分03,
      EL.下注顯示們.直0,
    ];
    let c = Math.floor((中獎號碼 - 1) / 3);
    let r = (中獎號碼 - 1) % 3;
    return [
      中獎號碼 <= 18 ? EL.下注顯示們.小 : EL.下注顯示們.大,
      取得顏色(中獎號碼) == "紅" ? EL.下注顯示們.紅 : EL.下注顯示們.黑,
      中獎號碼 % 2 ? EL.下注顯示們.奇 : EL.下注顯示們.偶,
      EL.下注顯示們["區" + (Math.floor((中獎號碼 - 1) / 12) + 1)],
      EL.下注顯示們["列" + (r + 1)],
      EL.下注顯示們["線" + ((c - 1) * 3 + 1)],
      EL.下注顯示們["線" + (c * 3 + 1)],
      EL.下注顯示們["角" + 中獎號碼],
      中獎號碼 > 1 && EL.下注顯示們["角" + (中獎號碼 - 1)],
      中獎號碼 > 3 && EL.下注顯示們["角" + (中獎號碼 - 3)],
      中獎號碼 > 4 && EL.下注顯示們["角" + (中獎號碼 - 4)],
      中獎號碼 <= 3 && EL.下注顯示們["角0"],
      EL.下注顯示們["路" + (c * 3 + 1)],
      [1, 2].includes(中獎號碼) && EL.下注顯示們["路2"],
      [2, 3].includes(中獎號碼) && EL.下注顯示們["路3"],
      EL.下注顯示們["分V" + 中獎號碼],
      EL.下注顯示們["分V" + (中獎號碼 - 1)],
      EL.下注顯示們["分H" + 中獎號碼],
      EL.下注顯示們["分H" + (中獎號碼 - 3)],
      EL.下注顯示們["分0" + 中獎號碼],
      EL.下注顯示們["直" + 中獎號碼],
    ].filter(el => el);
  }

  /* ================================ */
  /*  每刻更新前檢查                  */
  /* ================================ */
  function 每刻更新前檢查(data) {
    if(!查看中的桌資料.狀態 || !data.狀態) return;
    if(!查看中的桌資料.狀態.轉盤_停止 && data.狀態.轉盤_停止 && typeof data.狀態.轉盤_數字 == "number") {
      查看中的桌資料.狀態 = data.狀態;
      查看中的桌資料.狀態進度 = data.狀態進度;
      重新顯示桌狀態();
      開獎();
    }
    if(data.回合 != undefined && 查看中的桌資料.回合 != data.回合) {
      EL.玻璃標記.style.left = "";
      EL.玻璃標記.style.bottom = "";
      更新籌碼顯示的位置();
    }
  }

  /* ================================ */
  /*  完整顯示                        */
  /* ================================ */
  function 完整資料顯示() {
    切換顯示(EL.頁首資料, EL.顯示區);
    setTimeout(() => 更新籌碼顯示的位置(), 100);
    重新顯示桌狀態();
    重新顯示下注狀態();
    重新顯示座位狀態();
    重新顯示籌碼狀態();
  }

  function 取得顏色(數字) {
    if(數字 == 0) return "綠";
    else if([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(+數字)) return "紅";
    return "黑";
  }
  function 重新顯示桌狀態() {
    EL.頁首桌名.value = 查看中的桌資料.桌名 || "找不到桌名";

    let 狀態 = 查看中的桌資料.狀態;
    if(!狀態) return;
    EL.荷官.style.backgroundImage = `url(./荷官/${狀態.荷官_名字}.png)`;
    EL.荷官.setAttribute('action', 狀態.荷官_狀態);

    EL.座位區.classList.toggle('不可入座', !狀態.可入座);

    EL.輪盤.classList.toggle('停止', 狀態.轉盤_停止);
    if(狀態.轉盤_數字 == null) {
      EL.輪盤.removeAttribute('數字');
    }
    else {
      EL.輪盤.setAttribute('顏色', 取得顏色(狀態.轉盤_數字));
      EL.輪盤.setAttribute('數字', 狀態.轉盤_數字);
      EL.輪盤數字.innerText = 狀態.轉盤_數字;
    }
  }

  function 重新顯示下注狀態() {
    Object.entries(EL.下注顯示們).forEach(([bid, 顯示塊]) => {
      顯示塊.innerHTML = "";
      let 籌碼堆列 = 下注管理.取得特定id的籌碼堆列(bid);
      籌碼堆列.forEach(籌碼堆 => {
        let 大顆數量 = Math.floor(籌碼堆.數量 / 10);
        for(let f=0; f<大顆數量; f++) {
          new_el_to_el(顯示塊, 'img', {src: `./${type}/籌碼/大${籌碼堆.類型}.png`});
        }
        let 小顆數量 = 籌碼堆.數量 % 10;
        for(let f=0; f<小顆數量; f++) {
          new_el_to_el(顯示塊, 'img', {src: `./${type}/籌碼/${籌碼堆.類型}.png`});
        }
      });
    });
  }

  function 重新顯示座位狀態() {
    Object.entries(EL.座位們).forEach(([座位編號, 座位]) => {
      if(!查看中的桌資料.座位狀態[座位編號]) {
        座位.removeAttribute('style');
        座位.classList.remove('有人');
      }
      else {
        座位.classList.add('有人');
        let 名字 = 查看中的桌資料.座位狀態[座位編號];
        let 狀態 = 查看中的桌資料.玩家狀態.find(玩家資料 => 玩家資料.名字 == 名字).狀態;
        狀態 = 狀態 ? "_" + 狀態 : "";
        座位.style.backgroundImage = `url(./玩家/${名字 + 狀態}.png)`;
      }
    });
    重新顯示籌碼狀態();
  }

  function 重新顯示籌碼狀態() {
    if(!查看中的桌資料.桌編號) return;
    let 籌碼數量們 = 籌碼管理.取得本桌所有人剩餘籌碼數量();
    Object.entries(EL.持有們).forEach(([座位編號, 持有]) => {
      持有.innerHTML = "";
      let 名字 = 查看中的桌資料.座位狀態[座位編號];
      let 籌碼數量 = 籌碼數量們[名字];
      if(!名字 || !籌碼數量) return 持有.innerHTML = "";
      let 籌碼類型 = Object.keys(籌碼數量)[0];
      if(!籌碼類型 || !籌碼數量[籌碼類型]) return 持有.innerHTML = "";
      let 百A = Math.floor(籌碼數量[籌碼類型] / 250);
      let 十B = Math.floor(籌碼數量[籌碼類型] % 250 / 10);
      let 個C = 籌碼數量[籌碼類型] % 10;
      let 堆A = new_el_to_el(持有, 'div.堆');
      let 堆B = new_el_to_el(持有, 'div.堆');
      let 堆C = new_el_to_el(持有, 'div.堆');
      for(let f=0; f<百A; f++) new_el_to_el(堆A, 'img', {src: `./${type}/籌碼/百${籌碼類型}.png`});
      for(let f=0; f<十B; f++) new_el_to_el(堆B, 'img', {src: `./${type}/籌碼/大${籌碼類型}.png`});
      for(let f=0; f<個C; f++) new_el_to_el(堆C, 'img', {src: `./${type}/籌碼/${籌碼類型}.png`});
    });
  }

  /* ================================ */
  /*  每刻更新                        */
  /* ================================ */
  function 更新顯示_下注() {
    重新顯示下注狀態();
    重新顯示籌碼狀態();
  }

  function 更新顯示_籌碼() {
    重新顯示籌碼狀態();
  }

  return {
    每刻更新前檢查, 完整資料顯示,
    重新顯示桌狀態, 重新顯示座位狀態, 重新顯示下注狀態, 重新顯示籌碼狀態,
    更新顯示_下注, 更新顯示_籌碼,
  };
})()
