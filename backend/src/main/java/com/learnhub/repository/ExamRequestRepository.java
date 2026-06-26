package com.learnhub.repository;

import com.learnhub.entity.ExamRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamRequestRepository extends JpaRepository<ExamRequest, Long> {
}
