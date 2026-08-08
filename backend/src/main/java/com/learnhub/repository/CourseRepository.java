package com.learnhub.repository;

import com.learnhub.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByInstructorId(Long instructorId);

    @Query("SELECT c FROM Course c WHERE LOWER(c.title) LIKE LOWER(CONCAT('%',:keyword,'%'))")
    List<Course> searchByTitle(@Param("keyword") String keyword);

    Page<Course> findByTitleContainingIgnoreCaseAndLevel(String title, Course.Level level, Pageable pageable);
    
    Page<Course> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    
    Page<Course> findByLevel(Course.Level level, Pageable pageable);

    List<Course> findAll();

    Page<Course> findAll(Pageable pageable);

    Optional<Course> findById(Long id);
}
