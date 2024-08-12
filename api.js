const {get, post} = (() => {
  const url = "https://script.google.com/macros/s/AKfycbzmByTlUoFOXTQdsQ46lVeqgiPY4dXygx4oZYDYOaisX-YccdhDo0_eR4IB_TtigungaA/exec";

  function get(api_path, data = {}) {
    if(!window.XMLHttpRequest) {
      alert('無法連線，請更換瀏覽器');
      return;
    }
    if(!url) {
      alert('未設定url');
      return;
    }
    return new Promise((resolve, reject) => {
      let form_str = Object.entries(data).map(([key, val]) => {
        return key + "=" + encodeURI(val);
      }).join("&");
      let cur_url = `${url}?api_path=${api_path}&` + form_str;
      let xhr = new XMLHttpRequest();
      xhr.responseType = "json";
      xhr.open("GET", cur_url, true);
      xhr.addEventListener("load", () => {
        if(xhr.status == 200) {
          resolve(xhr.response);
        }
        else {
          reject(xhr.status);
        }
      });
      xhr.send();
    });
  }

  function post(api_path, data = {}) {
    if(!window.XMLHttpRequest) {
      alert('無法連線，請更換瀏覽器');
      return;
    }
    if(!url) {
      alert('未設定url');
      return;
    }
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.responseType = "json";
      xhr.open("POST", url, true);
      xhr.addEventListener("load", () => {
        if(xhr.status == 200) {
          resolve(xhr.response);
        }
        else {
          reject(xhr.status);
        }
      });
      let form = new FormData();
      form.append('api_path', api_path);
      Object.entries(data).forEach(([key, val]) => {
        form.append(key, val);
      });
      xhr.send(form);
    });
  }

  return {get, post};
})();