const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Signals = imports.signals;

const ExtensionUtils = imports.misc.extensionUtils;
const Ext = ExtensionUtils.getCurrentExtension();

const Gesture = Ext.imports.gesture;
const X11GestureListener = Ext.imports.x11GestureListener;

let _gesture;

function init() {
  Signals.addSignalMethods(Gesture.TouchpadWorkspaceSwitchAction.prototype);
}

function enable() {
  _gesture = new Gesture.TouchpadWorkspaceSwitchAction();

  if (Meta.is_wayland_compositor())
    global.stage.connect('captured-event', Lang.bind(_gesture, _gesture._handleEvent));
  else
    X11GestureListener.start(Lang.bind(_gesture, _gesture._handleEvent));
}

function disable() {
  if (Meta.is_wayland_compositor())
    global.stage.disconnect('captured-event', Lang.bind(_gesture, _gesture._handleEvent));
  else
    X11GestureListener.stop();

  _gesture = null;
}

