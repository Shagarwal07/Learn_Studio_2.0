package com.learnhub.repository;

import com.learnhub.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentIdOrderByDateDesc(Long studentId);
    Optional<Attendance> findByStudentIdAndSubjectNameAndDate(Long studentId, String subjectName, LocalDate date);
    List<Attendance> findByBatchId(Long batchId);
    List<Attendance> findByBatchIdAndSubjectNameAndDate(Long batchId, String subjectName, LocalDate date);
    void deleteByStudentId(Long studentId);

    void deleteByBatchId(Long batchId);
}
