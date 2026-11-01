package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"leviosa-backend/config"
	"leviosa-backend/models"
)

type AIService struct {
	geminiKey string
	calendar  *CalendarService
	weather   *WeatherService
	client    *http.Client
}

func NewAIService(cfg *config.Config, cal *CalendarService, w *WeatherService) *AIService {
	return &AIService{
		geminiKey: cfg.GeminiAPIKey,
		calendar:  cal,
		weather:   w,
		client:    &http.Client{Timeout: 20 * time.Second},
	}
}

// ProcessChat handles natural language requests and proactively checks schedules against weather/holidays
func (ai *AIService) ProcessChat(req *models.AIChatRequest) *models.AIChatResponse {
	msg := strings.ToLower(strings.TrimSpace(req.Message))

	// 1. Proactive Weather & Schedule Conflict Check
	if proposal := ai.checkScheduleWeatherConflict(req.CurrentSchedules, req.UserCity); proposal != nil {
		return &models.AIChatResponse{
			Reply:       "Saya menemukan potensi kendala pada jadwal Anda dan menyiapkan rekomendasi penyesuaian:",
			Proposal:    proposal,
			ActionType:  "propose_reschedule",
		}
	}

	// 2. Schedule Planning Request (e.g., "besok saya ingin...")
	if strings.Contains(msg, "besok") && (strings.Contains(msg, "jam") || strings.Contains(msg, "jadwal")) {
		return ai.handlePlanningRequest(req)
	}

	// 3. Query Activity / "Apa kegiatan saya hari ini?"
	if strings.Contains(msg, "hari ini") || strings.Contains(msg, "kegiatan") || strings.Contains(msg, "jadwal saya") {
		return ai.handleQueryToday(req)
	}

	// 4. Productivity Evaluation Request
	if strings.Contains(msg, "evaluasi") || strings.Contains(msg, "produktivitas") {
		return &models.AIChatResponse{
			Reply: "Untuk melihat analisis produktivitas lengkap, Anda dapat membuka tab **Evaluasi & Analitik**. Apakah Anda ingin saya mengevaluasi ringkasan mingguan atau bulanan?",
			ActionType: "evaluate",
		}
	}

	// 5. Try calling Gemini API if key is present
	if ai.geminiKey != "" {
		if geminiReply, err := ai.callGemini(req); err == nil && geminiReply != "" {
			return &models.AIChatResponse{
				Reply:      geminiReply,
				ActionType: "answer",
			}
		}
	}

	// 6. Intelligent Fallback Assistant
	return &models.AIChatResponse{
		Reply: "Halo! Saya Asisten Pribadi Leviosa Anda. Saya siap membantu menyusun jadwal optimal, memeriksa prakiraan cuaca, hari libur nasional Indonesia, serta menyiapkan pengingat WhatsApp via Sidobe. Ada agenda yang ingin diatur hari ini?",
		ActionType: "answer",
	}
}

func (ai *AIService) checkScheduleWeatherConflict(schedules []models.ScheduleItem, city string) *models.AIRescheduleProposal {
	wData, err := ai.weather.GetWeather(0, 0, city)
	if err != nil || wData == nil {
		return nil
	}

	for _, item := range schedules {
		// Detect outdoor activities
		isOutdoor := item.IsOutdoor ||
			strings.Contains(strings.ToLower(item.Title), "olahraga") ||
			strings.Contains(strings.ToLower(item.Title), "jogging") ||
			strings.Contains(strings.ToLower(item.Title), "sepeda") ||
			strings.Contains(strings.ToLower(item.Location), "lapangan") ||
			strings.Contains(strings.ToLower(item.Location), "outdoor")

		if isOutdoor && wData.RainProbability >= 60 {
			alt := item
			alt.Location = "Pusat Kebugaran / Indoor"

			proposed := item
			proposed.StartTime = "07:00"
			proposed.EndTime = "08:00"

			return &models.AIRescheduleProposal{
				NeedConfirmation: true,
				Reason:           fmt.Sprintf("Prediksi cuaca menunjukkan potensi hujan tinggi (%d%%) pada jadwal kegiatan outdoor Anda.", wData.RainProbability),
				ConflictType:     "weather_conflict",
				OriginalItem:     item,
				ProposedItem:     proposed,
				AlternativeItem:  &alt,
				Explanation:      "Jadwal olahraga/outdoor Anda berpotensi terganggu hujan di sore hari. Rekomendasi: Pindahkan ke pukul 07.00 pagi atau alihkan ke opsi indoor.",
			}
		}
	}
	return nil
}

