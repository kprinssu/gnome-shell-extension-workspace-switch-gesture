const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;

const ExtensionUtils = imports.misc.extensionUtils;
const Ext = ExtensionUtils.getCurrentExtension();

const Gesture = Ext.imports.gesture;

let _gesture;
let _event;

function init() {
}

function enable() {
  _gesture = new Gesture.TouchpadWorkspaceSwitchAction();
  _event = global.stage.connect('captured-event', Lang.bind(_gesture, _gesture._handleEvent));
}

function disable() {
  global.stage.disconnect(_event);
  _gesture = null;
  _event = null;
}

