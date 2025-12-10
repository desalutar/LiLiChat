import { AuthController } from "./ui.js"
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        new AuthController()
    })
} else {
    new AuthController()
}

