var xhr = new XMLHttpRequest();
xhr.open('GET', 'unicodeData.html');
xhr.onload = function() {
  document.querySelector('#unicode').innerHTML = xhr.response;
  document.querySelector('#unicode').addEventListener('click', function(event) {
    if (event.target.nodeName === 'SPAN')
      copyToClipboard(event);
    else if (event.target.nodeName === 'H2')
      toggle(event);
  });
  chrome.storage.sync.get('lastBlock', function(data) {
    var lastBlock = data.lastBlock || 'Emoticons';
    var div = document.querySelector('[data-block="' + lastBlock + '"]');
    div.classList.toggle('hidden');
    div.scrollIntoView();
    chrome.app.window.current().show();
  });
}
xhr.send();

function toggle(event) {
  var block = event.target.parentNode;
  block.classList.toggle('hidden');
  if (!block.classList.contains('hidden')) {
    chrome.storage.sync.set({lastBlock: block.dataset.block});
  }
}

function copyToClipboard(event) {
  var buffer = document.createElement('textarea');
  document.body.appendChild(buffer);
  buffer.style.position = 'absolute'; // Hack: http://crbug.com/334062
  buffer.value = event.target.textContent;
  buffer.select();
  var result = document.execCommand('copy');
  if (result) {
    chrome.storage.sync.get('favorites', function(data) {
      var favorites = data.favorites || [];
      if (favorites.length && favorites[0].unicode === event.target.textContent) {
        return;
      }
      favorites.unshift({unicode: event.target.textContent, name: event.target.title});
      favorites.length = Math.min(favorites.length, 5);
      chrome.storage.sync.set({favorites: favorites}, updateFavorites);
    });
    showClipboardNotification(event.target.textContent);
  }
  buffer.remove();
}

function updateFavorites() {
  chrome.storage.sync.get('favorites', function(data) {
    var favorites = data.favorites || [];
    var favoritesHtml = '';
    for (var i = 0; i < favorites.length; i++) {
      favoritesHtml += '<span title="' + favorites[i].name + '">' + favorites[i].unicode + '</span>';
    }
    document.querySelector('#favorites').innerHTML = favoritesHtml;
  });
}

function showClipboardNotification(text) {
  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = 80 * devicePixelRatio;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#607D8B';
  ctx.fillRect(0,0,canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.font = '40pt Roboto';
  ctx.fillStyle = 'white';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + (40 / devicePixelRatio));

  var options = {
    type: 'basic',
    message: 'You can paste it anywhere.',
    title: 'Clipboard updated',
    iconUrl: canvas.toDataURL('image/png'),
  }
  chrome.notifications.clear('id', function() {
    chrome.notifications.create('id', options);
  });
}

updateFavorites();