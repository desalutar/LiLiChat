package utils

import (
	"log"
	"runtime"
	"time"
)

const (
	ERROR 	= "ERROR"
	INFO 	= "INFO"
	WARM 	= "WARM"
)

type Logger interface {
	Info(msg string)
	Warn(msg string)
	Error(msg string)
}

type Log struct {
	out *log.Logger
}

func NewLogger(log *log.Logger) *Log {
	return &Log{out: log}
}

func (l *Log) log(level, msg string) {
	_, file, line, ok := runtime.Caller(2)
	if !ok {
		file = "???"
		line = 0
	}
	timestamp := time.Now().Format(time.UnixDate)
	l.out.Printf("[%s] [%s] %s:%d %s\n", timestamp, level, file, line, msg)
}

func (l *Log) Info(msg string) {
	l.log(INFO, msg)
}

func (l *Log) Warn(msg string) {
	l.log(WARM, msg)
}

func (l *Log) Error(msg string) {
	l.log(ERROR, msg)
}