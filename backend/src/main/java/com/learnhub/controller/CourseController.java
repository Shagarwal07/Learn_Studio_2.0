package com.learnhub.controller;

import com.learnhub.dto.ApiResponse;
import com.learnhub.dto.CourseDTO;
import com.learnhub.dto.ReviewDTO;
import com.learnhub.entity.Course;
import com.learnhub.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    // Public - anyone can browse courses with pagination, search, and filtering
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CourseDTO>>> getAllCourses(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Course.Level level,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
            
        Sort sort = sortDir.equalsIgnoreCase("desc") 
                ? Sort.by(sortBy).descending() 
                : Sort.by(sortBy).ascending();
                
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CourseDTO> courses = courseService.getCourses(search, level, pageable);
        return ResponseEntity.ok(ApiResponse.success(courses, "Courses retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseDTO>> getCourse(@PathVariable Long id) {
        CourseDTO course = courseService.getCourseById(id);
        return ResponseEntity.ok(ApiResponse.success(course, "Course retrieved successfully"));
    }

    // Protected - only INSTRUCTOR or ADMIN
    @PostMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<CourseDTO>> createCourse(@Valid @RequestBody CourseDTO dto,
                                                   Principal principal) {
        CourseDTO course = courseService.createCourse(dto, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(course, "Course created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<CourseDTO>> updateCourse(@PathVariable Long id,
                                                   @Valid @RequestBody CourseDTO dto) {
        CourseDTO course = courseService.updateCourse(id, dto);
        return ResponseEntity.ok(ApiResponse.success(course, "Course updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Course deleted successfully"));
    }

    // Reviews endpoints
    @GetMapping("/{id}/reviews")
    public ResponseEntity<ApiResponse<List<ReviewDTO>>> getReviews(@PathVariable Long id) {
        List<ReviewDTO> reviews = courseService.getCourseReviews(id);
        return ResponseEntity.ok(ApiResponse.success(reviews, "Course reviews retrieved successfully"));
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<ApiResponse<ReviewDTO>> addReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewDTO dto,
            Principal principal) {
        ReviewDTO review = courseService.addReview(principal.getName(), id, dto);
        return ResponseEntity.ok(ApiResponse.success(review, "Review added successfully"));
    }
}
