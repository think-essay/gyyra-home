var iUp = (function () {
  var time = 0;
  return {
    clean: function () { time = 0; },
    up: function (element) { setTimeout(function () { element.classList.add('up'); }, time); time += 150; },
    down: function (element) { element.classList.remove('up'); },
    toggle: function (element) { setTimeout(function () { element.classList.toggle('up'); }, time); time += 150; }
  };
})();

var BING_IMAGE_URL_PATTERN = /^\/th\?id=OHR\.[a-zA-Z0-9_-]+\.jpg(&[a-zA-Z0-9=._-]+)*$/;

function getBingImages(imgUrls) {
  var panel = document.querySelector('#panel');
  if (!panel || !Array.isArray(imgUrls) || imgUrls.length === 0) return;
  var key = 'bing-image-index';
  var index = parseInt(sessionStorage.getItem(key), 10);
  index = isNaN(index) ? 0 : (index + 1) % imgUrls.length;
  var image = imgUrls[index];
  if (!image || !BING_IMAGE_URL_PATTERN.test(image)) return;
  panel.style.backgroundImage = "url('" + ('https://cn.bing.com' + image).replace(/['\\]/g, '\\$&') + "')";
  panel.style.backgroundPosition = 'center center';
  panel.style.backgroundRepeat = 'no-repeat';
  panel.style.backgroundSize = 'cover';
  panel.style.backgroundColor = '#666';
  sessionStorage.setItem(key, index);
}

function decryptEmail(encoded) {
  window.location.href = 'mailto:' + atob(encoded);
}

document.addEventListener('DOMContentLoaded', function () {
  fetch('https://v1.hitokoto.cn')
    .then(function (response) { return response.json(); })
    .then(function (data) {
      var description = document.getElementById('description');
      if (!description || !data.hitokoto || !data.from) return;
      description.replaceChildren(
        document.createTextNode(data.hitokoto),
        document.createElement('br'),
        document.createTextNode(' -「'),
        Object.assign(document.createElement('strong'), { textContent: data.from }),
        document.createTextNode('」')
      );
    })
    .catch(function () { /* Keep the configured fallback quote. */ });

  Array.prototype.forEach.call(document.querySelectorAll('.iUp'), function (element) { iUp.up(element); });
  var avatar = document.querySelector('.js-avatar');
  if (avatar) avatar.addEventListener('load', function () { avatar.classList.add('show'); });

  if (Array.isArray(window.BING_IMAGES)) {
    getBingImages(window.BING_IMAGES);
  } else {
    var imagesScript = document.createElement('script');
    imagesScript.src = './assets/json/images.js?t=' + Date.now();
    imagesScript.onload = function () { getBingImages(window.BING_IMAGES); };
    document.body.appendChild(imagesScript);
  }
});

var menuButton = document.querySelector('.btn-mobile-menu__icon');
var navigationWrapper = document.querySelector('.navigation-wrapper');
if (menuButton && navigationWrapper) {
  menuButton.addEventListener('click', function () {
    var visible = navigationWrapper.classList.contains('visible');
    if (visible) {
      navigationWrapper.classList.remove('bounceInDown');
      navigationWrapper.classList.add('animated', 'bounceOutUp');
      navigationWrapper.addEventListener('animationend', function closeMenu() {
        navigationWrapper.classList.remove('visible', 'animated', 'bounceOutUp');
        navigationWrapper.removeEventListener('animationend', closeMenu);
      });
    } else {
      navigationWrapper.classList.add('visible', 'animated', 'bounceInDown');
    }
    menuButton.classList.toggle('icon-list');
    menuButton.classList.toggle('icon-angleup');
  });
}
