const Lang = imports.lang;
const Main = imports.ui.main;

let _origSwitchWorkspace, _origSwitchWorkspaceDone;

function hook() {
  _origSwitchWorkspace = Main.wm._switchWorkspace;
  _origSwitchWorkspaceDone = Main.wm._switchWorkspaceDone;

  Main.wm._switchWorkspace = Lang.bind(Main.wm, _switchWorkspaceMod);
  Main.wm._switchWorkspaceDone = Lang.bind(Main.wm, _switchWorkspaceDoneMod);
}

function unhook() {
  Main.wm._switchWorkspace = _origSwitchWorkspace;
  Main.wm._switchWorkspaceDone = _origSwitchWorkspaceDone;
}

function _switchWorkspaceMod(shellwm, from, to, direction) {
  if (!Main.sessionMode.hasWorkspaces || !Main.wm._shouldAnimate()) {
    shellwm.completed_switch_workspace();
    return;
  }

  _switchWorkspaceDoneMod(shellwm);
}

function _switchWorkspaceDoneMod(shellwm) {
  shellwm.completed_switch_workspace();
}

