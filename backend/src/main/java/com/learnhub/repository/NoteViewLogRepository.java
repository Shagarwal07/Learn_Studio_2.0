package com.learnhub.repository;

import com.learnhub.entity.NoteViewLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NoteViewLogRepository extends JpaRepository<NoteViewLog, Long> {
    List<NoteViewLog> findByNoteId(Long noteId);
    List<NoteViewLog> findByUserId(Long userId);
}
