package main

import (
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Result struct {
	ID        uint      `gorm:"primaryKey"`
	Name      string    `gorm:"size:50;not null"`
	WPM       int       `gorm:"not null"`
	Accuracy  float64   `gorm:"not null"`
	Lang      string    `gorm:"size:20;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

var DB *gorm.DB

func InitDB() error {
	var err error
	DB, err = gorm.Open(sqlite.Open("typing.db"), &gorm.Config{})
	if err != nil {
		return err
	}

	// Auto migrate the schema
	err = DB.AutoMigrate(&Result{})
	if err != nil {
		return err
	}

	return nil
}

func CreateResult(result *Result) error {
	return DB.Create(result).Error
}

func GetLeaderboard(lang string, limit int) ([]Result, error) {
	var results []Result
	query := DB.Order("wpm DESC").Limit(limit)
	if lang != "" {
		query = query.Where("lang = ?", lang)
	}
	err := query.Find(&results).Error
	return results, err
}
