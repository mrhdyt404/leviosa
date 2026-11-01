package models

import "time"

type WeatherData struct {
	City            string              `json:"city"`
	Latitude        float64             `json:"latitude"`
	Longitude       float64             `json:"longitude"`
	CurrentTemp     float64             `json:"current_temp"`
	Humidity        int                 `json:"humidity"`
	WindSpeed       float64             `json:"wind_speed"`
	WeatherCode     int                 `json:"weather_code"`
	Condition       string              `json:"condition"`
	RainProbability int                 `json:"rain_probability"`
	Hourly          []HourlyForecast    `json:"hourly,omitempty"`
	Daily           []DailyForecast     `json:"daily,omitempty"`
	FetchedAt       time.Time           `json:"fetched_at"`
}

type HourlyForecast struct {
	Time            string  `json:"time"`
	Temp            float64 `json:"temp"`
	RainProbability int     `json:"rain_probability"`
	Condition       string  `json:"condition"`
}

type DailyForecast struct {
	Date            string  `json:"date"`
	MaxTemp         float64 `json:"max_temp"`
	MinTemp         float64 `json:"min_temp"`
	RainProbability int     `json:"rain_probability"`
	Condition       string  `json:"condition"`
}

type AIChatRequest struct {
	Message          string      `json:"message"`
	CurrentSchedules []ScheduleItem `json:"current_schedules,omitempty"`
	UserHabits       string      `json:"user_habits,omitempty"`
	UserCity         string      `json:"user_city,omitempty"`
}

type ScheduleItem struct {
	ID        string `json:"id,omitempty"`
	Title     string `json:"title"`
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Category  string `json:"category,omitempty"`
	Location  string `json:"location,omitempty"`
	Priority  string `json:"priority,omitempty"`
	IsOutdoor bool   `json:"is_outdoor,omitempty"`
}

type AIRescheduleProposal struct {
	NeedConfirmation bool          `json:"need_confirmation"`
	Reason           string        `json:"reason"`
	ConflictType     string        `json:"conflict_type"` // weather_conflict, holiday_conflict, time_overlap
	OriginalItem     ScheduleItem  `json:"original_item"`
	ProposedItem     ScheduleItem  `json:"proposed_item"`
	AlternativeItem  *ScheduleItem `json:"alternative_item,omitempty"`
	Explanation      string        `json:"explanation"`
}

type AIChatResponse struct {
	Reply        string                  `json:"reply"`
	Suggestions  []ScheduleItem          `json:"suggestions,omitempty"`
	Proposal     *AIRescheduleProposal   `json:"proposal,omitempty"`
	ActionType   string                  `json:"action_type,omitempty"` // 'answer', 'suggest_schedule', 'propose_reschedule', 'evaluate'
}

type ProductivityEvaluationRequest struct {
	Period          string                 `json:"period"` // weekly, monthly, yearly
	CompletedTasks  int                    `json:"completed_tasks"`
	PendingTasks    int                    `json:"pending_tasks"`
	TotalHours      float64                `json:"total_productive_hours"`
	Consistency     int                    `json:"consistency_score"`
	CategoryMetrics map[string]float64     `json:"category_metrics,omitempty"`
	OverdueTasks    int                    `json:"overdue_tasks"`
	Highlights      []string               `json:"highlights,omitempty"`
}

type ProductivityEvaluationResponse struct {
	ScoreSummary   string   `json:"score_summary"`
	ProductiveHours string  `json:"productive_hours"`
	ConsistencyScore int    `json:"consistency_score"`
	KeyStrengths   []string `json:"key_strengths"`
	AreasToImprove []string `json:"areas_to_improve"`
	AIRecommendation string `json:"ai_recommendation"`
	GeneratedAt    time.Time `json:"generated_at"`
}
