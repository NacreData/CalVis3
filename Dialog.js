if (!Widget) var Widget = {};

Widget.Dialog = function () {};

Widget.Dialog.VERSION = '0.01';
Widget.Dialog.EXPORT = ['alert', 'confirm', 'prompt', 'close'];

Widget.Dialog.alert = function (msg, options) {
  var dialog = new Widget.Dialog;
  return dialog.alert(msg, options);
};

Widget.Dialog.confirm = function (msg, options) {
  var dialog = new Widget.Dialog;
  return dialog.confirm(msg, options);
};

Widget.Dialog.prompt = function(msg, options) {
  var dialog = new Widget.Dialog;
  return dialog.prompt(msg, options);
};

Widget.Dialog.close = function(msg, options) {
  var dialog = new Widget.Dialog;
  return dialog.close();
};

Widget.Dialog.prototype = {
  _options: {
    'height'      : 300,
    'width'       : 600,
    'labelOk'     : 'Close',
    'labelCancel' : 'Cancel',
    'onOk'        : function() {
      Widget.Dialog.close();
    },
    'onCancel'    : function() {
      Widget.Dialog.close();
    }
  },

  alert: function(msg, options) {
    var options = this._extend(this._options, options || {});
    this.addOverlay();

    var dwindow = this.getWindow(options.height, options.width);

    // msg
    var dmsg = document.createElement('div');
    dmsg.id = 'dmsg';
    dmsg.style.padding = '6px';
    //dmsg.appendChild(document.createTextNode(msg));
    dmsg.innerHTML = msg;

    var div = document.createElement('div');
    div.align = 'right';

    var closeImage = document.createElement('img');
    closeImage.src = 'close.gif';
    closeImage.onclick = options.onOk;

    div.appendChild(closeImage);

    dwindow.appendChild(div);

    dwindow.appendChild(dmsg);

    // buttons
    var dbuttons = document.createElement('div');
    dbuttons.id = 'dbuttons';
    dbuttons.style.padding = '6px';

    /*
    // ok
    var dbuttonOk = document.createElement('button');
    dbuttonOk.className = 'dbutton';
    dbuttonOk.appendChild(document.createTextNode(options.labelOk));
    dbuttonOk.onclick = options.onOk;
    dbuttons.appendChild(dbuttonOk);
    
    dwindow.appendChild(dbuttons);
    dbuttonOk.focus();
    */

    document.body.appendChild(dwindow);

    return this;
  },

  confirm: function(msg, options) {
    var options = this._extend(this._options, options || {});
    this.addOverlay();

    var dwindow = this.getWindow(options.height, options.width);

    // msg
    var dmsg = document.createElement('div');
    dmsg.id = 'dmsg';
    dmsg.style.padding = '6px';
    dmsg.appendChild(document.createTextNode(msg));
    dwindow.appendChild(dmsg);

    // buttons
    var dbuttons = document.createElement('div');
    dbuttons.id = 'dbuttons';
    dbuttons.style.padding = '6px';

    // ok
    var dbuttonOk = document.createElement('button');
    dbuttonOk.className = 'dbutton';
    dbuttonOk.appendChild(document.createTextNode(options.labelOk));
    dbuttonOk.onclick = options.onOk;
    dbuttons.appendChild(dbuttonOk);

    // cancel
    var dbuttonCancel = document.createElement('button');
    dbuttonCancel.className = 'dbutton';
    dbuttonCancel.appendChild(document.createTextNode(options.labelCancel));
    dbuttonCancel.onclick = options.onCancel;
    dbuttons.appendChild(dbuttonCancel);

    dwindow.appendChild(dbuttons);
    document.body.appendChild(dwindow);
    dbuttonOk.focus();
    return this;
  },

  prompt: function(msg, options) {
    var opt = this._options;
    opt.height = 100;
    var options = this._extend(opt, options || {});

    this.addOverlay();

    var dwindow = this.getWindow(options.height, options.width);

    // msg
    var dmsg = document.createElement('div');
    dmsg.id = 'dmsg';
    dmsg.style.padding = '6px';
    dmsg.appendChild(document.createTextNode(msg));
    dwindow.appendChild(dmsg);

    // buttons
    var dbuttons = document.createElement('div');
    dbuttons.id = 'dbuttons';
    dbuttons.style.padding = '6px';

    // input
    var dinput = document.createElement('input');
    dinput.id = 'dinput';
    dinput.style.width = '260px';
    dinput.setAttribute('type', 'text');
    dwindow.appendChild(dinput);

    // ok
    var dbuttonOk = document.createElement('button');
    dbuttonOk.className = 'dbutton';
    dbuttonOk.appendChild(document.createTextNode(options.labelOk));
    dbuttonOk.onclick = function() {
      options.onOk(dinput.value);
    };
    dbuttons.appendChild(dbuttonOk);

    // cancel
    var dbuttonCancel = document.createElement('button');
    dbuttonCancel.className = 'dbutton';
    dbuttonCancel.appendChild(document.createTextNode(options.labelCancel));
    dbuttonCancel.onclick = options.onCancel;
    dbuttons.appendChild(dbuttonCancel);

    dwindow.appendChild(dbuttons);
    document.body.appendChild(dwindow);
    dinput.focus();
    return this;
  },

  addOverlay: function() {
    var doverlay = document.createElement('div');
    doverlay.id = 'doverlay';
    with(doverlay.style) {
      top = '0px';
      left = '0px';
      position = 'absolute';
      background = '#000';
    }

    this._setOpacity(doverlay, 0.5);
    var pageSize = this._getPageSize();
    doverlay.style.height = pageSize.pageHeight+'px';
    doverlay.style.width = '100%';
    document.body.appendChild(doverlay);
  },

  removeOverlay: function() {
    document.body.removeChild(document.getElementById('doverlay'));
  },

  getWindow: function(height, width) {
    document.body.style.padding = '0';
    var dwindow = document.createElement('div');
    dwindow.id = 'dwindow';
    var pageSize = this._getPageSize();
    var pos = this._realOffset(document.body);
    dwindow.style.top = (pageSize.windowHeight/4 - height/4 + pos[1])+'px';
    dwindow.style.left = (pageSize.windowWidth/2 - width/2 + pos[0])+'px';
    //dwindow.style.height = height+'px';
    dwindow.style.width = width+'px';
    dwindow.style.position = 'absolute';
    dwindow.style.background = '#fff';
    dwindow.style.border = '2px solid #CEDD70';
    dwindow.style.padding = '6px';
    dwindow.style.textAlign = 'left';
    return dwindow;
  },

  close: function() {
    this.removeOverlay();
    document.body.removeChild(document.getElementById('dwindow'));
    return this;
  },

  _extend: function(destination, source) {
    for (var property in source) {
      destination[property] = source[property];
    }
    return destination;
  },

  _realOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.scrollTop  || 0;
      valueL += element.scrollLeft || 0;
      element = element.parentNode;
    } while (element);
    return [valueL, valueT];
  },

  _setOpacity: function(element, value){
    if (typeof element == 'string')
      element= $(element);
    if (value == 1){
      element.style.opacity = (/Gecko/.test(navigator.userAgent) && !/Konqueror|Safari|KHTML/.test(navigator.userAgent)) ? 0.999999 : 1.0 ;
      if(/MSIE/.test(navigator.userAgent) && !window.opera)
        element.style.filter = element.style.filter.replace(/alpha\([^\)]*\)/gi,'');
    } else {
      if(value < 0.00001) value = 0;
      element.style.opacity = value;
      if(/MSIE/.test(navigator.userAgent) && !window.opera)
        element.style.filter = element.style.filter.replace(/alpha\([^\)]*\)/gi,'') + 'alpha(opacity='+value*100+')';
    }
    return element;
  },

  _getPageSize: function() {
    var xScroll, yScroll;
    if (window.innerHeight && window.scrollMaxY) {
      xScroll = document.body.scrollWidth;
      yScroll = window.innerHeight + window.scrollMaxY;
    } else if (document.body.scrollHeight > document.body.offsetHeight){
      // all but Explorer Mac
      xScroll = document.body.scrollWidth;
      yScroll = document.body.scrollHeight;
    } else {
      // Explorer Mac...would also work in Explorer 6 Strict,
      // Mozilla and Safari
      xScroll = document.body.offsetWidth;
      yScroll = document.body.offsetHeight;
    }

    var windowWidth, windowHeight;
    if (self.innerHeight) {      // all except Explorer
      windowWidth = self.innerWidth;
      windowHeight = self.innerHeight;
    } else if (document.documentElement
    && document.documentElement.clientHeight) {
      // Explorer 6 Strict Mode
      windowWidth = document.documentElement.clientWidth;
      windowHeight = document.documentElement.clientHeight;
    } else if (document.body) { // other Explorers
      windowWidth = document.body.clientWidth;
      windowHeight = document.body.clientHeight;
    }

    // for small pages with total height less then height of the viewport
    if(yScroll < windowHeight){
      pageHeight = windowHeight;
    } else {
      pageHeight = yScroll;
    }

    // for small pages with total width less then width of the viewport
    if(xScroll < windowWidth){
      pageWidth = windowWidth;
    } else {
      pageWidth = xScroll;
    }

    return {
      'pageWidth':pageWidth,
      'pageHeight':pageHeight,
      'windowWidth':windowWidth,
      'windowHeight':windowHeight,
      'yScroll':yScroll,
      'xScroll':xScroll
    };
  }
};

/*

*/
