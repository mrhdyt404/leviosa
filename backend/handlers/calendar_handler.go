package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"leviosa-backend/services"
)

type CalendarHandler struct {
	cal *services.CalendarService
}

func NewCalendarHandler(cal *services.CalendarService) *CalendarHandler {
	return &CalendarHandler{cal: cal}
}

// GetHolidays returns all holidays for given year (default current year)
func (h *CalendarHandler) GetHolidays(w http.ResponseWriter, r *http.Request) {
	yearStr := r.URL.Query().Get("year")
	year := time.Now().Year()
	if yearStr != "" {
		if y, err := strconv.Atoi(yearStr); err == nil {
			year = y
		}
	}

	holidays := h.cal.GetHolidays(year)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"year":     year,
		"count":    len(holidays),
		"holidays": holidays,
	})
}

// GetTodayInfo returns real-time info about today (day, holiday status, Hijriah)
func (h *CalendarHandler) GetTodayInfo(w http.ResponseWriter, r *http.Request) {
	dateParam := r.URL.Query().Get("date")
	target := time.Now()

	if dateParam != "" {
		if t, err := time.Parse("2006-01-02", dateParam); err == nil {
			target = t
		}
	}

	info := h.cal.GetDayInfo(target)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    info,
	})
}
