package com.learnhub.controller;

import com.learnhub.dto.ApiResponse;
import com.learnhub.dto.NoteDTO;
import com.learnhub.service.NoteService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    // ── Instructor APIs ─────────────────────────────────

    @PostMapping(value = "/instructor/notes/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<NoteDTO>> uploadNote(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("courseId") Long courseId,
            @RequestParam(value = "lessonId", required = false) Long lessonId,
            @RequestParam("file") MultipartFile file,
            Principal principal) {

        NoteDTO note = noteService.uploadNote(principal.getName(), title, description, courseId, lessonId, file);
        return ResponseEntity.ok(ApiResponse.success(note, "Note uploaded and parsed successfully"));
    }

    @DeleteMapping("/instructor/notes/{noteId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteNote(@PathVariable Long noteId, Principal principal) {
        noteService.deleteNote(principal.getName(), noteId);
        return ResponseEntity.ok(ApiResponse.success(null, "Note deleted successfully"));
    }

    // ── Student APIs ───────────────────────────────────

    @GetMapping("/student/notes/courses")
    @PreAuthorize("hasAnyRole('STUDENT','INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCoursesWithNotes(Principal principal) {
        List<Map<String, Object>> courses = noteService.getCoursesWithNotes(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(courses, "Courses with notes retrieved successfully"));
    }

    @GetMapping("/student/notes/course/{courseId}")
    @PreAuthorize("hasAnyRole('STUDENT','INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<NoteDTO>>> getNotesForCourse(@PathVariable Long courseId, Principal principal) {
        List<NoteDTO> notes = noteService.getNotesForCourse(principal.getName(), courseId);
        return ResponseEntity.ok(ApiResponse.success(notes, "Notes retrieved successfully"));
    }

    @GetMapping("/student/notes/{noteId}")
    @PreAuthorize("hasAnyRole('STUDENT','INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<NoteDTO>> getNote(@PathVariable Long noteId, Principal principal) {
        NoteDTO note = noteService.getNoteById(principal.getName(), noteId);
        return ResponseEntity.ok(ApiResponse.success(note, "Note details retrieved successfully"));
    }

    @GetMapping("/student/notes/{noteId}/secure-view")
    @PreAuthorize("hasAnyRole('STUDENT','INSTRUCTOR','ADMIN')")
    public ResponseEntity<byte[]> secureViewNote(
            @PathVariable Long noteId,
            Principal principal,
            HttpServletRequest request) {

        String ipAddress = request.getRemoteAddr();
        String userAgent = request.getHeader(HttpHeaders.USER_AGENT);

        byte[] pdfBytes = noteService.secureViewNote(principal.getName(), noteId, ipAddress, userAgent);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"note-" + noteId + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @PostMapping("/student/notes/{noteId}/ask-ai")
    @PreAuthorize("hasAnyRole('STUDENT','INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> askAi(
            @PathVariable Long noteId,
            @RequestBody Map<String, String> requestBody,
            Principal principal) {

        String question = requestBody.get("question");
        String selectedText = requestBody.get("selectedText");
        String mode = requestBody.get("mode"); // EXPLAIN, SUMMARY, KEY_POINTS, VIVA

        String answer = noteService.askAiAboutNote(principal.getName(), noteId, question, selectedText, mode);

        return ResponseEntity.ok(ApiResponse.success(
                Map.of("answer", answer, "provider", "Gemini/OpenRouter"),
                "AI response generated successfully"
        ));
    }
}
