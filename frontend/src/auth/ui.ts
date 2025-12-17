import { AuthService } from "./index.js"
import { LoginCredentials, RegisterCredentials } from "./types.js"

export class AuthController {
    private authService: AuthService
    private form: HTMLFormElement | null
    private title: HTMLElement | null
    private submitButton: HTMLButtonElement | null
    private toggleLink: HTMLElement | null
    private toggleText: HTMLElement | null
    private messageBox: HTMLElement | null
    private isLogin: boolean = true

    constructor() {
        this.authService = new AuthService()
        this.form = document.getElementById("auth-form") as HTMLFormElement
        this.title = document.getElementById("form-title")
        this.submitButton = document.getElementById("submit-button") as HTMLButtonElement
        this.toggleLink = document.getElementById("toggle-link")
        this.toggleText = document.getElementById("toggle-text")
        this.messageBox = document.getElementById("message-box")
        this.initialize()
    }

    private initialize(): void {
        this.bindEvents()
        this.checkExistingAuth().catch(() => {})
    }

    private bindEvents(): void {
        if (this.form) {
            this.form.addEventListener("submit", (e) => this.handleSubmit(e))
        }

        if (this.toggleLink) {
            this.toggleLink.addEventListener("click", (e) => {
                e.preventDefault()
                this.toggleMode()
            })
        }
    }

    private toggleMode(): void {
        this.isLogin = !this.isLogin
        if (this.isLogin) {
            this.setLoginMode()
        } else {
            this.setRegisterMode()
        }
    }

    private setLoginMode(): void {
        if (this.title) this.title.textContent = "Login"
        if (this.submitButton) this.submitButton.textContent = "Login"
        if (this.toggleText && this.toggleText.firstChild) {
            this.toggleText.firstChild.textContent = "Don't have an account? "
        }
        if (this.toggleLink) this.toggleLink.textContent = "Register"
    }

    private setRegisterMode(): void {
        if (this.title) this.title.textContent = "Register"
        if (this.submitButton) this.submitButton.textContent = "Register"
        if (this.toggleText && this.toggleText.firstChild) {
            this.toggleText.firstChild.textContent = "Already have an account? "
        }
        if (this.toggleLink) this.toggleLink.textContent = "Login"
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault()
        event.stopPropagation()
        if (!this.form) return

        this.clearMessage()
        this.setFormLoading(true)
        
        try {
            const formData = new FormData(this.form)
            const username = formData.get("username") as string
            const password = formData.get("password") as string

            if (!username || !username.trim()) {
                this.showMessage("Please enter your username", "error")
                this.form.username.focus()
                return
            }

            if (!password || !password.trim()) {
                this.showMessage("Please enter your password", "error")
                this.form.password.focus()
                return
            }

            const credentials: LoginCredentials = {
                username: username.trim(),
                password: password.trim()
            }

            if (this.isLogin) {
                await this.handleLogin(credentials)
            } else {
                await this.handleRegister(credentials)
            }
        } catch (error) {
            this.showMessage(error instanceof Error ? error.message : "Operation failed", "error")
        } finally {
            this.setFormLoading(false)
        }
    }

    private async handleLogin(credentials: LoginCredentials): Promise<void> {
        const success = await this.authService.login(credentials)
        if (success) {
            window.location.href = "/public/chat.html"
        } else {
            throw new Error("Login failed")
        }
    }

    private async handleRegister(credentials: RegisterCredentials): Promise<void> {
        const success = await this.authService.register(credentials)
        if (success) {
            this.showMessage("Registration successful! You can now login.", "success")
            this.isLogin = true
            this.setLoginMode()
            if (this.form) {
                this.form.reset()
            }
        }
    }

    private async checkExistingAuth(): Promise<void> {
        try {
            const response = await fetch("/api/1/users/", {
                method: "GET",
                credentials: "include",
            })
            if (response.status !== 401) {
                window.location.href = "/public/chat.html"
            }
        } catch {
        }
    }

    private showMessage(message: string, type: "error" | "success" = "error"): void {
        if (!this.messageBox) return
        
        this.messageBox.style.display = "block"
        this.messageBox.textContent = message

        if (type === "error") {
            this.messageBox.style.color = "#fff"
            this.messageBox.style.background = "#d9534f"
        } else {
            this.messageBox.style.color = "#fff"
            this.messageBox.style.background = "#5cb85c"
        }

        this.messageBox.style.padding = "10px"
        this.messageBox.style.borderRadius = "5px"
        this.messageBox.style.marginTop = "10px"
    }

    private clearMessage(): void {
        if (this.messageBox) {
            this.messageBox.style.display = "none"
            this.messageBox.textContent = ""
        }
    }

    private setFormLoading(isLoading: boolean): void {
        if (!this.submitButton) return

        if (isLoading) {
            this.submitButton.disabled = true
            const originalText = this.submitButton.textContent
            this.submitButton.dataset.originalText = originalText || ""
            this.submitButton.textContent = this.isLogin ? "Logging in..." : "Registering..."
        } else {
            this.submitButton.disabled = false
            const originalText = this.submitButton.dataset.originalText
            this.submitButton.textContent = originalText || (this.isLogin ? "Login" : "Register")
            delete this.submitButton.dataset.originalText
        }
    }
}