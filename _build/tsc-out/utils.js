"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayDateTime = exports.formatTime = void 0;
/* exported displayDateTime formatTime */
/*
 * Copyright 2013 Meg Ford
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
 * Author: Meg Ford <megford@gnome.org>
 *
 */
const gettext_1 = require("gettext");
const _1 = require("gi://GLib");
const _2 = require("gi://Gst");
function formatTime(nanoSeconds) {
    const time = new Date(0, 0, 0, 0, 0, 0, nanoSeconds / _2.default.MSECOND);
    const miliseconds = (time.getMilliseconds() / 100).toString();
    const seconds = time.getSeconds().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const hours = time.getHours().toString().padStart(2, '0');
    // eslint-disable-next-line no-irregular-whitespace
    return `${hours} ∶ ${minutes} ∶ ${seconds} . <small>${miliseconds}</small>`;
}
exports.formatTime = formatTime;
function displayDateTime(time) {
    const DAY = 86400000000;
    const now = _1.default.DateTime.new_now_local();
    const difference = now.difference(time);
    const days = Math.floor(difference / DAY);
    const weeks = Math.floor(difference / (7 * DAY));
    const months = Math.floor(difference / (30 * DAY));
    const years = Math.floor(difference / (365 * DAY));
    if (difference < DAY) {
        const formattedTime = time.format('%X');
        // The fallback here should never be seen, but we want it here
        // for type safety purposes
        return formattedTime ? formattedTime : _('Less than a day ago');
    }
    else if (difference < 2 * DAY) {
        return _('Yesterday');
    }
    else if (difference < 7 * DAY) {
        ``;
        return gettext_1.default.ngettext('%d day ago', '%d days ago', days).format(days);
    }
    else if (difference < 14 * DAY) {
        return _('Last week');
    }
    else if (difference < 28 * DAY) {
        return gettext_1.default.ngettext('%d week ago', '%d weeks ago', weeks).format(weeks);
    }
    else if (difference < 60 * DAY) {
        return _('Last month');
    }
    else if (difference < 360 * DAY) {
        return gettext_1.default.ngettext('%d month ago', '%d months ago', months).format(months);
    }
    else if (difference < 730 * DAY) {
        return _('Last year');
    }
    return gettext_1.default.ngettext('%d year ago', '%d years ago', years).format(years);
}
exports.displayDateTime = displayDateTime;
//# sourceMappingURL=utils.js.map