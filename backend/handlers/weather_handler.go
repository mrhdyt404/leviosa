package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"leviosa-backend/services"
)

type WeatherHandler struct {
	weather *services.WeatherService
}

func NewWeatherHandler(w *services.WeatherService) *WeatherHandler {
	return &WeatherHandler{weather: w}
}

func (h *WeatherHandler) GetWeather(w http.ResponseWriter, r *http.Request) {
	city := r.URL.Query().Get("city")
	latStr := r.URL.Query().Get("lat")
	lonStr := r.URL.Query().Get("lon")

	var lat, lon float64
	if latStr != "" {
		lat, _ = strconv.ParseFloat(latStr, 64)
	}
	if lonStr != "" {
		lon, _ = strconv.ParseFloat(lonStr, 64)
	}

	data, err := h.weather.GetWeather(lat, lon, city)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    data,
	})
}
