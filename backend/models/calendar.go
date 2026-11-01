package models

type HolidayType string

const (
	HolidayNasional    HolidayType = "nasional"
	HolidayCutiBersama HolidayType = "cuti_bersama"
	HolidayHariBesar   HolidayType = "hari_besar"
)

type Holiday struct {
	Date        string      `json:"date"` // YYYY-MM-DD
	Name        string      `json:"name"`
	Type        HolidayType `json:"type"`
	HijriahDate string      `json:"hijriah_date,omitempty"`
}

type CalendarDayInfo struct {
	Date           string     `json:"date"`
	DayOfWeek      string     `json:"day_of_week"`
	IsWeekend      bool       `json:"is_weekend"`
	IsHoliday      bool       `json:"is_holiday"`
	Holidays       []Holiday  `json:"holidays,omitempty"`
	HijriahDate    string     `json:"hijriah_date,omitempty"`
	PancasilaSaka  string     `json:"saka_info,omitempty"`
}
