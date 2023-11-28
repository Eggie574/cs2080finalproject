"use strict";
/* exported WaveForm
/*
 * Copyright 2013 Meg Ford
             2020 Kavan Mevada
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, see <http://www.gnu.org/licenses/>.
 *
 *  Author: Meg Ford <megford@gnome.org>
 *          Kavan Mevada <kavanmevada@gmail.com>
 *
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaveForm = exports.WaveType = void 0;
// based on code from Pitivi
const _1 = require("gi://Adw");
const _2 = require("gi://GObject");
const _3 = require("gi://Gtk?version=4.0");
// @ts-expect-error This module doesn't import nicely
const cairo_1 = require("cairo");
var WaveType;
(function (WaveType) {
    WaveType[WaveType["Recorder"] = 0] = "Recorder";
    WaveType[WaveType["Player"] = 1] = "Player";
})(WaveType || (exports.WaveType = WaveType = {}));
const GUTTER = 4;
class WaveForm extends _3.default.DrawingArea {
    constructor(params, type) {
        super(params);
        this._peaks = [];
        this._position = 0;
        this.waveType = type;
        if (this.waveType === WaveType.Player) {
            this.dragGesture = _3.default.GestureDrag.new();
            this.dragGesture.connect('drag-begin', this.dragBegin.bind(this));
            this.dragGesture.connect('drag-update', this.dragUpdate.bind(this));
            this.dragGesture.connect('drag-end', this.dragEnd.bind(this));
            this.add_controller(this.dragGesture);
        }
        this.hcId = _1.default.StyleManager.get_default().connect('notify::high-contrast', () => {
            this.queue_draw();
        });
        this.set_draw_func(this.drawFunc.bind(this));
    }
    dragBegin(gesture) {
        gesture.set_state(_3.default.EventSequenceState.CLAIMED);
        this.emit('gesture-pressed');
    }
    dragUpdate(_gesture, offsetX) {
        if (this.lastX) {
            this._position = this.clamped(offsetX + this.lastX);
            this.queue_draw();
        }
    }
    dragEnd() {
        this.lastX = this._position;
        this.emit('position-changed', this.position);
    }
    drawFunc(superDa, ctx) {
        const da = superDa;
        const maxHeight = da.get_allocated_height();
        const vertiCenter = maxHeight / 2;
        const horizCenter = da.get_allocated_width() / 2;
        let pointer = horizCenter + da._position;
        const styleContext = da.get_style_context();
        const leftColor = styleContext.get_color();
        const rightColor = styleContext.lookup_color('dimmed_color')[1];
        const dividerName = da.waveType === WaveType.Player
            ? 'accent_color'
            : 'destructive_color';
        const lookupColor = styleContext.lookup_color(dividerName);
        const ok = lookupColor[0];
        let dividerColor = lookupColor[1];
        if (!ok)
            dividerColor = styleContext.get_color();
        // Because the cairo module isn't real, we have to use these to ignore `any`.
        // We keep them to the minimum possible scope to catch real errors.
        /* eslint-disable @typescript-eslint/no-unsafe-call */
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        ctx.setLineCap(cairo_1.default.LineCap.ROUND);
        ctx.setLineWidth(2);
        da.setSourceRGBA(ctx, dividerColor);
        ctx.moveTo(horizCenter, vertiCenter - maxHeight);
        ctx.lineTo(horizCenter, vertiCenter + maxHeight);
        ctx.stroke();
        ctx.setLineWidth(1);
        /* eslint-enable @typescript-eslint/no-unsafe-call */
        /* eslint-enable @typescript-eslint/no-unsafe-member-access */
        da._peaks.forEach((peak) => {
            if (da.waveType === WaveType.Player && pointer > horizCenter)
                da.setSourceRGBA(ctx, rightColor);
            else
                da.setSourceRGBA(ctx, leftColor);
            /* eslint-disable @typescript-eslint/no-unsafe-call */
            /* eslint-disable @typescript-eslint/no-unsafe-member-access */
            ctx.moveTo(pointer, vertiCenter + peak * maxHeight);
            ctx.lineTo(pointer, vertiCenter - peak * maxHeight);
            ctx.stroke();
            /* eslint-enable @typescript-eslint/no-unsafe-call */
            /* eslint-enable @typescript-eslint/no-unsafe-member-access */
            if (da.waveType === WaveType.Player)
                pointer += GUTTER;
            else
                pointer -= GUTTER;
        });
    }
    set peak(p) {
        if (this._peaks) {
            if (this._peaks.length > this.get_allocated_width() / (2 * GUTTER))
                this._peaks.pop();
            this._peaks.unshift(p.toFixed(2));
            this.queue_draw();
        }
    }
    set peaks(p) {
        this._peaks = p;
        this.queue_draw();
    }
    set position(pos) {
        if (this._peaks) {
            this._position = this.clamped(-pos * this._peaks.length * GUTTER);
            this.lastX = this._position;
            this.queue_draw();
            this.notify('position');
        }
    }
    get position() {
        return -this._position / (this._peaks.length * GUTTER);
    }
    clamped(position) {
        if (position > 0)
            position = 0;
        else if (position < -this._peaks.length * GUTTER)
            position = -this._peaks.length * GUTTER;
        return position;
    }
    setSourceRGBA(cr, rgba) {
        /* eslint-disable @typescript-eslint/no-unsafe-call */
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        cr.setSourceRGBA(rgba.red, rgba.green, rgba.blue, rgba.alpha);
        /* eslint-enable @typescript-eslint/no-unsafe-call */
        /* eslint-enable @typescript-eslint/no-unsafe-member-access */
    }
    destroy() {
        _1.default.StyleManager.get_default().disconnect(this.hcId);
        this._peaks.length = 0;
        this.queue_draw();
    }
}
exports.WaveForm = WaveForm;
_a = WaveForm;
(() => {
    _2.default.registerClass({
        Properties: {
            position: _2.default.ParamSpec.float('position', 'Waveform position', 'Waveform position', _2.default.ParamFlags.READWRITE |
                _2.default.ParamFlags.CONSTRUCT, 0.0, 1.0, 0.0),
            peak: _2.default.ParamSpec.float('peak', 'Waveform current peak', 'Waveform current peak in float [0, 1]', _2.default.ParamFlags.READWRITE |
                _2.default.ParamFlags.CONSTRUCT, 0.0, 1.0, 0.0),
        },
        Signals: {
            'position-changed': { param_types: [_2.default.TYPE_DOUBLE] },
            'gesture-pressed': {},
        },
    }, _a);
})();
//# sourceMappingURL=waveform.js.map