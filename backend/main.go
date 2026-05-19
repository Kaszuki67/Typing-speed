package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

type Snippet struct {
	ID       int    `json:"id"`
	Code     string `json:"code"`
	Language string `json:"language"`
}

type ResultRequest struct {
	Name     string  `json:"name"`
	WPM      int     `json:"wpm"`
	Accuracy float64 `json:"accuracy"`
	Lang     string  `json:"lang"`
}

func loadSnippets(lang string) ([]Snippet, error) {
	fileMap := map[string]string{
		"js":       "javascript.json",
		"python":   "python.json",
		"go":       "go.json",
		"rust":     "rust.json",
	}

	filename, ok := fileMap[lang]
	if !ok {
		return nil, fmt.Errorf("unsupported language: %s", lang)
	}

	// Get the directory of the executable
	execPath, err := os.Executable()
	if err != nil {
		return nil, err
	}
	execDir := filepath.Dir(execPath)

	// Try multiple paths for snippets directory
	possiblePaths := []string{
		filepath.Join(execDir, "snippets", filename),
		filepath.Join("snippets", filename),
		filepath.Join("backend", "snippets", filename),
	}

	var filePath string
	for _, p := range possiblePaths {
		if _, err := os.Stat(p); err == nil {
			filePath = p
			break
		}
	}

	if filePath == "" {
		return nil, fmt.Errorf("snippet file not found: %s", filename)
	}

	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	var snippets []Snippet
	err = json.Unmarshal(data, &snippets)
	if err != nil {
		return nil, err
	}

	return snippets, nil
}

func getRandomSnippet(snippets []Snippet) Snippet {
	if len(snippets) == 0 {
		return Snippet{}
	}
	rand.Seed(time.Now().UnixNano())
	return snippets[rand.Intn(len(snippets))]
}

func setupRouter() *gin.Engine {
	r := gin.Default()

	// Enable CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// GET /api/snippet?lang=js
	r.GET("/api/snippet", func(c *gin.Context) {
		lang := c.Query("lang")
		if lang == "" {
			lang = "js"
		}

		snippets, err := loadSnippets(lang)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		snippet := getRandomSnippet(snippets)
		c.JSON(http.StatusOK, snippet)
	})

	// POST /api/result
	r.POST("/api/result", func(c *gin.Context) {
		var req ResultRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		result := &Result{
			Name:     req.Name,
			WPM:      req.WPM,
			Accuracy: req.Accuracy,
			Lang:     req.Lang,
		}

		if err := CreateResult(result); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// GET /api/leaderboard?lang=js
	r.GET("/api/leaderboard", func(c *gin.Context) {
		lang := c.Query("lang")

		results, err := GetLeaderboard(lang, 20)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, results)
	})

	return r
}

func main() {
	// Initialize database
	if err := InitDB(); err != nil {
		fmt.Printf("Failed to initialize database: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Database initialized successfully")

	// Setup and run router
	r := setupRouter()

	fmt.Println("Server starting on :8080")
	if err := r.Run(":8080"); err != nil {
		fmt.Printf("Failed to start server: %v\n", err)
		os.Exit(1)
	}
}
