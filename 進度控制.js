let 查看中的桌資料 = {};
let 目前控制器 = null;

function 初始取得桌進度(桌編號) {
  let 主畫面 = find("#主畫面");
  主畫面.innerHTML = "";
  提示("正在讀取此桌進度...");
  查看中的桌資料 = {};
  get("開頭取得進度", {目標桌編號: 桌編號}).then(res => {
    if(!res.成功) return;
    查看中的桌資料 = res.data;
    下注管理.重新讀取目前資料();
    籌碼管理.重新讀取目前資料();
    提示(切換控制器());
    目前控制器.完整資料顯示();
  });
}

function 切換控制器() {
  switch(查看中的桌資料.類型) {
    case '俄羅斯輪盤桌': 目前控制器 = 控制_俄羅斯輪盤桌; break;
    default: 目前控制器 = null; return "找不到此類型的控制器";
  }
}

function 切換顯示(目標頁首, 目標顯示區) {
  頁首顯示區.innerHTML = "";
  頁首顯示區.append(目標頁首);
  主畫面.innerHTML = "";
  主畫面.append(目標顯示區);
  桌css.href = `./${查看中的桌資料.類型}/css.css`;
}

let 每刻 = null;
function 停止每刻() {
  clearInterval(每刻);
  每刻 = null;
}
function 繼續每刻() {
  clearInterval(每刻);
  每刻 = setInterval(() => {
    下注管理.發送暫時下注();
    每刻取得桌進度();
  }, 5000);
}
繼續每刻();
function 每刻取得桌進度() {
  if(!查看中的桌資料.桌編號) return;
  let 下注進度檢查 = 下注管理.進度;
  let 籌碼進度檢查 = 籌碼管理.進度;
  get("每刻取得進度", {
    目標桌編號: 查看中的桌資料.桌編號,
    玩家名字: 自己.名字,
    進度: JSON.stringify({
      桌狀態: 查看中的桌資料.狀態進度 || 0,
      回合: 查看中的桌資料.回合 || 0,
      座位: 查看中的桌資料.座位進度 || 0,
      下注: 下注管理.進度,
      籌碼: 籌碼管理.進度,
    }),
  }).then(res => {
    if(!res.成功 || 每刻 == null) return;
    if(!查看中的桌資料.桌編號) return;

    if(目前控制器) 目前控制器.每刻更新前檢查(res.data);
    if(每刻 == null) return;

    if(res.data.狀態 && 查看中的桌資料.狀態進度 != res.data.狀態進度) {
      查看中的桌資料.狀態進度 = res.data.狀態進度;
      查看中的桌資料.狀態 = res.data.狀態;
      if(目前控制器) 目前控制器.重新顯示桌狀態();
    }

    if(res.data.回合 != undefined) {
      查看中的桌資料.回合 = res.data.回合;
      查看中的桌資料.下注歷程 = res.data.下注歷程;
      下注管理.重新讀取目前資料();
      if(目前控制器) {
        目前控制器.重新顯示下注狀態();
        目前控制器.重新顯示籌碼狀態();
      }
    }
    else if(res.data.下注歷程 && 下注進度檢查 == 下注管理.進度) {
      let 非自己的歷程 = res.data.下注歷程.filter(({名字}) => 名字 != 自己.名字);
      下注管理.更新多條(非自己的歷程);
      if(目前控制器) 目前控制器.更新顯示_下注();
    }

    if(res.data.座位進度 != undefined) {
      查看中的桌資料.座位進度 = res.data.座位進度;
      查看中的桌資料.座位狀態 = res.data.座位狀態;
      if(!Object.values(查看中的桌資料.座位狀態).includes(自己.名字) && 自己.所在桌 == 查看中的桌資料.桌編號) {
        自己.所在桌 = "";
        自己.所在座位 = "";
      }
      if(目前控制器) 目前控制器.重新顯示座位狀態();
    }

    if(res.data.籌碼歷程 && 籌碼進度檢查 == 籌碼管理.進度) {
      籌碼管理.更新多條(res.data.籌碼歷程);
      if(目前控制器) 目前控制器.更新顯示_籌碼();
    }
  });
}

function 選擇桌() {
  let 選擇桌視窗 = find('#選擇桌視窗');
  選擇桌視窗.style.display = "";
  let 列表el = find(選擇桌視窗, '.白底');
  列表el.innerHTML = "桌列表讀取中...";
  get("取得所有桌").then(res => {
    if(!res.成功) return;
    列表el.innerHTML = "";
    res.data.forEach(({桌編號, 桌名, 預覽圖網址}) => {
      let btn = new_el_to_el(列表el, 'button', 桌名);
      btn.addEventListener('click', () => {
        選擇桌視窗.style.display = "none";
        列表el.innerHTML = "";
        初始取得桌進度(桌編號);
      });
    });
  });
}
