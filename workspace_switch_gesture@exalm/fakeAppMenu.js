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
    this._targetApp = app;

    // A workaround for themes
    this.container.set_name("panel");

    let box = new St.BoxLayout({
        style_class: 'panel-status-menu-box'
    });

    // icon
    let icon_size = Panel.PANEL_ICON_SIZE - Panel.APP_MENU_ICON_MARGIN;
    box.add_actor(new St.Bin({
        style_class: 'app-menu-icon',
        child: app.create_icon_texture(icon_size)
    }));

    // label
    box.add_actor(new St.Label({
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        text: this._targetApp.get_name()
    }));

    // arrow
    box.add_actor(PopupMenu.arrowIcon(St.Side.BOTTOM));

    this.actor.add_actor(new St.Bin({
        name: 'appMenu',
        child: box
    }));

    cont.add_child(this.container);

    this.actor.set_accessible_name(this._targetApp.get_name());

    if (!Gtk.Settings.get_default().gtk_shell_shows_app_menu || Main.panel.statusArea.appMenu.container.get_parent() == null)
      this.actor.hide();

    let parent = Main.panel.statusArea.appMenu.container;
    let [x,y] = parent.get_position();
    let max_width = parent.get_parent().get_next_sibling().x - x;
    let hpadding = Main.panel.statusArea.appMenu.actor.get_theme_node().get_length("-natural-hpadding");
    x -= hpadding;
    this.container.set_position(x, y);
    if (box.width > max_width)
        box.width = max_width;
  },

  destroy: function() {
    this.actor.destroy();
    this.actor._delegate = null;
  }
});
