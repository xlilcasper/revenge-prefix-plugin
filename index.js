import { Plugin } from '@vendetta/plugin';
import { instead } from '@vendetta/patcher';
import { findByProps } from '@vendetta/metro';
import { storage } from '@vendetta/plugin';
import { React } from '@vendetta/metro/common';
import { getAssetIDByName } from '@vendetta/ui/assets';
import { Forms } from '@vendetta/ui/components';

const MessageStore = findByProps('sendMessage');

export default class MessagePrefixer extends Plugin {
    prefixOptions = [
        { title: 'None', text: '' },
        { title: 'Angry', text: '😠 ' },
        { title: 'Warning', text: '⚠️ ' },
        // Add your custom titles and prefixes here
    ];

    start() {
        if (!storage.currentPrefixIndex) storage.currentPrefixIndex = 0;

        // Add the button to the chat bar
        const chatBarPatch = instead('default', findByProps('ChatBarInput'), (args, orig) => {
            const ret = orig(...args);
            
            const button = React.createElement(Forms.Button, {
                style: {
                    marginRight: 8,
                    minWidth: 60
                },
                size: "small",
                onPress: () => {
                    storage.currentPrefixIndex = 
                        (storage.currentPrefixIndex + 1) % this.prefixOptions.length;
                    this._forceUpdate();
                }
            }, this.prefixOptions[storage.currentPrefixIndex].title);

            ret.props.children.unshift(button);
            return ret;
        });

        // Modify outgoing messages
        const messagePatch = instead('sendMessage', MessageStore, (args, orig) => {
            const currentPrefix = this.prefixOptions[storage.currentPrefixIndex];
            if (currentPrefix.title !== 'None') {
                args[1].content = currentPrefix.text + args[1].content;
            }
            return orig(...args);
        });

        this.patches = [chatBarPatch, messagePatch];
    }

    stop() {
        for (const unpatch of this.patches) unpatch();
    }
}
