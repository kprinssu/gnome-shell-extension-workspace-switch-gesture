const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const GESTURE_TYPES = {
  SWIPE: Clutter.EventType.TOUCHPAD_SWIPE,
  PINCH: Clutter.EventType.TOUCHPAD_PINCH
};

const GESTURE_PHASES = {
  BEGIN: Clutter.TouchpadGesturePhase.BEGIN,
  UPDATE: Clutter.TouchpadGesturePhase.UPDATE,
  END: Clutter.TouchpadGesturePhase.END
};

let _pid, _stdout, _reader, _handleEvent, _stopping;

function _processLine(data) {
  // ,event4,GESTURE_SWIPE_UPDATE,+2.12s,3,0.09/,0.00,(,0.38/,0.00,unaccelerated)
  let parts = data.split(/[\s\t]+/);

  if (parts.length < 2)
    return;

  if (!parts[2].startsWith("GESTURE"))
    return;

  // ["GESTURE", "SWIPE", "UPDATE"]
  let gestureParts = parts[2].split(/\s+/)[0].split("_");

  // ["3", "7.34", "0.85", "18.36", "2.13", "unaccelerated"]
  let infoParts = parts[2].split(/[\s+\/\(\)]+/);

  let type = GESTURE_TYPES[gestureParts[1]];
  if (type != GESTURE_TYPES.SWIPE)
    return;

  let phase = GESTURE_PHASES[gestureParts[2]];
  let fingers = parts[4];
  let dx = 0;
  let dy = 0;

  if (phase == Clutter.TouchpadGesturePhase.UPDATE) {
    let coordParts = parts[5].split("/");

    if (coordParts[1] == '') {
      coordParts[1] = parts[6];
    }

    dx = coordParts[0] * 1;
    dy = coordParts[1] * 1;
  }

  let event = {
    type: function() {
      return type;
    },

    get_touchpad_gesture_finger_count: function() {
      return fingers;
    },

    get_gesture_phase: function() {
      return phase;
    },

    get_gesture_motion_delta: function() {
      return [dx, dy];
    },

    get_time: function() {
      return Clutter.CURRENT_TIME;
    }
  };

  if (_handleEvent)
    _handleEvent(global.stage, event);
}

function _read() {
  _reader.read_line_async(GLib.PRIORITY_DEFAULT, null, (stream, result) => {

    let [line, len] = _reader.read_line_finish_utf8(result);

    if (_stopping) {
      _close();
      return;
    }

    if (!line) {
      _stdout.close(null);
      _restart();
      return;// _read();
    } 

    _processLine(line.toString());
    _read();
  }); 
}

function _restart() {
  let h = _handleEvent;
  stop();
  start(h);
}

function _close() {
  _handleEvent = null;

  if (!_stdout.is_closed())
    _stdout.close(null);
  _reader.close(null);

  GLib.spawn_close_pid(_pid);
  _pid = null;
}

function start(handler) {
  _handleEvent = handler;
  _stopping = false;

  let [success, pid, stdin, stdout, stderr] =
    GLib.spawn_async_with_pipes(null,
      ["stdbuf", "-oL", "--", "libinput-debug-events"],
      null, GLib.SpawnFlags.SEARCH_PATH, null);

  _pid = pid;
  _stdout = new Gio.UnixInputStream({ fd: stdout });
  _reader = new Gio.DataInputStream({ base_stream: _stdout });

  GLib.close(stdin);
  GLib.close(stderr);

  _read();
}

function stop() {
  _stopping = true;
}
