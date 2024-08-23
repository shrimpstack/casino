const 自己 = (() => {
  let 自己名字 = "";
  let 自己所在桌 = "";
  let 自己所在座位 = "";
  class 自己 {
    static get 名字() {
      return 自己名字;
    }
    static set 名字(新名字) {
      自己名字 = 新名字;
      自己.儲存();
    }
    static get 所在桌() {
      return 自己所在桌;
    }
    static set 所在桌(目標桌編號) {
      自己所在桌 = 目標桌編號;
    }
    static get 所在座位() {
      return 自己所在座位;
    }
    static set 所在座位(目標座位編號) {
      自己所在座位 = 目標座位編號;
    }
    static 儲存() {
      if(!自己名字) localStorage.removeItem('player_name');
      else localStorage.setItem('player_name', 自己名字);
    }
    static 讀取() {
      自己名字 = localStorage.getItem('player_name');
    }
  }
  return 自己;
})();

function 讀取使用者是誰() {
  自己.讀取();
  if(自己.名字) 尋找自己所在桌();
  else 選擇玩家();
}

function 重新選擇玩家() {
  自己.名字 = "";
  自己.所在桌 = "";
  自己.所在座位 = "";
  查看中的桌資料 = {};
  下注管理.清空();
  籌碼管理.清空();
  目前控制器 = null;
  find("#主畫面").innerHTML = "";
  find("#頁首顯示區").innerHTML = "";
  find("#自己名字").value = "未選擇";
  選擇玩家();
}

function 選擇玩家() {
  let 選擇玩家視窗 = find('#選擇玩家視窗');
  選擇玩家視窗.style.display = "";
  let 列表el = find(選擇玩家視窗, '.白底');
  列表el.innerHTML = "玩家列表讀取中...";
  get("取得可選玩家").then(res => {
    if(!res.成功) return;
    列表el.innerHTML = "";
    new_el_to_el(列表el, 'h3', '選擇角色');
    res.data.forEach(({名字}) => {
      let btn = new_el_to_el(列表el, 'button', [
        new_el('span', 名字),
        new_el('img', {src: `./玩家預覽/${名字}.png`}),
      ]);
      btn.addEventListener('click', () => {
        自己.名字 = 名字;
        選擇玩家視窗.style.display = "none";
        列表el.innerHTML = "";
        尋找自己所在桌();
      });
    });
  });
}

function 尋找自己所在桌() {
  提示("尋找自己所在桌...");
  find("#自己名字").value = 自己.名字;
  get("取得所在桌", {玩家名字: 自己.名字}).then(res => {
    if(res.失敗) {
      提示(res.失敗);
      自己.名字 = "";
      setTimeout(() => {
        提示();
        重新選擇玩家();
      }, 5e3);
      return;
    }
    提示();
    if(!res.成功) return;
    自己.所在桌 = res.data.桌編號;
    自己.所在座位 = res.data.座位編號;
    if(!res.data.桌編號) 選擇桌();
    else 初始取得桌進度(res.data.桌編號);
  });
}
