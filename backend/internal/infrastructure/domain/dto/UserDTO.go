package dto

type User struct {
	ID           int64  `json:"id" db:"id"`
	Username     string `json:"username" db:"username"`
	PasswordHash string `json:"password_hash" db:"password_hash"`
	CreatedAt    int64  `json:"created_at" db:"created_at"`
}
