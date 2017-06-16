const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Ext = ExtensionUtils.getCurrentExtension();
const WorkspaceStrip = Ext.imports.workspaceStrip;

const NATURAL_SCROLLING = true;

const TouchpadWorkspaceSwitchAction = new Lang.Class({
  Name: 'TouchpadWorkspaceSwitchAction',

  _init: function() {
    this._init = 0;
  },

  _handleEvent: function(actor, event) {
    if (!Main.sessionMode.hasWorkspaces)
      return Clutter.EVENT_PROPAGATE;

    if (event.type() != Clutter.EventType.TOUCHPAD_SWIPE)
      return Clutter.EVENT_PROPAGATE;

    if (event.get_touchpad_gesture_finger_count() != 3)
      return Clutter.EVENT_PROPAGATE;

    if (event.get_gesture_phase() == Clutter.TouchpadGesturePhase.BEGIN && this._init == 0) {
      if (Main.actionMode != Shell.ActionMode.NORMAL)
        return Clutter.EVENT_PROPAGATE;

      this._startGesture();
      return Clutter.EVENT_STOP;
    }

    if (event.get_gesture_phase() == Clutter.TouchpadGesturePhase.UPDATE && this._init > 0) {
      if (Main.actionMode != Shell.ActionMode.NONE)
        return Clutter.EVENT_PROPAGATE;

      let [dx, dy] = event.get_gesture_motion_delta(event);
      if (!NATURAL_SCROLLING) {
        dx = -dx;
        dy = -dy;
      }

      this._updateGesture(dx, dy);

      return Clutter.EVENT_STOP;
    }

    if (this._init == 2) {
      if (Main.actionMode != Shell.ActionMode.NONE)
        return Clutter.EVENT_PROPAGATE;

      let cancel = event.get_gesture_phase() == Clutter.TouchpadGesturePhase.CANCEL;

      if (event.get_gesture_phase() == Clutter.TouchpadGesturePhase.END || cancel) {
        this._endGesture(cancel, event.get_time());

        return Clutter.EVENT_STOP;
      }
    }

    return Clutter.EVENT_PROPAGATE;
  },

  _startGesture: function() {
    this._origWs = global.screen.get_active_workspace();
    this._init = 1;

    Main.actionMode = Shell.ActionMode.NONE;
    if (this._origWs.get_neighbor(Meta.MotionDirection.LEFT) == this._origWs &&
        this._origWs.get_neighbor(Meta.MotionDirection.RIGHT) == this._origWs)
      this._initStrip(true);
    else
    if (this._origWs.get_neighbor(Meta.MotionDirection.UP) == this._origWs &&
        this._origWs.get_neighbor(Meta.MotionDirection.DOWN) == this._origWs)
      this._initStrip(false);
  },

  _updateGesture: function(dx, dy) {
    if (this._init == 1) {
      this._initStrip(Math.abs(dy) > Math.abs(dx));
    } else {
      this._strips.forEach(strip => {
        strip.gestureUpdate(dx, dy);
      });
    }
  },

  _endGesture: function(cancel, time) {
    this._strips.forEach(strip => {
      strip.endGesture(ws => {
        let primary = strip._monitor.index == global.screen.get_primary_monitor();
        if (primary) {
          Tweener.removeTweens(Main.panel.statusArea.appMenu.actor);
          Main.layoutManager.uiGroup.show();
          Main.panel.statusArea.appMenu.actor.opacity = 255;
          if (this._origWs != ws) {
            Main.wm._blockAnimations = true;
            ws.activate(time);
            Main.wm._blockAnimations = false;
          }
        }

        strip.destroy(ws);
        strip = null;

        if (primary) {
          this._init = 0;
          Meta.enable_unredirect_for_screen(global.screen);
          Main.actionMode = Shell.ActionMode.NORMAL;
        }
      }, cancel);
    });
  },

  _initStrip: function(vertical) {
    let mons = [];
    if (Meta.prefs_get_workspaces_only_on_primary())
      mons.push(global.screen.get_primary_monitor());
    else
      mons = Main.layoutManager.monitors.map(mon => {
        return mon.index;
      });

    this._strips = mons.map(index => {
      return new WorkspaceStrip.WorkspaceStrip(index, vertical);
    });
    this._init = 2;
    Meta.disable_unredirect_for_screen(global.screen);
    Tweener.removeTweens(Main.panel.statusArea.appMenu.actor);
    Main.panel.statusArea.appMenu.actor.opacity = 0;
    Main.layoutManager.uiGroup.hide();
  }
});

