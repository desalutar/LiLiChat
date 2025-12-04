package config

import (
	"fmt"
	"log"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

type DatabaseConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	DBName   string `yaml:"dbname"`
	SSLMode  string `yaml:"sslmode"`
}

type JWTConfig struct {
	Secret            string        `yaml:"secret"`
	AccessTokenTTL    time.Duration `yaml:"-"`
	RefreshTokenTTL   time.Duration `yaml:"-"`
	RawAccessTokenTTL string        `yaml:"access_token_ttl"`
	RawRefreshTokenTTL string       `yaml:"refresh_token_ttl"`
}

type ServerConfig struct {
	Port                 string        `yaml:"port"`
	ShutdownTimeout      time.Duration `yaml:"-"`
	RawShutdownTimeout   string        `yaml:"shutdown_timeout"`
}

type FrontendConfig struct {
	Port string `yaml:"port"`
}

type Config struct {
	Database DatabaseConfig `yaml:"database"`
	JWT      JWTConfig      `yaml:"jwt"`
	Server   ServerConfig   `yaml:"server"`
	Frontend FrontendConfig `yaml:"frontend"`
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

	accessTTL, err := time.ParseDuration(cfg.JWT.RawAccessTokenTTL)
	if err != nil {
		accessTTL = 15 * time.Minute
	}
	cfg.JWT.AccessTokenTTL = accessTTL

	refreshTTL, err := time.ParseDuration(cfg.JWT.RawRefreshTokenTTL)
	if err != nil {
		refreshTTL = 24 * time.Hour
	}
	cfg.JWT.RefreshTokenTTL = refreshTTL

	shutdownTimeout, err := time.ParseDuration(cfg.Server.RawShutdownTimeout)
	if err != nil {
		cfg.Server.ShutdownTimeout = 5 * time.Second
	} else {
		cfg.Server.ShutdownTimeout = shutdownTimeout
	}

	cfg.PostgresDSN = fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.DBName,
		cfg.Database.SSLMode,
	)

	return &cfg
}
