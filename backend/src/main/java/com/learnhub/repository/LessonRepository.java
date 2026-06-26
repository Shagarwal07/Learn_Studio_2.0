package com.learnhub.repository;

import com.learnhub.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByCourseIdOrderByPosition(Long courseId);
    Optional<Lesson> findByIdAndCourseId(Long id, Long courseId);
}
