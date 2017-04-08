Workspace Switch Gesture is an extension for GNOME Shell that adds a better workspace switching gesture for touchpads.

The difference from default GNOME Shell workspace switching gesture is that this one uses a gesture-driven animation,
meaning that the scrolling workspaces stick to fingers, so that the animation is super smooth and responsive.

It currently uses a 3-finger swipe rather than a 4-finger one because my touchpad only supports 3 fingers.
Perhaps this should be configurable.

The extension supports the gesture even on X11 via parsing libinput-debug-events output.
For that the current user has to be in input group.
This is pretty fragile, and I may remove it later. On Wayland native gesture recognition is used.

Both vertical (default) and horizontal workspaces are supported. Multi-monitor configurations are also supported.
