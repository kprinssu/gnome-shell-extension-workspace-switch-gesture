const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Ext = ExtensionUtils.getCurrentExtension();
const PanelClone = Ext.imports.panelClone;

const WindowClone = new Lang.Class({
  Name: 'WindowClone',

  _init: function(actor, mon) {
    this.window = actor.get_meta_window();
    this._clone = new Clutter.Clone({
      source: actor,
      x: actor.x - mon.x,
      y: actor.y - mon.y
    });
  },

  destroy: function() {
    this._clone.destroy();
    this._clone = null;
    this.window = null;
  }
});

const WorkspaceClone = new Lang.Class({
  Name: 'WorkpaceClone',

  _init: function(ws, mon) {
    this.workspace = ws;
    this._monitor = mon;
    this._windows = [];
    this.fullscreen = false;

    // Create the outer actor
    this.actor = new St.Widget({
      style_class: "gesture-workspace-shadow1"
    });
    this.actor.set_size(this._monitor.width, this._monitor.height);

    // A hack so that we can have two box-shadows
    this._secondaryActor = new St.Widget({
      style_class: "gesture-workspace-shadow2"
    });
    this._secondaryActor.set_size(this._monitor.width, this._monitor.height);
    this.actor.add_child(this._secondaryActor);

    // Create the inner actor
    this._container = new St.Widget({
      style_class: "gesture-workspace-content"
    });
    this._container.set_size(this._monitor.width, this._monitor.height);
    this._container.set_clip(0, 0, this._monitor.width, this._monitor.height);

    // Add the inner actor into the outer actor
    // The inner actor has to be clipped, and the outer one has box-shadow
    this._secondaryActor.add_child(this._container);

    // Create the background
    this._bg = new Clutter.Clone({
      source: Main.layoutManager._bgManagers[mon.index]._container,
      x: -this._monitor.x,
      y: -this._monitor.y
    });
    this._container.add_child(this._bg);

    // Find all windows
    let wins = global.get_window_actors();

    // Take out the ones on other workspaces and monitors
    wins = wins.filter(actor => {
      let window = actor.get_meta_window();
      return window.located_on_workspace(this.workspace) &&
             window.showing_on_its_workspace() &&
             window.get_window_type() != Meta.WindowType.OVERRIDE_OTHER;
    }).sort((a, b) => {
        return a.get_meta_window().get_layer()
            - b.get_meta_window().get_layer();
    });

    // Add all windows to our workspace
    wins.forEach(actor => {
      this.fullscreen |= actor.get_meta_window().fullscreen &&
          actor.get_meta_window().get_monitor() == this._monitor.index;

      let clone = new WindowClone(actor, this._monitor);
      this._windows.push(clone);
      this._container.add_child(clone._clone);
    });

    // Also add panels
    this._panels = [];
    if (!this.fullscreen) {
      let panels = Main.layoutManager._trackedActors.filter(data => {
          return data.trackFullscreen;
      });
      panels.forEach(data => {
        let clone = new PanelClone.PanelClone(this.workspace, this._monitor, data.actor);
        this._container.add_child(clone.actor);
        this._panels.push(clone);
      });
    }
  },

  destroy: function() {
    // Reparent all the windows back
    for (let i = 0; i < this._windows.length; i++) {
      this._windows[i].destroy();
    }
    this._windows = null;

    this._panels.forEach(panel => {
      panel.destroy();
    });
    this._panels = null;

    // Destroy wallpaper
    this._bg.destroy();
    this._bg = null;

    this._container.destroy();
    this._container = null;

    this._secondaryActor.destroy();
    this._secondaryActor = null;

    // Destroy the actor itself
    this.actor.destroy();
    this.actor = null;

    this.workspace = null;
    this._monitor = null;
  }
});

