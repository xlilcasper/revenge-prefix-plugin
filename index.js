import { Plugin } from "@vendetta/plugin";
import { instead } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { React } from "@vendetta/metro/common";
import { Button, Forms } from "@vendetta/ui/components"; // Button fallback if available

const MessageStore = findByProps("sendMessage");
const ChatBarMod = findByProps("ChatBarInput"); // wrapper that renders the composer

export default class MessagePrefixer extends Plugin {
  prefixOptions = [
    { title: "None",    text: ""    },
    { title: "Angry",   text: "😠 " },
    { title: "Warning", text: "⚠️ " },
    // Add more options here
  ];

  start() {
    // init storage once; use nullish coalescing so index 0 isn’t treated as “unset”
    if (storage.currentPrefixIndex == null) storage.currentPrefixIndex = 0;
    this.patches = [];

    // --- Patch the chat bar to inject a toggle button ---
    if (ChatBarMod && ChatBarMod.default) {
      const unpatchChat = instead("default", ChatBarMod, (args, orig) => {
        const el = orig(...args);

        // normalize children to an array we can safely mutate
        const kids = Array.isArray(el.props.children)
          ? [...el.props.children]
          : el.props.children != null
          ? [el.props.children]
          : [];

        // Tiny component that owns its own state so the label updates instantly
        const PrefixToggle = () => {
          const [idx, setIdx] = React.useState(storage.currentPrefixIndex ?? 0);
          const current = this.prefixOptions[idx] ?? this.prefixOptions[0];

          const onPress = () => {
            const next = (idx + 1) % this.prefixOptions.length;
            storage.currentPrefixIndex = next;
            setIdx(next);
          };

          // Prefer Button if exported; otherwise fall back to Forms.FormButton
          const Btn = Button ?? Forms?.FormButton ?? "button";
          const props =
            Btn === "button"
              ? { onClick: onPress, style: { marginRight: 8, padding: "2px 8px" } }
              : { onPress: onPress, size: "small", style: { marginRight: 8, minWidth: 60 } };

          return React.createElement(Btn, props, current.title);
        };

        kids.unshift(React.createElement(PrefixToggle));
        return React.cloneElement(el, { ...el.props, children: kids });
      });
      this.patches.push(unpatchChat);
    }

    // --- Patch sendMessage to prepend the prefix ---
    if (MessageStore && typeof MessageStore.sendMessage === "function") {
      const unpatchSend = instead("sendMessage", MessageStore, (args, orig) => {
        try {
          const idx = storage.currentPrefixIndex ?? 0;
          const opt = this.prefixOptions[idx] ?? this.prefixOptions[0];
          if (opt.text && args?.[1]?.content && typeof args[1].content === "string") {
            // clone payload to avoid mutating upstream references
            args[1] = { ...args[1], content: opt.text + args[1].content };
          }
        } catch (e) {
          // keep the client resilient; don’t break sendMessage if something goes wrong
          console.error("[MessagePrefixer] sendMessage wrap error:", e);
        }
        return orig(...args);
      });
      this.patches.push(unpatchSend);
    } else {
      console.warn("[MessagePrefixer] MessageStore.sendMessage not found; skipping patch");
    }
  }

  stop() {
    if (this.patches) {
      for (const unpatch of this.patches) {
        try { unpatch && unpatch(); } catch {}
      }
      this.patches = [];
    }
  }
}
