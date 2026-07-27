package com.learnhub.repository;

import com.learnhub.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByCourseId(Long courseId);
    List<Note> findByCourseIdAndIsVisibleTrue(Long courseId);
    List<Note> findByCourseIdAndTitleContainingIgnoreCaseAndIsVisibleTrue(Long courseId, String title);
    List<Note> findByLessonId(Long lessonId);
    List<Note> findByBatchId(Long batchId);
    List<Note> findByBatchIdAndSubjectName(Long batchId, String subjectName);
    boolean existsByPublicId(String publicId);
    java.util.Optional<Note> findByPublicId(String publicId);
    List<Note> findByUploadedById(Long uploadedById);

    @Query("SELECT n FROM Note n WHERE n.course.id = :courseId AND n.isVisible = true AND (n.batch IS NULL OR n.batch.id = :batchId)")
    List<Note> findByCourseIdAndBatchIdOrBatchNull(@Param("courseId") Long courseId, @Param("batchId") Long batchId);

    @Query("SELECT n FROM Note n WHERE n.course.id = :courseId AND n.isVisible = true AND n.batch IS NULL")
    List<Note> findByCourseIdAndBatchIsNull(@Param("courseId") Long courseId);

    @Query("SELECT n FROM Note n WHERE n.driveBackedUp = false OR n.driveBackedUp IS NULL")
    List<Note> findPendingDriveBackupNotes();
}
