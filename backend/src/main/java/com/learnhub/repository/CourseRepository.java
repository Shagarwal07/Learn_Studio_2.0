package com.learnhub.repository;

import com.learnhub.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByInstructorId(Long instructorId);

    @Query("SELECT c FROM Course c WHERE LOWER(c.title) LIKE LOWER(CONCAT('%',:keyword,'%'))")
    List<Course> searchByTitle(String keyword);

    Page<Course> findByTitleContainingIgnoreCaseAndLevel(String title, Course.Level level, Pageable pageable);
    
    Page<Course> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    
    Page<Course> findByLevel(Course.Level level, Pageable pageable);
}
