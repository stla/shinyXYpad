/* XY pad controller */
/**
 * Based on Anthony Terrien's library jqueryKontrol
 *
 * Version: 0.1.0 (20/05/2019)
 * Requires: jQuery v1.7+
 *
 * Copyright (c) 2019 Stéphane Laurent
 * Under GPL-3 license
 */

(function ($) {
  "use strict";

  /**
   * Definition of globals and core
   */
  var k = {}, // kontrol
    max = Math.max,
    min = Math.min;

  k.c = {};
  k.c.d = $(document);
  k.c.t = function (e) {
    return e.originalEvent.touches.length - 1;
  };

  /**
   * Kontrol Object
   *
   * Definition of an abstract UI control
   *
   * Each concrete component must call this one.
   * <code>
   * k.o.call(this);
   * </code>
   */
  k.o = function () {
    var s = this;

    this.o = null; // array of options
    this.$ = null; // jQuery wrapped element
    this.i = null; // mixed HTMLInputElement or array of HTMLInputElement
    this.g = null; // 2D graphics context for 'pre-rendering'
    this.v = null; // value ; mixed array or integer
    this.cv = null; // change value ; not commited value
    this.x = 0; // canvas x position
    this.y = 0; // canvas y position
    this.mx = 0; // x value of mouse down point of the current mouse move
    this.my = 0; // y value of mouse down point of the current mose move
    this.$c = null; // jQuery canvas element
    this.c = null; // rendered canvas context
    this.t = 0; // touches index
    this.isInit = false;
    this.fgColor = null; // main color
    this.pColor = null; // previous color
    this.sH = null; // start hook
    this.dH = null; // draw hook
    this.cH = null; // change hook
    this.eH = null; // cancel hook
    this.rH = null; // release hook

    this.run = function () {
      var cf = function (e, conf) {
        var k;
        for (k in conf) {
          s.o[k] = conf[k];
        }
        s.init();
        s._configure()._draw();
      };

      if (this.$.data('kontroled')) return;
      this.$.data('kontroled', true);

      this.$.data('value', function () {
        return { x: s.v[0], y: s.v[1] };
      });

      this.$.data('set', function (v) {
        s.change(v);
        s.val(v);
      });

      this.$.data('setOptions', function (json) {
        for (var o in json) {
          s.o[o] = json[o];
        }
        if (Object.keys(json).indexOf("bgColor") > -1) {
          s.$c.css({ 'background-color': json.bgColor });
        }
        s.change(s.v);
        s.init();
        s._coord();
        s._draw();
      });

      this.extend();
      this.o = $.extend(
        {
          // UI
          width: this.$.data('width') || 200,
          height: this.$.data('height') || 200,
          displayInput: this.$.data('displayinput') == null || this.$.data('displayinput'),
          displayPrevious: this.$.data('displayprevious') == null || this.$.data('displayprevious'),
          fgColor: this.$.data('fgcolor') || '#87CEEB',
          inline: false,

          // Hooks
          start: null,  // function () {}
          draw: null, // function () {}
          change: null, // function (value) {}
          cancel: null, // function () {}
          release: null // function (value) {}
        }, this.o
      );

      // routing value
      this.v = {};
      this.i = this.$.find('input');
      this.i.each(function (k) {
        var $this = $(this);
        s.i[k] = $this;
        s.v[k] = parseFloat($this.val());
        $this.on(
          'change',
          function () {
            var val = {};
            val[k] = $this.val();
            s.val(val);
          }
        );
      });

      if (!this.o.displayInput) this.$.hide();

      this.$c = $('<canvas width="' +
        this.o.width + 'px" height="' +
        this.o.height + 'px" style="background-color:' +
        this.o.bgColor + '"></canvas>');
      this.c = this.$c[0].getContext("2d");

      this.$
        .wrap($('<div style="box-sizing:content-box;' +
          (this.o.inline ? 'display:inline;' : '') +
          'width:' + this.o.width + 'px;height:' +
          this.o.height + 'px;"></div>').css({ 'border': this.o.border }))
        .before(this.$c);

      if (this.v instanceof Object) {
        this.cv = {};
        this.copy(this.v, this.cv);
      } else {
        this.cv = this.v;
      }

      this.$
        .on("configure", cf)
        .parent()
        .on("configure", cf);

      this._listen()
        ._configure()
        ._xy()
        .init();

      this.isInit = true;

      this._draw();

      return this;
    };

    this._draw = function () {

      // canvas pre-rendering
      var d = true,
        c = document.createElement('canvas');

      c.width = s.o.width;
      c.height = s.o.height;
      s.g = c.getContext('2d');

      s.clear();

      if (s.dH) d = s.dH();

      if (d !== false) s.draw();

      s.c.drawImage(c, 0, 0);
      c = null;
    };

    this._touch = function (e) {

      var touchMove = function (e) {

        var v = s.xy2val(
          e.originalEvent.touches[s.t].pageX,
          e.originalEvent.touches[s.t].pageY,
          'touch'
        );

        if (v == s.cv) return;

        if (s.cH && (s.cH(v) === false)) return;

        s.change(v);
        s._draw();
      };

      // get touches index
      this.t = k.c.t(e);

      if (this.sH && (this.sH() === false)) return;

      // First touch
      touchMove(e);

      // Touch events listeners
      k.c.d
        .on("touchmove.k", touchMove)
        .on(
          "touchend.k",
          function () {
            k.c.d.off('touchmove.k touchend.k');
            if (s.rH && (s.rH(s.cv) === false)) return;
            s.val(s.cv);
          }
        );

      return this;
    };

    this._mouse = function (e) {

      var mouseMove = function (e) {
        var v = s.xy2val(e.pageX, e.pageY, 'mouse');
        if (v == s.cv) return;
        if (s.o.onMove && s.cH && (s.cH(v) === false)) return;
        s.change(v);
        s._draw();
      };

      if (this.sH && (this.sH() === false)) return;

      // First click
      s.mx = e.pageX;
      s.my = e.pageY;
      mouseMove(e);

      // Mouse events listeners
      k.c.d
        .on("mousemove.k", mouseMove)
        .on(
          // Escape key cancels current change
          "keyup.k",
          function (e) {
            if (e.keyCode === 27) {
              k.c.d.off("mouseup.k mousemove.k keyup.k");
              if (s.eH && (s.eH() === false)) return;
              s.cancel();
            }
          }
        )
        .on(
          "mouseup.k",
          function (e) {
            k.c.d.off('mousemove.k mouseup.k keyup.k');
            if (s.rH && (s.rH(s.cv) === false)) return;
            s.val(s.cv);
            if (!s.o.onMove) s.cH(s.cv);
          }
        );

      return this;
    };

    this._xy = function () {
      var o = this.$c.offset();
      this.x = o.left;
      this.y = o.top;
      return this;
    };

    this._listen = function () {

      this.$c
        .on(
          "mousedown",
          function (e) {
            e.preventDefault();
            s._xy()._mouse(e);
          }
        )
        .on(
          "touchstart",
          function (e) {
            e.preventDefault();
            s._xy()._touch(e);
          }
        );
      this.listen();

      return this;
    };

    this._configure = function () {

      // Hooks
      if (this.o.start) this.sH = this.o.start;
      if (this.o.draw) this.dH = this.o.draw;
      if (this.o.change) this.cH = this.o.change;
      if (this.o.cancel) this.eH = this.o.cancel;
      if (this.o.release) this.rH = this.o.release;

      if (this.o.displayPrevious) {
        this.pColor = this.h2rgba(this.o.fgColor, "0.4");
        this.fgColor = this.h2rgba(this.o.fgColor, "0.6");
      } else {
        this.fgColor = this.o.fgColor;
      }

      return this;
    };

    this._clear = function () {
      this.$c[0].width = this.$c[0].width; // ???
    };

    // Abstract methods
    this.listen = function () { }; // on start, one time
    this.extend = function () { }; // each time configure triggered
    this.init = function () { }; // each time configure triggered
    this.change = function (v) { }; // on change
    this.val = function (v) { }; // on release
    this.xy2val = function (x, y, method) { }; //
    this.draw = function () { }; // on change / on release
    this.clear = function () { this._clear(); };

    // Utils
    this.h2rgba = function (h, a) {
      var rgb;
      h = h.substring(1, 7);
      rgb = [parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16)];
      return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")";
    };

    this.copy = function (f, t) {
      for (var i in f) { t[i] = f[i]; }
    };
  };


  /**
   * k.XY ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   */
  k.XY = function () {
    k.o.call(this);

    this.m = [];
    this.p = [];
    this.f = []; // factor
    this.s = { 0: 1, 1: -1 };
    this.radius = 0;
    this.diam = 0;
    this.v = {};
    this.div = null;

    this.extend = function () {
      this.o = $.extend(
        {
          xmin: this.$.data('xmin') || 0,
          xmax: this.$.data('xmax') || 100,
          ymin: this.$.data('ymin') || 0,
          ymax: this.$.data('ymax') || 100,
          ndecimals: this.$.data('ndecimals') || 0,
          pointColor: this.$.data('pointcolor') || "red",
          pointRadius: this.$.data('pointradius') || 5,
          bgColor: this.$.data('bgcolor') || '#FF00FF',
          coordsColor: this.$.data('coordscolor') || 'black',
          onMove: (this.$.data('onmove') || "True") === "True",
          border: this.$.data('border') || "1px solid",
          xySize: this.$.data('xysize') || 11,
          xyColor: this.$.data('xycolor') || 'black',
          xyStyle: this.$.data('xystyle') || 'normal'
        }, this.o
      );
    };

    this._coord = function () {
      this.m[0] = 0.5 + ((this.s[0] * this.v[0] - this.o.xmin) / this.f[0]) +
        this.radius;
      this.p[0] = this.m[0];
      this.m[1] = 0.5 + ((this.s[1] * this.v[1] + this.o.ymax) / this.f[1]) +
        this.radius;
      this.p[1] = this.m[1];
    };

    this.init = function () {
      this.radius = this.o.pointRadius;
      this.diam = this.radius * 2;

      this.f[0] = (this.o.xmax - this.o.xmin) / (this.o.width - this.diam);
      this.f[1] = (this.o.ymax - this.o.ymin) / (this.o.height - this.diam);

      if (!this.isInit) {
        this._coord();
      }

      if (this.o.displayInput) {
        var s = this;
        this.$.css({
          'margin-top': -6 - s.o.xySize + 'px',
          'border': 0,
          'font': s.o.xyStyle + ' ' + s.o.xySize + 'px Arial',
          'color': s.o.xyColor
        });
        this.i.each(
          function () {
            $(this).css({
              'width': (s.o.width / 4) + 'px',
              'border': 0,
              'background': 'none',
              'color': s.o.coordsColor,
              'padding': '0px',
              '-webkit-appearance': 'none'
            });
          });
      } else {
        this.$.css({
          'width': '0px', 'visibility': 'hidden'
        });
      }
    };

    this.xy2val = function (x, y) {
      this.m[0] = max(this.radius, min(x - this.x, this.o.width - this.radius));
      this.m[1] = max(this.radius, min(y - this.y, this.o.height - this.radius));

      return {
        0: this.o.xmin + (this.m[0] - this.radius) * this.f[0],
        1: this.o.ymin + (this.o.height - this.m[1] - this.radius) * this.f[1]
      };
    };

    this.change = function (v) {
      this.cv = v;
      this.i[0].val(this.cv[0].toFixed(this.o.ndecimals));
      this.i[1].val(this.cv[1].toFixed(this.o.ndecimals));
    };

    this.val = function (v) {
      if (null !== v) {
        this.cv = v;
        this.copy(this.cv, this.v);
        this._coord();
        this._draw();
      } else {
        return this.v;
      }
    };

    this.cancel = function () {
      this.copy(this.v, this.cv);
      this.i[0].val(this.cv[0]);
      this.i[1].val(this.cv[1]);
      this.m[0] = this.p[0];
      this.m[1] = this.p[1];
      this.change(this.cv);
      this.$.trigger('change');
      this._draw();
    };

    this.draw = function () {

      var c = this.g;

      if (this.o.displayPrevious) {
        c.beginPath();
        c.fillStyle = this.pColor;
        c.arc(this.p[0], this.p[1], this.o.pointRadius, 0, 2 * Math.PI);
        c.fill();
      }

      c.beginPath();
      c.fillStyle = this.o.pointColor;
      c.arc(this.m[0], this.m[1], this.o.pointRadius, 0, 2 * Math.PI);
      c.fill();
    };
  };

  $.fn.xy = function (o) {
    return this.each(
      function () {
        var x = new k.XY();
        x.$ = $(this);
        x.o = o;
        x.run();
      }
    ).parent();
  };

  $.fn.getValue = function () {
    return $(this).data("value")();
  };

  $.fn.setValue = function (v) {
    $(this).data("set")({ 0: v.x, 1: v.y });
  };

})(jQuery);
