import { ApiClient } from "../shared/api.js"
import {
    LoginCredentials,
    RegisterCredentials, 
    LoginResponse,
    RegisterResponse     
} from "./types"

import { ApiResponse } from "../shared/types.js"

export class AuthService {
    private api: ApiClient
    private currentUserId: string | null = null

    constructor() {
        this.api = new ApiClient()
    }

    async login(credintials: LoginCredentials): Promise<boolean> {
        const response: ApiResponse<LoginResponse> = await this.api.post<LoginResponse>("/auth/login", credintials)
    
        console.log("Login response:", response)
        
        if(response.data && (response.status === 200 || response.status === 201)) {
            const userId = response.data.user_id
            if (userId !== undefined && userId !== null) {
                this.currentUserId = String(userId)
                console.log("Login successful, userID:", this.currentUserId)
                return true
            } else {
                console.error("Login response missing user_id:", response.data)
                throw new Error("Server response missing user_id")
            }
        }

        const errorMsg = response.error || `Login failed (status: ${response.status})`
        console.error("Login failed:", errorMsg, response)
        throw new Error(errorMsg)
    }

    async register(credintials: RegisterCredentials): Promise<boolean> {
        const response: ApiResponse<RegisterResponse> = await this.api.post<RegisterResponse>("/auth/register", credintials)
        
        if (response.data && response.status === 201) {
            console.log("User registered successfully:", response.data.user_id)
            return true
        }
        throw new Error(response.error || "Registration failed")
    }

    async logout(): Promise<void> {
        try {
            await this.api.post("/auth/logout", {})
        } catch (error) {
            console.error("Logout error:", error)
        }
        this.currentUserId = null
    }

    isAuthenticated(): boolean {
        return this.currentUserId !== null
    }

    getUserID(): string | null {
        return this.currentUserId
    }
}