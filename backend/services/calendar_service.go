package services

import (
	"strings"
	"time"

	"leviosa-backend/models"
)

type CalendarService struct {
	holidays []models.Holiday
}

func NewCalendarService() *CalendarService {
	return &CalendarService{
		holidays: indonesianHolidays,
	}
}

func (c *CalendarService) GetHolidays(year int) []models.Holiday {
	if year == 0 {
		year = time.Now().Year()
	}
	prefix := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC).Format("2006")
	var result []models.Holiday
	for _, h := range c.holidays {
		if strings.HasPrefix(h.Date, prefix) {
			result = append(result, h)
		}
	}
	return result
}

func (c *CalendarService) GetDayInfo(targetDate time.Time) models.CalendarDayInfo {
	dateStr := targetDate.Format("2006-01-02")
	dayName := targetDate.Weekday().String()

	dayMap := map[string]string{
		"Sunday": "Minggu", "Monday": "Senin", "Tuesday": "Selasa",
		"Wednesday": "Rabu", "Thursday": "Kamis", "Friday": "Jumat", "Saturday": "Sabtu",
	}

	info := models.CalendarDayInfo{
		Date:      dateStr,
		DayOfWeek: dayMap[dayName],
		IsWeekend: targetDate.Weekday() == time.Saturday || targetDate.Weekday() == time.Sunday,
		IsHoliday: false,
		Holidays:  []models.Holiday{},
	}

	for _, h := range c.holidays {
		if h.Date == dateStr {
			info.Holidays = append(info.Holidays, h)
			if h.Type == models.HolidayNasional || h.Type == models.HolidayCutiBersama {
				info.IsHoliday = true
			}
			if h.HijriahDate != "" {
				info.HijriahDate = h.HijriahDate
			}
		}
	}

	return info
}

var indonesianHolidays = []models.Holiday{
	// 2026
	{Date: "2026-01-01", Name: "Tahun Baru 2026 Masehi", Type: models.HolidayNasional, HijriahDate: "12 Rajab 1447 H"},
	{Date: "2026-01-16", Name: "Isra Mi'raj Nabi Muhammad SAW", Type: models.HolidayNasional, HijriahDate: "27 Rajab 1447 H"},
	{Date: "2026-02-17", Name: "Tahun Baru Imlek 2577 Kongzili", Type: models.HolidayNasional},
	{Date: "2026-03-20", Name: "Hari Suci Nyepi (Tahun Baru Saka 1948)", Type: models.HolidayNasional},
	{Date: "2026-03-21", Name: "Hari Raya Idul Fitri 1447 H (Hari ke-1)", Type: models.HolidayNasional, HijriahDate: "1 Syawal 1447 H"},
	{Date: "2026-03-22", Name: "Hari Raya Idul Fitri 1447 H (Hari ke-2)", Type: models.HolidayNasional, HijriahDate: "2 Syawal 1447 H"},
	{Date: "2026-03-23", Name: "Cuti Bersama Idul Fitri 1447 H", Type: models.HolidayCutiBersama, HijriahDate: "3 Syawal 1447 H"},
	{Date: "2026-03-24", Name: "Cuti Bersama Idul Fitri 1447 H", Type: models.HolidayCutiBersama, HijriahDate: "4 Syawal 1447 H"},
	{Date: "2026-04-03", Name: "Wafat Yesus Kristus (Jumat Agung)", Type: models.HolidayNasional},
	{Date: "2026-04-05", Name: "Hari Kebangkitan Yesus Kristus (Paskah)", Type: models.HolidayHariBesar},
	{Date: "2026-05-01", Name: "Hari Buruh Internasional", Type: models.HolidayNasional},
	{Date: "2026-05-14", Name: "Kenaikan Yesus Kristus", Type: models.HolidayNasional},
	{Date: "2026-05-27", Name: "Hari Raya Idul Adha 1447 H", Type: models.HolidayNasional, HijriahDate: "10 Dzulhijjah 1447 H"},
	{Date: "2026-05-28", Name: "Cuti Bersama Hari Raya Idul Adha 1447 H", Type: models.HolidayCutiBersama, HijriahDate: "11 Dzulhijjah 1447 H"},
	{Date: "2026-05-31", Name: "Hari Raya Waisak 2570 BE", Type: models.HolidayNasional},
	{Date: "2026-06-01", Name: "Hari Lahir Pancasila", Type: models.HolidayNasional},
	{Date: "2026-06-16", Name: "Tahun Baru Islam 1448 H (1 Muharram)", Type: models.HolidayNasional, HijriahDate: "1 Muharram 1448 H"},
	{Date: "2026-08-17", Name: "Hari Kemerdekaan Republik Indonesia (HUT RI ke-81)", Type: models.HolidayNasional},
	{Date: "2026-08-25", Name: "Maulid Nabi Muhammad SAW", Type: models.HolidayNasional, HijriahDate: "12 Rabiul Awal 1448 H"},
	{Date: "2026-10-28", Name: "Hari Sumpah Pemuda", Type: models.HolidayHariBesar},
	{Date: "2026-11-10", Name: "Hari Pahlawan", Type: models.HolidayHariBesar},
	{Date: "2026-12-25", Name: "Kelahiran Yesus Kristus (Hari Raya Natal)", Type: models.HolidayNasional},
	{Date: "2026-12-26", Name: "Cuti Bersama Hari Raya Natal", Type: models.HolidayCutiBersama},

	// 2027
	{Date: "2027-01-01", Name: "Tahun Baru 2027 Masehi", Type: models.HolidayNasional},
	{Date: "2027-01-06", Name: "Isra Mi'raj Nabi Muhammad SAW", Type: models.HolidayNasional},
	{Date: "2027-02-06", Name: "Tahun Baru Imlek 2578 Kongzili", Type: models.HolidayNasional},
	{Date: "2027-03-09", Name: "Hari Suci Nyepi (Tahun Baru Saka 1949)", Type: models.HolidayNasional},
	{Date: "2027-03-11", Name: "Hari Raya Idul Fitri 1448 H (Hari ke-1)", Type: models.HolidayNasional},
	{Date: "2027-03-12", Name: "Hari Raya Idul Fitri 1448 H (Hari ke-2)", Type: models.HolidayNasional},
	{Date: "2027-03-26", Name: "Wafat Yesus Kristus", Type: models.HolidayNasional},
	{Date: "2027-05-01", Name: "Hari Buruh Internasional", Type: models.HolidayNasional},
	{Date: "2027-05-06", Name: "Kenaikan Yesus Kristus", Type: models.HolidayNasional},
	{Date: "2027-05-16", Name: "Hari Raya Idul Adha 1448 H", Type: models.HolidayNasional},
	{Date: "2027-05-20", Name: "Hari Raya Waisak 2571 BE", Type: models.HolidayNasional},
	{Date: "2027-06-01", Name: "Hari Lahir Pancasila", Type: models.HolidayNasional},
	{Date: "2027-06-06", Name: "Tahun Baru Islam 1449 H", Type: models.HolidayNasional},
	{Date: "2027-08-17", Name: "Hari Kemerdekaan RI ke-82", Type: models.HolidayNasional},
	{Date: "2027-12-25", Name: "Hari Raya Natal", Type: models.HolidayNasional},
}
