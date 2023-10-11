/*
 * Copyright (c) 2022-2023 Antmicro <www.antmicro.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { reactive } from 'vue';

const storageAvailable = (() => {
    try {
        const randomKey = Math.random().toString(36);
        const randomValue = Math.random().toString(36);
        localStorage.setItem(randomKey, randomValue);
        localStorage.removeItem(randomKey);
        return true;
    } catch {
        return false;
    }
})();

const pmStorage = new Map();
const get = (key) => {
    if (storageAvailable) return localStorage.getItem(key);
    return pmStorage.get(key) ?? null;
};

const set = (key, value) => {
    if (storageAvailable) localStorage.setItem(key, value);
    else pmStorage.set(key, value);
};

const remove = (key) => {
    if (storageAvailable) localStorage.removeItem(key);
    else pmStorage.delete(key);
};

/* eslint-disable import/prefer-default-export */
export const notificationStore = reactive({
    notifications: JSON.parse(get('notifications')) || [],
    add(notification) {
        const newNotifications = [...this.notifications, notification];

        set('notifications', JSON.stringify(newNotifications));
        this.notifications = newNotifications;
    },

    remove() {
        remove('notifications');
        this.notifications = [];
    },

    removeOne(index) {
        const newNotifications = this.notifications.filter((_, idx) => index !== idx);

        set('notifications', JSON.stringify(newNotifications));
        this.notifications = newNotifications;
    },
});

export const terminalStore = reactive({
    logs: JSON.parse(get('logs')) || [],
    add(log) {
        const newNotifications = [...this.logs, log];

        set('logs', JSON.stringify(newNotifications));
        this.logs = newNotifications;
    },

    /**
     * Adds a parsed notification. If there are messages, then it returns a following message:
     *
     * Title:
     *     message_first_line
     *     message_second_line
     *     ...
     *     message_last_line
     *
     * Otherwise, if messages are empty, then it returns a following message:
     *
     * Title.
     *
     * @param {string} title title of the message
     * @param {Array[string] | string | undefined} messages messages of the message
     */
    addParsed(title, messages) {
        let parsedMessage = title;
        if (messages) {
            if (typeof messages === 'string' || messages instanceof String) {
                messages = [messages]; // eslint-disable-line no-param-reassign
            }
            parsedMessage += ':';

            messages.forEach((message) => {
                parsedMessage += '\n';
                parsedMessage += '    ';
                parsedMessage += message;
            });
        } else {
            parsedMessage += '.';
        }
        this.add(parsedMessage);
    },

    remove() {
        remove('logs');
        this.logs = [];
    },
});
