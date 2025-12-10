export interface ApiResponse<T = any> {
    data?: T
    error?: string
    status: number
}

export interface User {
    id:         number
    username:   string
    email?:     string
}

export interface AuthTokens {
    accessToken:    string
    refreshToken?:  string
    userID:         string
}

