package logger

import (
	"fmt"
	"log"
	"os"
	"time"
)

type Level int

const (
	DEBUG Level = iota
	INFO
	WARN
	ERROR
)

var (
	logger       *log.Logger
	currentLevel = INFO
	logFile      *os.File
)

func Init(level string, logPath string) {
	// Set log level
	switch level {
	case "debug":
		currentLevel = DEBUG
	case "info":
		currentLevel = INFO
	case "warn":
		currentLevel = WARN
	case "error":
		currentLevel = ERROR
	}

	// Setup file output if path provided
	if logPath != "" {
		var err error
		logFile, err = os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			log.Printf("Warning: could not open log file: %v", err)
		}
	}

	// Create logger with timestamp
	logger = log.New(os.Stdout, "", 0)
	if logFile != nil {
		logger.SetOutput(os.Stdout)
	}
}

func SetLevel(level string) {
	switch level {
	case "debug":
		currentLevel = DEBUG
	case "info":
		currentLevel = INFO
	case "warn":
		currentLevel = WARN
	case "error":
		currentLevel = ERROR
	}
}

func formatMessage(level string, format string, args ...interface{}) string {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	message := fmt.Sprintf(format, args...)
	return fmt.Sprintf("[%s] [%s] %s", timestamp, level, message)
}

func Debug(format string, args ...interface{}) {
	if currentLevel <= DEBUG {
		logger.Println(formatMessage("DEBUG", format, args...))
	}
}

func Info(format string, args ...interface{}) {
	if currentLevel <= INFO {
		logger.Println(formatMessage("INFO", format, args...))
	}
}

func Warn(format string, args ...interface{}) {
	if currentLevel <= WARN {
		logger.Println(formatMessage("WARN", format, args...))
	}
}

func Error(format string, args ...interface{}) {
	if currentLevel <= ERROR {
		logger.Println(formatMessage("ERROR", format, args...))
	}
}

// Close closes the log file if open
func Close() {
	if logFile != nil {
		logFile.Close()
	}
}
