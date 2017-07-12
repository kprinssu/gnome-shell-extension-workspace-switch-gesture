const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Ext = ExtensionUtils.getCurrentExtension();
const FakeAppMenu = Ext.imports.fakeAppMenu;

const PanelClone = new Lang.Class({
  Name: 'PanelClone',

  _init: function(ws, mon, panel) {
    this.monitor = mon;
    this.workspace = ws;

    this.actor = new St.Widget();

    this._clone = new Clutter.Clone({
      source: panel,
      x: panel.x - mon.x,
      y: panel.y - mon.y
    });
    this._clone.set_anchor_point(panel.anchor_x, panel.anchor_y);

    this.actor.add_child(this._clone);

    if (panel == Main.panel.actor.get_parent() &&
        this.monitor.index == global.screen.get_primary_monitor()) {
      // Create fake workspace-specific appmenu
      let app = this._getFocusedApp();
      if (app != null && !this._fullscreen) {
        this._fakeAppMenu = new FakeAppMenu.FakeAppMenuButton(app, this.actor);
      }
    }
  },

  destroy: function() {
    if (this._fakeAppMenu) {
      this._fakeAppMenu.destroy();
      this._fakeAppMenu = null;
    }
    this._clone.destroy();
    this.actor.destroy();
  },

  _getFocusedApp: function() {
    let tracker = Shell.WindowTracker.get_default();

    // If this is the active workspace, just request the focused app normally
    if (this.workspace == global.screen.get_active_workspace()) {
      let focusedApp = tracker.focus_app;
      if (focusedApp && focusedApp.is_on_workspace(this.workspace))
        return focusedApp;
    }

    let windows = global.get_window_actors();

    // Take out the ones on other workspaces and monitors
    windows = windows.filter(actor => {
      let window = actor.get_meta_window();
      return window.located_on_workspace(this.workspace) &&
             window.get_monitor() == this.monitor.index &&
             window.showing_on_its_workspace() &&
             window.get_window_type() != Meta.WindowType.OVERRIDE_OTHER &&
             window.get_window_type() != Meta.WindowType.DESKTOP;
    });

    // Get the app for the topmost window
    if (windows.length > 0) {
      let win = windows[windows.length - 1].get_meta_window();
      return tracker.get_window_app(win);
    }

    return null;
  }
});
