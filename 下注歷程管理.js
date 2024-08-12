const 下注管理 = (() => {
  class 下注管理 {
    static 歷程 = [];
    static 狀態 = {};
    static 暫時下注 = [];
    static get 進度() {
      return 下注管理.歷程.filter(({名字}) => 名字 != 自己.名字).length;
    }
    static 清空() {
      下注管理.歷程 = [];
      下注管理.狀態 = {};
      下注管理.暫時下注 = [];
    }

    /* ================================ */
    /*  與顯示有關                      */
    /* ================================ */
    static 取得特定id的籌碼堆列(目標bid) {
      let 籌碼堆列 = [];
      (下注管理.狀態[目標bid] || []).forEach(({類型, 數量}) => {
        籌碼堆列.push({類型, 數量});
      });
      下注管理.暫時下注.filter(({bid}) => bid == 目標bid)
      .forEach(({類型, 數量}) => 對籌碼堆列推入(籌碼堆列, 類型, 數量));
      return 籌碼堆列;
    }
    static 取得所有人各類籌碼下注數() {
      let 下注數 = {};
      下注管理.歷程.forEach(({名字, 類型, 數量}) => {
        if(!下注數[名字]) 下注數[名字] = {};
        下注數[名字][類型] = (下注數[名字][類型] || 0) + 數量;
      });
      下注管理.暫時下注.forEach(({名字, 類型, 數量}) => {
        if(!下注數[名字]) 下注數[名字] = {};
        下注數[名字][類型] = (下注數[名字][類型] || 0) + 數量;
      });
      return 下注數;
    }

    /* ================================ */
    /*  與動作有關                      */
    /* ================================ */
    static 取得自己本回下注數() {
      let 下注數 = 0;
      下注管理.歷程.filter(({名字}) => 名字 == 自己.名字)
        .forEach(({數量}) => 下注數 += 數量);
      下注管理.暫時下注.forEach(({數量}) => 下注數 += 數量);
      return 下注數;
    }
    static 取得特定bid的某類型下注數量(目標bid, 目標類型) {
      let 下注數 = 0;
      下注管理.歷程
        .filter(({名字, 類型, bid}) => 名字 == 自己.名字 && 類型 == 目標類型 && bid == 目標bid)
        .forEach(({數量}) => 下注數 += 數量);
      下注管理.暫時下注
        .filter(({類型, bid}) => 類型 == 目標類型 && bid == 目標bid)
        .forEach(({數量}) => 下注數 += 數量);
      return 下注數;
    }
    static 新增暫時下注(一行) {
      下注管理.暫時下注.push(一行);
    }
    static 發送暫時下注() {
      if(下注管理.暫時下注.length == 0) return;
      let 目標 = 下注管理.暫時下注.splice(0, 下注管理.暫時下注.length);
      下注管理.更新多條(目標);
      post("下注", {
        目標桌編號: 查看中的桌資料.桌編號,
        多個歷程行: JSON.stringify(目標),
      }).then(res => {
        if(!res.成功) {
          目標.forEach(一行歷程 => 下注管理.減少一行(一行歷程));
          if(目前控制器) 目前控制器.重新顯示下注狀態();
          return;
        }
        let 失敗數 = 0;
        res.data.forEach((一個結果, i) => {
          if(!一個結果.成功) {
            下注管理.減少一行(目標[i]);
            失敗數++;
          }
        });
        if(失敗數 && 目前控制器) 目前控制器.重新顯示下注狀態();
      });
    }
    static 減少一行(一行歷程) {
      let index = 下注管理.歷程.indexOf(一行歷程);
      下注管理.歷程.splice(index, 1);
      let {bid, 類型, 數量} = 一行歷程;
      對籌碼堆列推入(下注管理.狀態[bid], 類型, -數量);
    }

    /* ================================ */
    /*  與更新有關                      */
    /* ================================ */
    static 重新讀取目前資料() {
      下注管理.歷程 = [];
      下注管理.狀態 = {};
      if(!查看中的桌資料.下注歷程) return;
      下注管理.更新多條(查看中的桌資料.下注歷程);
    }
    static 更新多條(歷程arr) {
      歷程arr.forEach(一行歷程 => 下注管理.更新一行(一行歷程));
    }
    static 更新一行(一行歷程) {
      let {類型, 數量, bid} = 一行歷程;
      下注管理.歷程.push(一行歷程);
      if(!下注管理.狀態[bid]) 下注管理.狀態[bid] = [];
      對籌碼堆列推入(下注管理.狀態[bid], 類型, 數量);
    }
  }
  function 對籌碼堆列推入(籌碼堆列, 類型, 數量) {
    if(數量 == 0) return;
    if(數量 > 0) {
      let 最後一顆 = 籌碼堆列[籌碼堆列.length - 1];
      if(最後一顆 && 最後一顆.類型 == 類型) 最後一顆.數量 += 數量;
      else 籌碼堆列.push({類型, 數量});
      return;
    }
    let 要扣除 = 數量;
    while(要扣除) {
      let index = 籌碼堆列.findLastIndex(籌碼堆 => 籌碼堆.類型 == 類型);
      if(index == -1) return;
      let target = 籌碼堆列[index];
      target.數量 += 要扣除;
      if(target.數量 > 0) return;
      要扣除 = target.數量;
      籌碼堆列.splice(index, 1);
    }
  }
  return 下注管理;
})()
