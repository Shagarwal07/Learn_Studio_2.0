package com.learnhub.service;

import com.learnhub.dto.CourseDTO;
import com.learnhub.dto.ReviewDTO;
import com.learnhub.dto.InstructorAnalyticsDTO;
import com.learnhub.entity.Course;
import com.learnhub.entity.Review;
import com.learnhub.entity.User;
import com.learnhub.repository.CourseRepository;
import com.learnhub.repository.ReviewRepository;
import com.learnhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll().stream().map(this::toDTO).toList();
    }

    public Page<CourseDTO> getCourses(String search, Course.Level level, Pageable pageable) {
        Page<Course> coursePage;
        if (search != null && !search.isBlank() && level != null) {
            coursePage = courseRepository.findByTitleContainingIgnoreCaseAndLevel(search, level, pageable);
        } else if (search != null && !search.isBlank()) {
            coursePage = courseRepository.findByTitleContainingIgnoreCase(search, pageable);
        } else if (level != null) {
            coursePage = courseRepository.findByLevel(level, pageable);
        } else {
            coursePage = courseRepository.findAll(pageable);
        }
        return coursePage.map(this::toDTO);
    }

    public CourseDTO getCourseById(Long id) {
        return courseRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Course not found"));
    }

    public List<CourseDTO> searchCourses(String keyword) {
        return courseRepository.searchByTitle(keyword).stream().map(this::toDTO).toList();
    }

    public CourseDTO createCourse(CourseDTO dto, String instructorEmail) {
        var instructor = userRepository.findByEmail(instructorEmail)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));
        Course course = Course.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .thumbnail(dto.getThumbnail())
                .level(dto.getLevel())
                .instructor(instructor)
                .build();
        return toDTO(courseRepository.save(course));
    }

    public CourseDTO updateCourse(Long id, CourseDTO dto) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        course.setTitle(dto.getTitle());
        course.setDescription(dto.getDescription());
        course.setPrice(dto.getPrice());
        course.setLevel(dto.getLevel());
        return toDTO(courseRepository.save(course));
    }

    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }

    public ReviewDTO addReview(String userEmail, Long courseId, ReviewDTO dto) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        if (reviewRepository.existsByUserIdAndCourseId(user.getId(), courseId)) {
            throw new RuntimeException("You have already reviewed this course");
        }
        
        Review review = Review.builder()
                .user(user)
                .course(course)
                .rating(dto.getRating())
                .comment(dto.getComment())
                .build();
                
        Review saved = reviewRepository.save(review);
        return toReviewDTO(saved);
    }

    public List<ReviewDTO> getCourseReviews(Long courseId) {
        return reviewRepository.findByCourseId(courseId).stream()
                .map(this::toReviewDTO)
                .toList();
    }

    public InstructorAnalyticsDTO getInstructorAnalytics(String instructorEmail) {
        User instructor = userRepository.findByEmail(instructorEmail)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));
                
        List<Course> courses = courseRepository.findByInstructorId(instructor.getId());
        long totalCourses = courses.size();
        long totalStudents = 0;
        double sumRating = 0.0;
        long totalReviewsCount = 0;
        
        List<Map<String, Object>> courseStats = new java.util.ArrayList<>();
        
        for (Course c : courses) {
            long enrollmentsCount = c.getEnrollments() != null ? c.getEnrollments().size() : 0;
            totalStudents += enrollmentsCount;
            
            List<Review> reviews = reviewRepository.findByCourseId(c.getId());
            double avgRating = 0.0;
            if (!reviews.isEmpty()) {
                avgRating = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
                sumRating += avgRating;
                totalReviewsCount++;
            }
            
            Map<String, Object> stat = new HashMap<>();
            stat.put("courseId", c.getId());
            stat.put("courseTitle", c.getTitle());
            stat.put("enrollmentsCount", enrollmentsCount);
            stat.put("averageRating", Math.round(avgRating * 10.0) / 10.0);
            courseStats.add(stat);
        }
        
        double overallAverageRating = totalReviewsCount > 0 ? (sumRating / totalReviewsCount) : 0.0;
        
        return InstructorAnalyticsDTO.builder()
                .totalCourses(totalCourses)
                .totalStudents(totalStudents)
                .averageRating(Math.round(overallAverageRating * 10.0) / 10.0)
                .courseEnrollmentStats(courseStats)
                .build();
    }

    private CourseDTO toDTO(Course c) {
        CourseDTO dto = new CourseDTO();
        dto.setId(c.getId());
        dto.setTitle(c.getTitle());
        dto.setDescription(c.getDescription());
        dto.setPrice(c.getPrice());
        dto.setThumbnail(c.getThumbnail());
        dto.setLevel(c.getLevel());
        dto.setInstructorName(c.getInstructor() != null ? c.getInstructor().getName() : "");
        dto.setTotalLessons(c.getLessons() != null ? c.getLessons().size() : 0);
        
        // Compute reviews metrics
        List<Review> reviews = reviewRepository.findByCourseId(c.getId());
        dto.setTotalReviews(reviews.size());
        if (!reviews.isEmpty()) {
            double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
            dto.setAverageRating(Math.round(avg * 10.0) / 10.0);
        } else {
            dto.setAverageRating(0.0);
        }

        // First lesson's videoUrl as course preview
        if (c.getLessons() != null && !c.getLessons().isEmpty()) {
            c.getLessons().stream()
                .filter(l -> l.getVideoUrl() != null && !l.getVideoUrl().isBlank())
                .findFirst()
                .ifPresent(l -> dto.setPreviewVideoUrl(l.getVideoUrl()));
        }
        return dto;
    }

    private ReviewDTO toReviewDTO(Review r) {
        return ReviewDTO.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .studentName(r.getUser().getName())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