func (ai *AIService) handlePlanningRequest(req *models.AIChatRequest) *models.AIChatResponse {
	tomorrow := time.Now().Add(24 * time.Hour)
	tomorrowStr := tomorrow.Format("2006-01-02")
	dayInfo := ai.calendar.GetDayInfo(tomorrow)

	holidayNote := ""
	if dayInfo.IsHoliday && len(dayInfo.Holidays) > 0 {
		holidayNote = fmt.Sprintf(" (Catatan: Besok adalah hari libur '%s').", dayInfo.Holidays[0].Name)
	}

	suggestions := []models.ScheduleItem{
		{Title: "Fokus Pengerjaan Laporan", Date: tomorrowStr, StartTime: "08:30", EndTime: "11:30", Category: "Pekerjaan", Priority: "tinggi"},
		{Title: "Istirahat & Makan Siang", Date: tomorrowStr, StartTime: "12:00", EndTime: "13:00", Category: "Pribadi", Priority: "rendah"},
		{Title: "Belajar & Riset Pemrograman", Date: tomorrowStr, StartTime: "13:30", EndTime: "15:30", Category: "Belajar", Priority: "sedang"},
		{Title: "Olahraga & Peregangan", Date: tomorrowStr, StartTime: "16:30", EndTime: "17:30", Category: "Kesehatan", Priority: "sedang", IsOutdoor: true},
	}

	reply := fmt.Sprintf("Baik! Saya telah menyusun draf jadwal untuk besok (%s)%s dengan mempertimbangkan jeda istirahat (buffer time) 30 menit agar Anda tetap berenergi dan fokus. Silakan tinjau dan konfirmasi jadwal di bawah ini:", tomorrowStr, holidayNote)

	return &models.AIChatResponse{
		Reply:       reply,
		Suggestions: suggestions,
		ActionType:  "suggest_schedule",
	}
}

func (ai *AIService) handleQueryToday(req *models.AIChatRequest) *models.AIChatResponse {
	if len(req.CurrentSchedules) == 0 {
		return &models.AIChatResponse{
			Reply: "Hari ini belum ada jadwal yang terdaftar. Anda bisa menambahkan aktivitas baru atau meminta saya membuatkan time blocking produktif!",
			ActionType: "answer",
		}
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Hari ini terdapat %d aktivitas terencana:\n\n", len(req.CurrentSchedules)))
	for i, s := range req.CurrentSchedules {
		sb.WriteString(fmt.Sprintf("%d. %s – %s: **%s** (%s)\n", i+1, s.StartTime, s.EndTime, s.Title, s.Category))
	}
	sb.WriteString("\nPastikan menyediakan jeda istirahat yang cukup sebelum kegiatan penting berikutnya.")

	return &models.AIChatResponse{
		Reply: sb.String(),
		ActionType: "answer",
	}
}

func (ai *AIService) EvaluateProductivity(req *models.ProductivityEvaluationRequest) *models.ProductivityEvaluationResponse {
	rate := 0
	total := req.CompletedTasks + req.PendingTasks
	if total > 0 {
		rate = (req.CompletedTasks * 100) / total
	}

	summary := fmt.Sprintf("Penyelesaian tugas mencapai %d%% (%d dari %d tugas)", rate, req.CompletedTasks, total)
	hoursStr := fmt.Sprintf("%.1f Jam Produktif", req.TotalHours)

	strengths := []string{
		"Konsistensi menjalankan time blocking harian tergolong baik.",
		"Disiplin dalam menyelesaikan tugas prioritas tinggi.",
	}
	improvements := []string{
		"Perhatikan tugas yang tertunda pada malam hari.",
		"Sediakan buffer time 15–30 menit setelah meeting intensif.",
	}

	advice := "Pertahankan momentum produktivitas Anda. Kunci efisiensi bukanlah bekerja terus-menerus tanpa henti, melainkan mengelola fokus dan energi pada jam-jam puncak (peak performance time)."

	return &models.ProductivityEvaluationResponse{
		ScoreSummary:     summary,
		ProductiveHours:  hoursStr,
		ConsistencyScore: req.Consistency,
		KeyStrengths:     strengths,
		AreasToImprove:   improvements,
		AIRecommendation: advice,
		GeneratedAt:      time.Now(),
	}
}

func (ai *AIService) callGemini(req *models.AIChatRequest) (string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%s", ai.geminiKey)
	prompt := fmt.Sprintf("Anda adalah Leviosa, AI Personal Assistant untuk produktivitas cerdas di Indonesia. Jawab pengguna dengan ramah, proaktif, dan gunakan Bahasa Indonesia yang baik.\nPesan pengguna: %s", req.Message)

	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]string{
					{"text": prompt},
				},
			},
		},
	}

	bytesPayload, _ := json.Marshal(payload)
	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(bytesPayload))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := ai.client.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini status %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var result struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(body, &result); err == nil && len(result.Candidates) > 0 && len(result.Candidates[0].Content.Parts) > 0 {
		return result.Candidates[0].Content.Parts[0].Text, nil
	}

	return "", fmt.Errorf("invalid response from gemini")
}
