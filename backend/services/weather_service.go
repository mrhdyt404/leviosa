package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"leviosa-backend/models"
)

type WeatherService struct {
	client *http.Client
}

func NewWeatherService() *WeatherService {
	return &WeatherService{
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

type openMeteoResponse struct {
	CurrentWeather struct {
		Temperature float64 `json:"temperature"`
		WindSpeed   float64 `json:"windspeed"`
		WeatherCode int     `json:"weathercode"`
		Time        string  `json:"time"`
	} `json:"current_weather"`
	Hourly struct {
		Time               []string  `json:"time"`
		Temperature2m      []float64 `json:"temperature_2m"`
		PrecipitationProb  []int     `json:"precipitation_probability"`
		WeatherCode        []int     `json:"weathercode"`
	} `json:"hourly"`
	Daily struct {
		Time               []string  `json:"time"`
		Temperature2mMax   []float64 `json:"temperature_2m_max"`
		Temperature2mMin   []float64 `json:"temperature_2m_min"`
		PrecipitationProb  []int     `json:"precipitation_probability_max"`
		WeatherCode        []int     `json:"weathercode"`
	} `json:"daily"`
}

// GetWeather fetches current weather and forecast for given lat/lon (defaults to Jakarta if zero)
func (w *WeatherService) GetWeather(lat, lon float64, city string) (*models.WeatherData, error) {
	if lat == 0 && lon == 0 {
		// Default to Jakarta, Indonesia
		lat = -6.2088
		lon = 106.8456
		if city == "" {
			city = "Jakarta"
		}
	}

	url := fmt.Sprintf(
		"https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=Asia%%2FJakarta",
		lat, lon,
	)

	resp, err := w.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("weather API error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("weather API returned status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var om openMeteoResponse
	if err := json.Unmarshal(body, &om); err != nil {
		return nil, fmt.Errorf("failed to parse weather JSON: %w", err)
	}

	weather := &models.WeatherData{
		City:            city,
		Latitude:        lat,
		Longitude:       lon,
		CurrentTemp:     om.CurrentWeather.Temperature,
		WindSpeed:       om.CurrentWeather.WindSpeed,
		WeatherCode:     om.CurrentWeather.WeatherCode,
		Condition:       weatherCodeToCondition(om.CurrentWeather.WeatherCode),
		RainProbability: 0,
		Hourly:          make([]models.HourlyForecast, 0),
		Daily:           make([]models.DailyForecast, 0),
		FetchedAt:       time.Now(),
	}

	// Populate hourly forecasts (next 12 hours)
	for i := 0; i < len(om.Hourly.Time) && i < 12; i++ {
		rainProb := 0
		if i < len(om.Hourly.PrecipitationProb) {
			rainProb = om.Hourly.PrecipitationProb[i]
		}
		weather.Hourly = append(weather.Hourly, models.HourlyForecast{
			Time:            om.Hourly.Time[i],
			Temp:            om.Hourly.Temperature2m[i],
			RainProbability: rainProb,
			Condition:       weatherCodeToCondition(om.Hourly.WeatherCode[i]),
		})
	}
	if len(weather.Hourly) > 0 {
		weather.RainProbability = weather.Hourly[0].RainProbability
	}

	// Populate daily forecasts (next 7 days)
	for i := 0; i < len(om.Daily.Time) && i < 7; i++ {
		rainProb := 0
		if i < len(om.Daily.PrecipitationProb) {
			rainProb = om.Daily.PrecipitationProb[i]
		}
		weather.Daily = append(weather.Daily, models.DailyForecast{
			Date:            om.Daily.Time[i],
			MaxTemp:         om.Daily.Temperature2mMax[i],
			MinTemp:         om.Daily.Temperature2mMin[i],
			RainProbability: rainProb,
			Condition:       weatherCodeToCondition(om.Daily.WeatherCode[i]),
		})
	}

	return weather, nil
}

func weatherCodeToCondition(code int) string {
	switch {
	case code == 0:
		return "Cerah"
	case code >= 1 && code <= 3:
		return "Cerah Berawan"
	case code == 45 || code == 48:
		return "Berkabut"
	case code >= 51 && code <= 55:
		return "Gerimis Ringan"
	case code >= 61 && code <= 65:
		return "Hujan"
	case code >= 71 && code <= 77:
		return "Hujan Es / Salju"
	case code >= 80 && code <= 82:
		return "Hujan Lebat"
	case code >= 95 && code <= 99:
		return "Badai Petir"
	default:
		return "Berawan"
	}
}
