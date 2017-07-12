const Clutter = imports.gi.Clutter;
const Lang = imports.lang;

const PanelClone = new Lang.Class({
  Name: 'PanelClone',

  _init: function(actor, mon) {
    [anchorX, anchorY] = actor.get_anchor_point();

    this._clone = new Clutter.Clone({
      source: actor,
      x: actor.x - mon.x,
      y: actor.y - mon.y
    });
    this._clone.set_anchor_point(anchorX, anchorY);
  },

  destroy: function() {
    this._clone.destroy();
    this._clone = null;
  }
});
