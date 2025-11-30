package config

import (
	"log"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

type ChatConfig struct {
	Port string `yaml:"port"`
}

type JWTConfig struct {
	Secret            string        `yaml:"secret"`
	AccessTokenTTL    time.Duration `yaml:"-"`
	RefreshTokenTTL   time.Duration `yaml:"-"`
	RawAccessTokenTTL string        `yaml:"access_token_ttl"`
	RawRefreshTokenTTL string       `yaml:"refresh_token_ttl"`
}

type ServerConfig struct {
	Port            string        `yaml:"port"`
	ShutdownTimeout time.Duration `yaml:"shutdown_timeout"`
}

type Config struct {
	Chat   ChatConfig   `yaml:"chat"`
	JWT    JWTConfig    `yaml:"jwt"`
	Server ServerConfig `yaml:"server"`
	PostgresDSN string `yaml:"-"`
}

func LoadConfig(path string) *Config {
	f, err := os.ReadFile(path)
	if err != nil {
		log.Fatalf("Failed to read config file: %v", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(f, &cfg); err != nil {
		log.Fatalf("Failed to parse YAML config: %v", err)
	}

	// Парсим TTL токенов
	accessTTL, err := time.ParseDuration(cfg.JWT.RawAccessTokenTTL)
	if err != nil {
		log.Printf("Invalid access_token_ttl, using default 15m")
		accessTTL = 15 * time.Minute
	}
	cfg.JWT.AccessTokenTTL = accessTTL

	refreshTTL, err := time.ParseDuration(cfg.JWT.RawRefreshTokenTTL)
	if err != nil {
		log.Printf("Invalid refresh_token_ttl, using default 24h")
		refreshTTL = 24 * time.Hour
	}
	cfg.JWT.RefreshTokenTTL = refreshTTL

	// Порт сервера
	if envPort := os.Getenv("SERVER_PORT"); envPort != "" {
		cfg.Server.Port = envPort
	} else if cfg.Server.Port == "" {
		cfg.Server.Port = cfg.Chat.Port
	}

	// Shutdown timeout
	if envTimeout := os.Getenv("SHUTDOWN_TIMEOUT"); envTimeout != "" {
		if t, err := time.ParseDuration(envTimeout); err == nil {
			cfg.Server.ShutdownTimeout = t
		} else {
			log.Printf("Invalid SHUTDOWN_TIMEOUT, using default 5s")
			cfg.Server.ShutdownTimeout = 5 * time.Second
		}
	} else if cfg.Server.ShutdownTimeout == 0 {
		cfg.Server.ShutdownTimeout = 5 * time.Second
	}

	// DSN PostgreSQL
	if dsn := os.Getenv("POSTGRES_DSN"); dsn != "" {
		cfg.PostgresDSN = dsn
	} else {
		log.Fatal("POSTGRES_DSN env variable is required")
	}

	log.Printf("Config loaded: server_port=%s, access_token_ttl=%v, refresh_token_ttl=%v\n",
		cfg.Server.Port, cfg.JWT.AccessTokenTTL, cfg.JWT.RefreshTokenTTL)

	return &cfg
}
