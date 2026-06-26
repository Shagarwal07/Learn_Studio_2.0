package com.learnhub.repository;

import com.learnhub.entity.AgentExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AgentExecutionLogRepository extends JpaRepository<AgentExecutionLog, Long> {
    List<AgentExecutionLog> findByExamRequestIdOrderByCreatedAtAsc(Long requestId);
    List<AgentExecutionLog> findByExamRequestId(Long requestId);
}
