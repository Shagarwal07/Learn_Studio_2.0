package com.learnhub.repository;

import com.learnhub.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {
    List<Test> findByBatchId(Long batchId);
    List<Test> findByBatchIdAndSubjectName(Long batchId, String subjectName);
}
