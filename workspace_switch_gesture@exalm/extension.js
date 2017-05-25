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
let _event;

function init() {
}

function enable() {
  _gesture = new Gesture.TouchpadWorkspaceSwitchAction();

  if (Meta.is_wayland_compositor())
    _event = global.stage.connect('captured-event', Lang.bind(_gesture, _gesture._handleEvent));
  else
    X11GestureListener.start(Lang.bind(_gesture, _gesture._handleEvent));
}

function disable() {
  if (Meta.is_wayland_compositor())
    global.stage.disconnect(_event);
  else
    X11GestureListener.stop();

  _gesture = null;
  _event = null;
}

