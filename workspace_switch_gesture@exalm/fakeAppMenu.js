// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const Clutter = imports.gi.Clutter;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;

const FakeAppMenuButton = new Lang.Class({
  Name: 'FakeAppMenuButton',
  Extends: PanelMenu.ButtonBox,

  _init: function(app, cont) {
    this.parent();
    // A workaround for themes
    this.container.set_name("panel");

    this._targetApp = app;

    let bin = new St.Bin({ name: 'appMenu' });
    this.actor.add_actor(bin);
    this.actor.set_accessible_name(this._targetApp.get_name());

    this._container = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
    bin.set_child(this._container);

    this._iconBox = new St.Bin({ style_class: 'app-menu-icon' });
    this._container.add_actor(this._iconBox);

    this._label = new St.Label({ y_expand: true,
                                 y_align: Clutter.ActorAlign.CENTER });
    this._label.set_text(this._targetApp.get_name());
    this._container.add_actor(this._label);

    this._arrow = PopupMenu.arrowIcon(St.Side.BOTTOM);
    this._container.add_actor(this._arrow);

    if (this._targetApp == null || !Gtk.Settings.get_default().gtk_shell_shows_app_menu || Main.panel.statusArea.appMenu.container.get_parent() == null)
      this.actor.hide();

    this._stop = true;

    this._syncIcon();

    cont.add_child(this.container);

    let [x,y] = Main.panel.statusArea.appMenu.actor.get_parent().get_position();
    let hp = Main.panel.statusArea.appMenu.actor.get_theme_node().get_length("-natural-hpadding");
    x -= hp;
    this.container.set_position(x, y);
  },

  _syncIcon: function() {
    if (!this._targetApp)
      return;

    let icon = this._targetApp.create_icon_texture(Panel.PANEL_ICON_SIZE - Panel.APP_MENU_ICON_MARGIN);
    this._iconBox.set_child(icon);
  },

  destroy: function() {
    this.actor.destroy();
    this.actor._delegate = null;
  }
});

