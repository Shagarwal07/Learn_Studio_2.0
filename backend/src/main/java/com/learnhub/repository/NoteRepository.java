package com.learnhub.repository;

import com.learnhub.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByCourseId(Long courseId);
    List<Note> findByCourseIdAndIsVisibleTrue(Long courseId);
    List<Note> findByCourseIdAndTitleContainingIgnoreCaseAndIsVisibleTrue(Long courseId, String title);
    List<Note> findByLessonId(Long lessonId);
    List<Note> findByBatchId(Long batchId);
    List<Note> findByBatchIdAndSubjectName(Long batchId, String subjectName);
}
