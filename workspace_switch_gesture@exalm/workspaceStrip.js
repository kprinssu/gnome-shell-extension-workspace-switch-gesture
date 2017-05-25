const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const St = imports.gi.St;
const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Ext = ExtensionUtils.getCurrentExtension();
const WorkspaceClone = Ext.imports.workspaceClone;

const BASE_DIVIDER_WIDTH = 80;
const WINDOW_ANIMATION_TIME = 0.25;
const MOVEMENT_THRESHOLD = 100;
const BASE_HEIGHT = 900;
const BASE_WIDTH = 1600;
const SPEED_FACTOR_Y = 1.65;
const SPEED_FACTOR_X = SPEED_FACTOR_Y * BASE_WIDTH / BASE_HEIGHT;

const WorkspaceStrip = new Lang.Class({
  Name: 'WorkspaceStrip',

  _init: function(mon, vertical) {
    this._monitor = Main.layoutManager.monitors[mon];
    this._origWorkspace = global.screen.get_active_workspace();
    this._actor = new St.Widget({
      style_class: "gesture-workspace-strip"
    });
    this._actor.set_position(this._monitor.x, this._monitor.y);
    this._actor.set_size(this._monitor.width, this._monitor.height);

    global.stage.add_actor(this._actor);

    this._vertical = vertical;
    this._workspaces = this._fillWorkspaceData();

    let dim = this._vertical ? this._monitor.height : this._monitor.width;
    let divWidth = 0;
    if (this._vertical)
      divWidth = Math.floor(BASE_DIVIDER_WIDTH * dim / BASE_HEIGHT);
    else
      divWidth = Math.floor(BASE_DIVIDER_WIDTH * dim / BASE_WIDTH);

    this._workspaces.forEach((ws, i) => {
      this._actor.add_actor(ws.actor);
      ws.pos = dim * i + divWidth * (i + 1);
      if (this._vertical) {
        ws.actor.set_position(0, ws.pos);
      } else {
        ws.actor.set_position(ws.pos, 0);
      }
    });
    if (this._vertical) {
      this._sizeX = 0;
      this._sizeY = this._monitor.height * (this._workspaces.length - 1) + divWidth * (this._workspaces.length + 1);
    } else {
      this._sizeX = this._monitor.width * (this._workspaces.length - 1) + divWidth * (this._workspaces.length + 1);
      this._sizeY = 0;
    }

    this._hiddenChrome = [];
    Main.layoutManager._trackedActors.forEach(data => {
      if (data.trackFullscreen) {
        this._hiddenChrome.push(data.actor);
        data.actor.hide();
      }
    });

    this._x = 0;
    this._y = 0;
    this._scrollToWorkspace(this._origWorkspace);

    this._actor.set_clip(0, 0, this._monitor.width, this._monitor.height);
  },

  _scrollToWorkspace: function(to) {
    let i = 0;
    while (this._workspaces[i].workspace != to)
      i++;

    if (this._vertical)
      this._scrollTo(0, this._workspaces[i].pos);
    else
      this._scrollTo(this._workspaces[i].pos, 0);
  },

  endGesture: function(callback, cancel) {
    let pos = 0;

    if (this._vertical) {
      let dimen = this._monitor.height / 2;
      pos = this._y - dimen;

      if (Math.abs(this._y) > MOVEMENT_THRESHOLD &&
          Math.abs(this._y) < dimen * 2 &&
          Math.abs(this._speedY) > 0 &&
          this._y * this._speedY > 0)
        pos -= dimen * (this._y > 0 ? 1 : -1);
    } else {
      let dimen = this._monitor.width / 2;
      pos = this._x - dimen;

      if (Math.abs(this._x) > MOVEMENT_THRESHOLD &&
          Math.abs(this._x) < dimen * 2 &&
          Math.abs(this._speedX) > 0 &&
          this._x * this._speedX > 0)
        pos -= dimen * (this._x > 0 ? 1 : -1);
    }

    let index = this._origWorkspaceIndex;
    if (!cancel) {
      index = 0;
      while (index < this._workspaces.length - 1 && this._workspaces[index].pos < pos)
        index++;
    }

    this._scrollToAndComplete(index, callback);
  },

  _scrollToAndComplete: function(index, callback) {
    let time = WINDOW_ANIMATION_TIME;
    time *= (1 - (Math.min(Math.abs((this._vertical ? this._speedY : this._speedX) / 200), 0.5)));

    this._workspaces.forEach((data, i) => {
      let params = {
        translation_x: (this._vertical ? 0 : -this._workspaces[index].pos),
        translation_y: (this._vertical ? -this._workspaces[index].pos : 0),
        time: time,
        transition: 'easeOutQuad'
      };
      if (i == this._workspaces.length - 1) {
        params.onComplete = () => {
          let ws = this._workspaces[index].workspace;
          callback(ws);
        };
      }

      Tweener.addTween(data.actor, params);
    });
  },

  gestureUpdate: function(dx, dy) {
    // The speed should be same on different monitors
    dx *= this._monitor.width / BASE_WIDTH * SPEED_FACTOR_X;
    dy *= this._monitor.height / BASE_HEIGHT * SPEED_FACTOR_Y;

    this._speedX = dx;
    this._speedY = dy;

    this._scrollTo(this._x - dx, this._y - dy);
  },

  _scrollTo: function(x, y) {
    if (x < 0)
      x = 0;
    if (y < 0)
      y = 0;
    if (x > this._sizeX)
      x = this._sizeX;
    if (y > this._sizeY)
      y = this._sizeY;

    // Round dx and dy so that the picture is always crisp
    x = Math.round(x);
    y = Math.round(y);

    this._x = x;
    this._y = y;

    this._workspaces.forEach(ws	 => {
      ws.actor.set_translation(-x, -y, 0);
    });
  },

  _fillWorkspaceData: function() {
    let workspaces = []

    let ws = this._origWorkspace;
    let ws1 = ws.get_neighbor(this._vertical ? Meta.MotionDirection.UP : Meta.MotionDirection.LEFT);
    let ws2 = ws.get_neighbor(this._vertical ? Meta.MotionDirection.DOWN : Meta.MotionDirection.RIGHT);

    this._origWorkspaceIndex = 0;

    if (ws1 != ws) {
      workspaces.push(ws1);
      this._origWorkspaceIndex++;
    }

    workspaces.push(ws);

    if (ws2 != ws)
      workspaces.push(ws2);

    return workspaces.map(ws => {
      return new WorkspaceClone.WorkspaceClone(ws, this._monitor);
    });
  },

  destroy: function(ws) {
    let i = 0;
    while (this._workspaces[i].workspace != ws)
      i++;

    if (!this._workspaces[i].fullscreen)
      this._hiddenChrome.forEach(actor => {
        actor.show();
      });
    this._hiddenChrome = null;

    this._workspaces.forEach(ws => {
      ws.destroy()
    });
    this._workspaces = null;

    global.stage.remove_actor(this._actor);

    this._actor.destroy();
    this._actor = null;

    this._monitor = null;
    this._monitorIndex = null;
  },
});

