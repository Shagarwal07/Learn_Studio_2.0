package com.learnhub.repository;

import com.learnhub.entity.OnlineActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OnlineActivityLogRepository extends JpaRepository<OnlineActivityLog, Long> {
    List<OnlineActivityLog> findByStudentIdOrderByDateDesc(Long studentId);
}
