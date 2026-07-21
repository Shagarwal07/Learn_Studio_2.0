package com.learnhub.mapper;

import com.learnhub.dto.CourseDTO;
import com.learnhub.entity.Course;
import com.learnhub.entity.Lesson;
import com.learnhub.entity.Review;
import com.learnhub.repository.ReviewRepository;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Mapper(componentModel = "spring")
public abstract class CourseMapper {

    @Autowired
    private ReviewRepository reviewRepository;

    @Mapping(target = "instructorName", source = "instructor.name")
    @Mapping(target = "totalLessons", expression = "java(course.getLessons() != null ? course.getLessons().size() : 0)")
    @Mapping(target = "previewVideoUrl", ignore = true)
    @Mapping(target = "averageRating", ignore = true)
    @Mapping(target = "totalReviews", ignore = true)
    public abstract CourseDTO toDTO(Course course);

    @AfterMapping
    protected void enrichCourseDTO(Course course, @MappingTarget CourseDTO.CourseDTOBuilder dtoBuilder) {
        // Compute reviews metrics
        List<Review> reviews = reviewRepository.findByCourseId(course.getId());
        dtoBuilder.totalReviews(reviews.size());
        if (!reviews.isEmpty()) {
            double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
            dtoBuilder.averageRating(Math.round(avg * 10.0) / 10.0);
        } else {
            dtoBuilder.averageRating(0.0);
        }

        // First lesson's videoUrl as course preview
        if (course.getLessons() != null && !course.getLessons().isEmpty()) {
            course.getLessons().stream()
                .filter(l -> l.getVideoUrl() != null && !l.getVideoUrl().isBlank())
                .findFirst()
                .ifPresent(l -> dtoBuilder.previewVideoUrl(l.getVideoUrl()));
        }
    }
}
