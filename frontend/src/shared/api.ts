import { ApiResponse } from "./types.js"

export class ApiClient {
    private baseURL: string = "/api/1"

    async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // Include cookies in request
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                let errorText = await response.text().catch(() => "Unknown error");
                try {
                    const errorData = JSON.parse(errorText);
                    return {
                        error: errorData.error || errorData.message || errorText,
                        status: response.status,
                    }
                } catch {
                    if (errorText.includes("<!DOCTYPE") || errorText.includes("<html")) {
                        const match = errorText.match(/<p[^>]*>Message: ([^<]+)<\/p>/);
                        if (match) {
                            return {
                                error: match[1],
                                status: response.status,
                            }
                        }
                    }
                    return {
                        error: errorText || `Server error (${response.status})`,
                        status: response.status,
                    }
                }
            }

            let result
            try {
                const text = await response.text()
                if (!text || text.trim() === '') {
                    return {
                        data: {} as T,
                        status: response.status,
                    }
                }
                result = JSON.parse(text)
            } catch (parseError) {
                console.error("Failed to parse JSON response:", parseError)
                return {
                    error: "Invalid JSON response from server",
                    status: response.status,
                }
            }
            
            return {
                data: result,
                status: response.status,
            }
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Unknown error",
                status: 500,
            }
        }
    }

    async get<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
        try {
            const headers: HeadersInit = {
                "Content-Type": "application/json",
            }

            if (token) {
                headers["Authorization"] = `Bearer ${token}`
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: "GET",
                headers,
                credentials: "include", // Include cookies in request
            })

            if (response.status === 401) {
                return {
                    error: "Unauthorized",
                    status: 401,
                }
            }

            const result = await response.json()
            return {
                data:   result,
                status: response.status,
            }
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Unknown error",
                status: 500,
            }
        }
    }
}

