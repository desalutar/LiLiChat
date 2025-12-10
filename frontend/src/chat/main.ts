import { ChatController } from "./ui.js"
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        new ChatController()
    })
} else {
    new ChatController()
}

